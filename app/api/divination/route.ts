import OpenAI from "openai";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api-auth";
import { getMingliKnowledgeContext, meihuaPromptGuardrails } from "@/lib/mingli-knowledge";
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

type DivinationPayload = {
  numbers?: string[];
  selectedDate?: string;
  reading?: Record<string, unknown>;
};

const model = getOpenAIModel();
const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);

function safeString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function safeNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(1, Math.min(100, Math.round(value))) : fallback;
}

function safeObjectArray<T extends Record<string, unknown>>(value: unknown, fallback: T[], keys: Array<keyof T>) {
  if (!Array.isArray(value)) return fallback;

  const normalized = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const output: Record<string, unknown> = {};

      keys.forEach((key) => {
        output[String(key)] = typeof record[String(key)] === "number" ? record[String(key)] : safeString(record[String(key)]);
      });

      return output as T;
    })
    .filter((item): item is T => Boolean(item))
    .slice(0, 6);

  return normalized.length ? normalized : fallback;
}

function extractJsonObject(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] || text;
  const start = fenced.indexOf("{");
  const end = fenced.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) return null;

  try {
    return JSON.parse(fenced.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeAiReading(baseReading: Record<string, unknown>, ai: Record<string, unknown> | null) {
  if (!ai) return baseReading;

  const energyBoard = safeObjectArray(
    ai.energyBoard,
    (baseReading.energyBoard as Array<Record<string, unknown>> | undefined) || [],
    ["stage", "status", "value", "note"]
  );
  const relationClues = safeObjectArray(
    ai.relationClues,
    (baseReading.relationClues as Array<Record<string, unknown>> | undefined) || [],
    ["stage", "relation", "useTrigram", "extraction", "insight"]
  );
  const clues = safeObjectArray(
    ai.clues,
    (baseReading.clues as Array<Record<string, unknown>> | undefined) || [],
    ["trigram", "title", "people", "behavior", "space", "bodyHint", "prompt"]
  );
  const actionPlan =
    ai.actionPlan && typeof ai.actionPlan === "object"
      ? {
          ...(baseReading.actionPlan as Record<string, unknown> | undefined),
          ...(ai.actionPlan as Record<string, unknown>)
        }
      : baseReading.actionPlan;

  return {
    ...baseReading,
    score: safeNumber(ai.score, safeNumber(baseReading.score, 60)),
    bodyUseRelation: safeString(ai.bodyUseRelation, safeString(baseReading.bodyUseRelation)),
    finalRelation: safeString(ai.finalRelation, safeString(baseReading.finalRelation)),
    situation: safeString(ai.situation, safeString(baseReading.situation)),
    process: safeString(ai.process, safeString(baseReading.process)),
    outcome: safeString(ai.outcome, safeString(baseReading.outcome)),
    mindset: safeString(ai.mindset, safeString(baseReading.mindset)),
    energyBoard,
    relationClues,
    clues,
    actionPlan
  };
}

function buildPrompt(reading: Record<string, unknown>, numbers: string[], selectedDate: string) {
  const query = `${safeString(reading.originalHexagram)} ${safeString(reading.mutualHexagram)} ${safeString(
    reading.changingHexagram
  )} ${safeString(reading.bodyUseRelation)} 三数起卦 梅花易数 体用 生克 类象`;
  const knowledgeContext = getMingliKnowledgeContext({
    query,
    category: "meihua",
    maxChars: 5600
  });

  return `
用户输入三数：${numbers.join(" / ")}
起卦时间：${selectedDate || safeString(reading.createdAt)}

系统已完成底盘计算，AI 只负责深化解读，不得改动本卦、互卦、变卦、动爻、体卦、用卦：
${JSON.stringify(reading, null, 2)}

${meihuaPromptGuardrails}

${knowledgeContext}

请按「专业梅花易数 + 现代决策顾问」风格输出，必须遵守：
- 先讲体用生克，再讲卦象，不可孤立解释。
- 本卦看现状，互卦看过程和隐藏夹层，变卦看最终走向。
- 每一阶段必须有吉凶能量值、现代生活/商业翻译、风险和行动方向。
- Clue 不是直接答案，而是让用户对号入座的现实线索：人物、场景、身体提醒、方向、物件。
- 输出温暖、笃定、专业，不要江湖口吻，不制造恐惧。
- 不构成金融、医疗、法律或重大决策建议。

输出必须是严格 JSON，不要 Markdown，不要解释 JSON：
{
  "score": 1-100,
  "bodyUseRelation": "体用关系短句",
  "finalRelation": "最终关系短句",
  "situation": "现状定位，220-320字，必须引用本卦与体用生克",
  "process": "过程推演，220-320字，必须引用互卦与隐藏阻力",
  "outcome": "最终走向，220-320字，必须引用变卦与投入回报",
  "mindset": "今日战略心法，120-180字",
  "energyBoard": [
    {"stage":"当下（本卦）","status":"中吉/小凶/考验等","value":60,"note":"阶段说明"},
    {"stage":"过程（互卦）","status":"...","value":40,"note":"阶段说明"},
    {"stage":"结果（变卦）","status":"...","value":55,"note":"阶段说明"}
  ],
  "relationClues": [
    {"stage":"当下（本卦）","relation":"体克用等","useTrigram":"☷ 坤卦","extraction":"该关系下应提取什么象意","insight":"现实线索与启发问题"}
  ],
  "clues": [
    {"trigram":"兑","title":"口舌与沟通","people":"...","behavior":"...","space":"...","bodyHint":"...","prompt":"启发式提问"}
  ],
  "actionPlan": {
    "timing":"具体时间窗口",
    "direction":"具体方位",
    "color":"颜色建议",
    "object":"物件建议",
    "action":"当天可执行动作",
    "mantra":"一句心法"
  }
}
`;
}

export async function POST(request: Request) {
  try {
    const limited = rateLimitRequest(request, { scope: "divination", limit: 12, windowMs: 60_000 });
    if (limited) return limited;

    const { errorResponse } = await requireAuthenticatedUser(request);
    if (errorResponse) return errorResponse;

    const body = (await request.json().catch(() => ({}))) as DivinationPayload;
    const reading = body.reading && typeof body.reading === "object" ? body.reading : {};
    const numbers = Array.isArray(body.numbers) ? body.numbers.map(String) : [];

    if (!Object.keys(reading).length) {
      return NextResponse.json({ error: "缺少三数起卦底盘资料。" }, { status: 400 });
    }

    if (!hasOpenAIKey) {
      return NextResponse.json(
        {
          error: "服务器还没有设置 OPENAI_API_KEY，无法生成 AI 问卦解读。",
          configured: false,
          model,
          reading
        },
        { status: 500 }
      );
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 35000
    });

    const { response, model: usedModel, fallbackUsed } = await createOpenAIResponseWithFallback(client, {
      model,
      max_output_tokens: 3600,
      ...getResponseReasoningOptions(model),
      instructions:
        "你是九运智慧三数起卦的专业梅花易数与现代决策顾问。你必须尊重系统提供的本卦、互卦、变卦、体卦、用卦，不可重新起卦。你只输出严格 JSON。",
      input: buildPrompt(reading, numbers, safeString(body.selectedDate))
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
    console.error("OpenAI divination error", getOpenAIErrorMessage(error));
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
