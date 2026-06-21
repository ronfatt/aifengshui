import OpenAI from "openai";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api-auth";
import { getMingliKnowledgeContext, hexagramOneWordPromptRules, meihuaPromptGuardrails } from "@/lib/mingli-knowledge";
import {
  createOpenAIResponseWithFallback,
  getOpenAIErrorCode,
  getOpenAIErrorMessage,
  getOpenAIFallbackModel,
  getOpenAIModel,
  getOpenAIUserMessage,
  getResponseReasoningOptions
} from "@/lib/openai-runtime";
import { rateLimitRequest } from "@/lib/rate-limit";

type Hexagram64Mode = "daily" | "question" | "deep";

type Hexagram64Payload = {
  mode?: Hexagram64Mode;
  question?: string;
  reading?: Record<string, unknown>;
};

const model = getOpenAIModel();
const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);

function modeName(mode: Hexagram64Mode) {
  if (mode === "question") return "问事一字";
  if (mode === "deep") return "深度解字";
  return "今日一字";
}

function outputBudget(mode: Hexagram64Mode) {
  if (mode === "deep") return 2200;
  if (mode === "question") return 1500;
  return 950;
}

function modeInstructions(mode: Hexagram64Mode) {
  if (mode === "deep") {
    return `
【深度解字专属要求】
- 这是最高档位，不可只写 80-120 字短签。
- 必须输出：总断、风险分层、应期窗口、行动清单、避坑清单、3-6 个 depthMap 策略节点。
- depthMap 至少包含：现状层、卡点层、时机层、通关层、执行层。
- actionList 至少 4 条，每条必须是用户当天或本周可以做的动作。
- avoidList 至少 3 条，必须具体到场景。
- 如果用户有具体问题，所有判断必须围绕问题，不要泛泛讲运势。`;
  }

  if (mode === "question") {
    return `
【问事一字专属要求】
- 只围绕用户输入的问题判断，不写成大众每日提醒。
- 必须输出明确 verdict、risk、timing、actionList、avoidList。
- actionList 3 条，avoidList 2 条，语言要像老师给决策建议。
- oracle 可比今日一字更长，约 180-260 字。`;
  }

  return `
【今日一字专属要求】
- 这是轻量高频功能，内容要精炼，不沉重。
- oracle 必须保持 80-120 字，像晨间签语。
- actionList 2 条，avoidList 2 条即可。
- 不要展开复杂推理，不要制造焦虑。`;
}

function safeString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function safeArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, 6);
}

function safeDepthMap(value: unknown, fallback: Array<{ title: string; body: string }>) {
  if (!Array.isArray(value)) return fallback;

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const title = safeString(record.title);
      const body = safeString(record.body);
      return title && body ? { title, body } : null;
    })
    .filter((item): item is { title: string; body: string } => Boolean(item))
    .slice(0, 6);
}

