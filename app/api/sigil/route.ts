import OpenAI from "openai";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api-auth";
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

type SigilPayload = {
  intent?: string;
  artifact?: Record<string, unknown>;
};

const model = getOpenAIModel();
const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);

function safeString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function safeArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;

  const normalized = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
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

function normalizeAiSigil(artifact: Record<string, unknown>, ai: Record<string, unknown> | null) {
  if (!ai) return artifact;

  return {
    ...artifact,
    refinedIntent: safeString(ai.refinedIntent, safeString(artifact.refinedIntent)),
    symbolMeaning: safeString(ai.symbolMeaning, safeString(artifact.symbolMeaning)),
    activationGuide: safeString(ai.activationGuide, safeString(artifact.activationGuide)),
    actionAnchor: safeString(ai.actionAnchor, safeString(artifact.actionAnchor)),
    reflectionPrompt: safeString(ai.reflectionPrompt, safeString(artifact.reflectionPrompt)),
    avoidNote: safeString(ai.avoidNote, safeString(artifact.avoidNote)),
    energyNotes: safeArray(ai.energyNotes, safeArray(artifact.energyNotes, [])),
    aiGenerated: true
  };
}

function buildPrompt(intent: string, artifact: Record<string, unknown>) {
  return `
用户正向意图：
${intent}

系统已完成符印几何生成，AI 不需要重画图，只负责解释和指导：
${JSON.stringify(
  {
    title: artifact.title,
    hash: artifact.hash,
    createdAt: artifact.createdAt,
    dotsCount: Array.isArray(artifact.dots) ? artifact.dots.length : 0
  },
  null,
  2
)}

你是现代 Sigil 符印设计顾问，结合心理学、符号学、意图蒸馏、神圣几何美学进行解读。

严格要求：
- 不要承诺一定显化、发财、治病或改变命运。
- 不要恐吓，不要神神叨叨。
- 把符印定位为「行动锚点、潜意识提醒、专注仪式」。
- 文字要有高级感、温柔、清晰、可执行。
- 必须输出严格 JSON，不要 Markdown。

输出 JSON：
{
  "refinedIntent": "把用户意图改写成一句肯定、现在式、无匮乏感的中文意图",
  "symbolMeaning": "160-240字，解释这个符印如何承载意图、几何秩序、潜意识提醒",
  "activationGuide": "120-180字，给出安全、日常、可执行的激活方式",
  "actionAnchor": "一句当天可做的行动锚点，必须具体",
  "reflectionPrompt": "一个让用户自我觉察的问题",
  "avoidNote": "一句提醒用户不要过度执着或逃避现实行动",
  "energyNotes": ["3-5条短句，分别说明专注、边界、行动、复盘等"]
}
`;
}

export async function POST(request: Request) {
  try {
    const limited = rateLimitRequest(request, { scope: "sigil", limit: 10, windowMs: 60_000 });
    if (limited) return limited;

    const { errorResponse } = await requireAuthenticatedUser(request);
    if (errorResponse) return errorResponse;

    const body = (await request.json().catch(() => ({}))) as SigilPayload;
    const intent = safeString(body.intent);
    const artifact = body.artifact && typeof body.artifact === "object" ? body.artifact : {};

    if (!intent || !Object.keys(artifact).length) {
      return NextResponse.json({ error: "缺少符印意图或几何资料。" }, { status: 400 });
    }

    if (!hasOpenAIKey) {
      return NextResponse.json(
        {
          error: "服务器还没有设置 OPENAI_API_KEY，无法生成 AI 符印解读。",
          configured: false,
          model,
          artifact
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
      max_output_tokens: 1400,
      ...getResponseReasoningOptions(model),
      instructions:
        "你是现代 Sigil 符印与神圣几何解释顾问。你不会重新生成图形，只输出符号意义、激活方式和行动锚点。必须严格输出 JSON。",
      input: buildPrompt(intent, artifact)
    });

    const text = typeof response.output_text === "string" ? response.output_text : "";
    const parsed = extractJsonObject(text);

    return NextResponse.json({
      configured: true,
      model: usedModel,
      fallbackUsed,
      artifact: normalizeAiSigil(artifact, parsed),
      rawUsed: !parsed
    });
  } catch (error) {
    console.error("OpenAI sigil error", getOpenAIErrorMessage(error));
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
