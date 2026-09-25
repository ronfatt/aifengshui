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
  userQuestion?: string;
  selectedDate?: string;
  domainPrimary?: string;
  domainSecondary?: string;
  intake?: Record<string, unknown>;
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

function safeStringArray(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) return fallback;
  return value.map((item) => safeString(item)).filter(Boolean);
}

function safeObjectArray<T extends Record<string, unknown>>(value: unknown, fallback: T[], keys: Array<keyof T>): T[] {
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
    .slice(0, 12);

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

  const executiveBrief = (ai.executiveBrief && typeof ai.executiveBrief === "object" ? ai.executiveBrief : {}) as Record<string, unknown>;
  const decisionIntake = (ai.decisionIntake && typeof ai.decisionIntake === "object" ? ai.decisionIntake : {}) as Record<string, unknown>;
  const evidenceEngine = (ai.evidenceEngine && typeof ai.evidenceEngine === "object" ? ai.evidenceEngine : {}) as Record<string, unknown>;
  const decisionMatrix = Array.isArray(ai.decisionMatrix) ? (ai.decisionMatrix as Record<string, unknown>[]) : [];
  const actionBoard = (ai.actionBoard && typeof ai.actionBoard === "object" ? ai.actionBoard : {}) as Record<string, unknown>;
  const fiveInterventions = (ai.fiveInterventions && typeof ai.fiveInterventions === "object" ? ai.fiveInterventions : {}) as Record<string, unknown>;
  const devilsAdvocate = (ai.devilsAdvocate && typeof ai.devilsAdvocate === "object" ? ai.devilsAdvocate : {}) as Record<string, unknown>;
  const triggers = (ai.triggers && typeof ai.triggers === "object" ? ai.triggers : {}) as Record<string, unknown>;
  const timeline = (ai.timeline && typeof ai.timeline === "object" ? ai.timeline : {}) as Record<string, unknown>;

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
    actionPlan:
      ai.actionPlan && typeof ai.actionPlan === "object"
        ? {
            ...(baseReading.actionPlan as Record<string, unknown> | undefined),
            ...(ai.actionPlan as Record<string, unknown>)
          }
        : baseReading.actionPlan,
    executiveBrief: {
      theme: safeString(executiveBrief.theme, "商业与人生决策"),
      rootQuestion: safeString(executiveBrief.rootQuestion, safeString(baseReading.userQuestion, "核心决策推演")),
      momentum: safeString(executiveBrief.momentum, "主动态势"),
      strategicDirection: safeString(executiveBrief.strategicDirection, "结合现实证据，稳步推进"),
      maxOpportunity: safeString(executiveBrief.maxOpportunity, "把握核心时机与贵人协助"),
      maxRisk: safeString(executiveBrief.maxRisk, "防范信息盲点与过度承诺"),
      keyUnknown: safeString(executiveBrief.keyUnknown, "对方履约意愿与资金到位时间"),
      immediateStep: safeString(executiveBrief.immediateStep, "今日内完成书面确认或第一步沟通")
    },
    decisionIntake: {
      facts: safeStringArray(decisionIntake.facts, ["用户已提交决策问题"]),
      interpretations: safeStringArray(decisionIntake.interpretations, ["对局势发展存在担忧"]),
      emotions: safeStringArray(decisionIntake.emotions, ["期待明确方向"]),
      goal: safeString(decisionIntake.goal, "降低风险，最大化决策收益"),
      unknowns: safeStringArray(decisionIntake.unknowns, ["关键证据与时间节点"])
    },
    evidenceEngine: {
      strong: safeStringArray(evidenceEngine.strong, ["已确认的客观事实"]),
      medium: safeStringArray(evidenceEngine.medium, ["尚需二次核实的迹象"]),
      weak: safeStringArray(evidenceEngine.weak, ["主观猜测与心理判断"]),
      contradictions: safeStringArray(evidenceEngine.contradictions, ["玄学推演与现实数据暂无重大冲突"])
    },
    decisionMatrix,
    actionBoard: {
      immediate72h: safeStringArray(actionBoard.immediate72h, ["完成关键信息核实", "明确书面规则"]),
      observe7_14d: safeStringArray(actionBoard.observe7_14d, ["观察对方履约与态度变化"]),
      stopDoing: safeStringArray(actionBoard.stopDoing, ["停止口头承诺，避免盲目扩张"])
    },
    fiveInterventions: {
      timing: safeString(fiveInterventions.timing, "择吉时推进沟通"),
      place: safeString(fiveInterventions.place, "选择明亮有序的谈判或工作空间"),
      people: safeString(fiveInterventions.people, "寻求合规财务或法律专业人士协助"),
      objects: safeString(fiveInterventions.objects, "准备书面契约或契合五行的用具"),
      action: safeString(fiveInterventions.action, "完成一次书面规则或账目核对（布局必须绑定现实动作）")
    },
    devilsAdvocate: {
      strongestCounterargument: safeString(devilsAdvocate.strongestCounterargument, "如果当前假设成立的前提不存在，最差情况如何？"),
      possibleBiases: safeStringArray(devilsAdvocate.possibleBiases, ["警惕确认偏误与沉没成本"]),
      missingEvidence: safeStringArray(devilsAdvocate.missingEvidence, ["缺乏第三方客观书面证明"]),
      worstCasePlanB: safeString(devilsAdvocate.worstCasePlanB, "设定止损线，启动 Plan B 备用方案")
    },
    triggers: {
      green: safeStringArray(triggers.green, ["条件满足，顺利推进"]),
      yellow: safeStringArray(triggers.yellow, ["进度延期，书面复核"]),
      orange: safeStringArray(triggers.orange, ["承诺落空，升级谈判"]),
      red: safeStringArray(triggers.red, ["触及底线，启动止损"])
    },
    timeline: {
      immediate72h: safeString(timeline.immediate72h, "0-72小时：完成第一步核实"),
      shortTerm14d: safeString(timeline.shortTerm14d, "7-14天：密切观察态势"),
      mediumTerm30d: safeString(timeline.mediumTerm30d, "30天：节点复盘与阶段检查"),
      turningPoint: safeString(timeline.turningPoint, "若出现红灯信号，权衡启动止损")
    }
  };
}