function extractJsonObject(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] || text;
  const start = fenced.indexOf("{");
  const end = fenced.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  try {
    return JSON.parse(fenced.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeAiReading(baseReading: Record<string, unknown>, ai: Record<string, unknown> | null) {
  if (!ai) return baseReading;

  const fallbackActions = safeArray(baseReading.actionList, [safeString(baseReading.action, "先确认问题核心，再做一个小动作验证。")]);
  const fallbackAvoids = safeArray(baseReading.avoidList, ["不要临时加码承诺，先守住边界。"]);
  const fallbackDepth = safeDepthMap(baseReading.depthMap, [
    { title: "现状层", body: safeString(baseReading.theme, "先看见当下状态，再决定下一步。") },
    { title: "行动层", body: safeString(baseReading.action, "把复杂问题拆成一个今天能完成的小动作。") }
  ]);

  return {
    ...baseReading,
    word: safeString(ai.word, safeString(baseReading.word, "定心")).slice(0, 4),
    explanation: safeString(ai.explanation, safeString(baseReading.explanation)),
    oracle: safeString(ai.oracle, safeString(baseReading.oracle)),
    theme: safeString(ai.theme, safeString(baseReading.theme)),
    clue: safeString(ai.clue, safeString(baseReading.clue)),
    verdict: safeString(ai.verdict, safeString(baseReading.verdict)),
    risk: safeString(ai.risk, safeString(baseReading.risk)),
    timing: safeString(ai.timing, safeString(baseReading.timing)),
    action: safeString(ai.action, safeString(baseReading.action)),
    actionList: safeArray(ai.actionList, fallbackActions),
    avoidList: safeArray(ai.avoidList, fallbackAvoids),
    depthMap: safeDepthMap(ai.depthMap, fallbackDepth),
    score: typeof ai.score === "number" ? Math.max(1, Math.min(100, Math.round(ai.score))) : baseReading.score
  };
}

function buildPrompt({ mode, question, reading }: { mode: Hexagram64Mode; question: string; reading: Record<string, unknown> }) {
  const knowledgeContext = getMingliKnowledgeContext({
    query: `${question} ${safeString(reading.hexagramTitle)} ${safeString(reading.word)} 六十四卦 一字 梅花 易经`,
    category: "meihua",
    maxChars: mode === "deep" ? 5200 : 3200
  });

  return `
用户选择：${modeName(mode)}
用户问题：${question || "今日状态提醒"}

系统已完成本地起卦底盘，AI 只负责基于底盘做专业转译，不得乱改卦名、上下卦：
${JSON.stringify(reading, null, 2)}

${hexagramOneWordPromptRules}

${meihuaPromptGuardrails}

${knowledgeContext}

${modeInstructions(mode)}

输出必须是严格 JSON，不要 Markdown，不要解释 JSON。
JSON 字段必须包含：
{
  "word": "2-4字关键字",
  "explanation": "说明此字如何从卦象现代意象转出，80-180字",
  "oracle": "神谕断语。今日一字80-120字；问事180-260字；深度260-420字",
  "theme": "此刻主题，短句",
  "clue": "今日线索，不超过30字",
  "verdict": "明确判断：适合/谨慎/暂缓/可推进，以及原因",
  "risk": "核心卡点或风险，不要泛泛",
  "timing": "应期或行动窗口，例如今天/3天/7天/30天",
  "action": "一句总行动建议",
  "actionList": ["具体动作1", "具体动作2", "具体动作3"],
  "avoidList": ["避坑1", "避坑2"],
  "depthMap": [{"title":"现状层","body":"..."}, {"title":"行动层","body":"..."}],
  "score": 1-100
}

质量要求：
- 今日一字、问事一字、深度解字必须明显不同深度。
- 不准把三个档位写成同一种结构。
- 禁止空洞鸡汤。每个风险都要有一个应对动作。
- 不做金融、医疗、法律承诺，只做文化参考与行动提醒。
`;
}

export async function POST(request: Request) {
  try {
    const limited = rateLimitRequest(request, { scope: "hexagram64", limit: 16, windowMs: 60_000 });

    if (limited) return limited;

    const { errorResponse } = await requireAuthenticatedUser(request);

    if (errorResponse) return errorResponse;

    const body = (await request.json().catch(() => ({}))) as Hexagram64Payload;
    const mode = body.mode === "question" || body.mode === "deep" ? body.mode : "daily";
    const reading = body.reading && typeof body.reading === "object" ? body.reading : {};
    const question = safeString(body.question, safeString(reading.question));

    if (!Object.keys(reading).length) {
      return NextResponse.json({ error: "缺少起卦底盘资料。" }, { status: 400 });
    }

    if (!hasOpenAIKey) {
      return NextResponse.json(
        {
          error: "服务器还没有设置 OPENAI_API_KEY，无法生成 AI 一字分析。",
          configured: false,
          model,
          reading
        },
        { status: 500 }
      );
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000
    });

    const { response, model: usedModel, fallbackUsed } = await createOpenAIResponseWithFallback(client, {
      model,
      max_output_tokens: outputBudget(mode),
      ...getResponseReasoningOptions(model),
      instructions:
        "你是周易六十四卦·心易神断师，擅长把卦象转译成现代生活、事业、关系与行动策略。必须严格输出 JSON，不要 Markdown。必须尊重系统给出的卦名、上卦、下卦和问题，不可另起一卦。不同档位要体现明显深度差异。",
      input: buildPrompt({ mode, question, reading })
    });

    const text = typeof response.output_text === "string" ? response.output_text : "";
    const parsed = extractJsonObject(text);

    return NextResponse.json({
      configured: true,
      model: usedModel,
      fallbackUsed,
      reading: normalizeAiReading(reading, parsed),
      rawUsed: !parsed
    });
  } catch (error) {
    console.error("OpenAI hexagram64 error", getOpenAIErrorMessage(error));
    return NextResponse.json(
      {
        error: getOpenAIUserMessage(error),
        errorCode: getOpenAIErrorCode(error),
        model,
        fallbackModel: getOpenAIFallbackModel(model)
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    provider: "openai",
    configured: hasOpenAIKey,
    model,
    fallbackModel: getOpenAIFallbackModel(model),
    endpoint: "responses"
  });
}