function buildPrompt(reading: Record<string, unknown>, numbers: string[], userQuestion: string, selectedDate: string) {
  const query = `${safeString(userQuestion)} ${safeString(reading.originalHexagram)} ${safeString(reading.mutualHexagram)} ${safeString(
    reading.changingHexagram
  )} ${safeString(reading.bodyUseRelation)} 东方人生与商业决策 梅花易数 体用 生克 双轨验证`;
  const knowledgeContext = getMingliKnowledgeContext({
    query,
    category: "meihua",
    maxChars: 5600
  });

  return `
你是「AI 东方智慧决策系统 (AI Eastern Wisdom Decision System)」的 AI 决策引擎。
你的任务不是单纯断吉凶，而是根据「问 → 卦 → 势 → 体 → 证 → 险 → 策 → 局 → 验」9层内核，给出高可执行度的人生与商业决策策略。

用户自然语言提问/决策主题：${userQuestion || "通用决策起卦"}
用户起卦三数：${numbers.join(" / ") || "系统起卦"}
起卦时间：${selectedDate || safeString(reading.createdAt)}

系统已完成术数底盘计算，AI 必须严格尊重系统算出的本卦、互卦、变卦、动爻、体卦、用卦，不得自行修改底盘：
${JSON.stringify(reading, null, 2)}

${meihuaPromptGuardrails}

${knowledgeContext}

系统核心规范：
1. 双轨验证：严格区分玄学术数判断层（本卦/互卦/变卦/体用生克）与现实证据层（事实 Fact / 推测 Interpretation / 情绪 Emotion / 目标 Goal）。冲突时不得抹杀现实数据。
2. 态势判定：从“主动态势 / 谨慎推进 / 等待确认 / 先补资料 / 优先止损 / 暂缓决定”中给出核心态势。
3. 五行战略翻译：木(增长/行动)、火(沟通/曝光/确认)、土(制度/流程/稳定)、金(规则/财务/纪律)、水(现金流/渠道/流动)。
4. 5D 战略风水：天时·地利·人和·物用·事为 — 【任何布局必须绑定一个现实动作】。
5. AI 反方验证 (Devil's Advocate)：必须主动挑战当前判断（最可能错在哪里、沉没成本、最坏情况 Plan B）。
6. 安全边界：高风险医疗、法律、财务决策提示专业人士建议；感情问题不强行猜测第三方内心。

请输出严格 JSON（不要 Markdown 格式，不要解释）：
{
  "score": 1-100,
  "bodyUseRelation": "体用关系短句",
  "finalRelation": "最终关系短句",
  "situation": "现状定位（引用本卦与体用生克，220-300字）",
  "process": "过程推演（引用互卦与隐秘夹层阻力，220-300字）",
  "outcome": "最终走向（引用变卦与投入回报比，220-300字）",
  "mindset": "今日战略心法（120-180字）",
  "executiveBrief": {
    "theme": "决策主题",
    "rootQuestion": "核心问题",
    "momentum": "主动态势 / 谨慎推进 / 等待确认 / 先补资料 / 优先止损 / 暂缓决定",
    "strategicDirection": "一句话战略方向",
    "maxOpportunity": "最大机会点",
    "maxRisk": "最大风险点",
    "keyUnknown": "关键未知数",
    "immediateStep": "现在第一步行动"
  },
  "decisionIntake": {
    "facts": ["已知客观事实1", "事实2"],
    "interpretations": ["主观推测1", "推测2"],
    "emotions": ["情绪状态说明"],
    "goal": "用户核心目标",
    "unknowns": ["尚未确认的关键未知数1", "未知数2"]
  },
  "evidenceEngine": {
    "strong": ["强现实证据1", "强证据2"],
    "medium": ["中等迹象1"],
    "weak": ["主观感觉/第三方猜测"],
    "contradictions": ["现实证据与卦象冲突与否的判定"]
  },
  "decisionMatrix": [
    {
      "option": "方案 A：主动推进 / 原方案",
      "targetFit": "高/中/低",
      "return": "预期收益",
      "risk": "最大风险",
      "cost": "时间/金钱成本",
      "reversibility": "高/中/低",
      "hexagramSignal": "卦象信号解读",
      "evidenceSupport": "现实证据支持度"
    },
    {
      "option": "方案 B：条件式等待 / 补充资料",
      "targetFit": "高/中/低",
      "return": "预期收益",
      "risk": "最大风险",
      "cost": "时间/金钱成本",
      "reversibility": "高/中/低",
      "hexagramSignal": "卦象信号解读",
      "evidenceSupport": "现实证据支持度"
    }
  ],
  "actionBoard": {
    "immediate72h": ["0-72小时立即做1", "立即做2"],
    "observe7_14d": ["7-14天重点观察1", "观察2"],
    "stopDoing": ["停止做1", "停止做2"]
  },
  "fiveInterventions": {
    "timing": "天时：沟通/行动时机",
    "place": "地利：空间/方位/环境",
    "people": "人和：关键角色/合作者",
    "objects": "物用：文件/物件/颜色",
    "action": "事为：【必须履行的现实动作】"
  },
  "devilsAdvocate": {
    "strongestCounterargument": "如果当前判断错了，最可能错在哪里？",
    "possibleBiases": ["偏误点1", "偏误点2"],
    "missingEvidence": ["最缺少的关键证据"],
    "worstCasePlanB": "最坏情况下的 Plan B 止损方案"
  },
  "triggers": {
    "green": ["绿灯条件：顺利推进"],
    "yellow": ["黄灯条件：补充核实"],
    "orange": ["橙灯条件：风险升温，暂停升级"],
    "red": ["红灯条件：触及底线，启动止损"]
  },
  "timeline": {
    "immediate72h": "0-72小时要点",
    "shortTerm14d": "7-14天观察要点",
    "mediumTerm30d": "30天检查节点",
    "turningPoint": "关键转折触发条件"
  },
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
    const userQuestion = safeString(body.userQuestion, safeString(reading.userQuestion));

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
      max_output_tokens: 4200,
      ...getResponseReasoningOptions(model),
      instructions:
        "你是 AI 东方智慧决策系统 (AI Eastern Wisdom Decision System) 的决策引擎。你遵循「问→卦→势→体→证→险→策→局→验」内核，严密结合东方术数与现实证据进行决策推演。你只输出严格 JSON。",
      input: buildPrompt(reading, numbers, userQuestion, safeString(body.selectedDate))
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
