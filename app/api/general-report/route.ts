import OpenAI from "openai";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api-auth";
import { getMingliKnowledgeContext, meihuaPromptGuardrails } from "@/lib/mingli-knowledge";
import { rateLimitRequest } from "@/lib/rate-limit";
import { normalizeAiReportPayload } from "@/lib/report-json";

type GeneralReportBody = {
  reportTitle?: string;
  reportTag?: string;
  points?: number;
  subject?: {
    fullName?: string;
    gender?: string;
    birthDate?: string;
    birthTime?: string;
    birthLocation?: string;
    calendarType?: "Gregorian" | "Lunar";
    lunarDate?: string;
    birthHourBranch?: string;
    focus?: string;
    questionCategory?: string;
    specificQuestion?: string;
    divinationDateTime?: string;
    manualNumbers?: string;
    mode?: "random" | "time";
  };
};

const model = process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || "gpt-5.4-mini";
const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);
const reasoningEffort = model === "gpt-5" ? "minimal" : "none";

const reportFocusMap: Record<string, string> = {
  财运报告: "财富、现金流、正偏财机会与风险",
  事业报告: "事业定位、职场发展、领导力、合作窗口",
  合盘报告: "关系互动、双方节奏、沟通与长期适配",
  流年报告: "年度主题、大运流年、阶段机会与风险",
  开业择日报告: "开业时机、负责人适配、空间启动与行动窗口",
  公司风水初步分析: "企业发展、空间布局、团队节奏与商业决策"
};

function fallbackReport(body: GeneralReportBody) {
  const title = body.reportTitle || "AI 命理报告";
  const name = body.subject?.fullName || "用户";
  const focus = reportFocusMap[title] || title;

  return {
    configured: false,
    model,
    summary: `${name} 的${title}已根据四术框架生成：八字看命局底盘，紫微看阶段宫位，梅花看当前时机，数字命理看行为节奏。重点围绕${focus}给出参考建议。`,
    sections: [
      {
        title: "八字命理：底层资源",
        content: "从出生年月日时观察五行强弱、日主状态、十神倾向与大运流年基础，判断此主题的底层承载力、资源结构与长期适配度。"
      },
      {
        title: "紫微斗数：阶段宫位",
        content: "从命宫、身宫、官禄宫、财帛宫、夫妻/交友宫与大限流年观察当前阶段的机会、贵人、压力来源与可放大的优势。"
      },
      {
        title: "梅花易数：当下时机",
        content: `围绕「${body.subject?.specificQuestion || focus}」观察现状、阻力、转折和结果。若信号未稳，建议先验证与复盘；若条件成熟，再逐步推进。`
      },
      {
        title: "数字命理：执行节奏",
        content: "用生命路径、个人年和数字能量观察行动习惯、沟通方式、年度主题与执行节奏，避免方向正确但节奏失衡。"
      },
      {
        title: "综合行动建议",
        content: "重大事项先判断方向，再确认时机，最后检查资源、人和、预算与风险边界。此报告仅供文化参考与个人规划，不构成专业建议。"
      }
    ]
  };
}

export async function POST(request: Request) {
  const limited = rateLimitRequest(request, { scope: "general-report", limit: 8, windowMs: 60_000 });

  if (limited) {
    return limited;
  }

  const { errorResponse } = await requireAuthenticatedUser(request);

  if (errorResponse) {
    return errorResponse;
  }

  const body = (await request.json().catch(() => ({}))) as GeneralReportBody;

  if (!hasOpenAIKey) {
    return NextResponse.json(fallbackReport(body));
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 45000 });
    const title = body.reportTitle || "AI 命理报告";
    const focus = reportFocusMap[title] || title;
    const knowledgeQuery = `${title} ${focus} ${body.subject?.specificQuestion || ""} ${body.subject?.questionCategory || ""}`;
    const knowledgeCategory = knowledgeQuery.includes("六爻") || knowledgeQuery.includes("用神") || knowledgeQuery.includes("世爻") || knowledgeQuery.includes("应爻")
      ? "liuyao"
      : title.includes("梅花") || body.subject?.questionCategory
        ? "meihua"
        : undefined;
    const knowledgeContext = getMingliKnowledgeContext({
      query: knowledgeQuery,
      category: knowledgeCategory,
      maxChars: 4200
    });

    const response = await client.responses.create({
      model,
      max_output_tokens: 1900,
      reasoning: { effort: reasoningEffort },
      instructions:
        "你是易玺老师的一般付费命理报告助理。请用中文生成专业、稳重、可执行的报告内容。所有一般报告都必须用四术框架：八字命理、紫微斗数、梅花易数、数字命理。不要写成普通 AI 建议，也不要只写单一命理体系。输出必须是严格 JSON：{\"summary\":\"...\",\"sections\":[{\"title\":\"...\",\"content\":\"...\"}]}。summary 不超过 150 字，sections 需要 5-7 个，每段 100-200 字，不要 Markdown。不要绝对化，不要提供金融、法律、医疗或专业建议。",
      input: `
报告类型：${title}
报告重点：${focus}
用户与问题资料：
${JSON.stringify(body.subject || {}, null, 2)}
${knowledgeContext}
${meihuaPromptGuardrails}

必须覆盖：
1. 八字命理：五行强弱、十神倾向、日主承载、大运流年基础，如何影响「${title}」
2. 紫微斗数：对应宫位与阶段趋势，如何影响「${title}」
3. 梅花易数：围绕具体问题或报告主题，判断当前时机、阻力、转折、结果
4. 数字命理：生命路径、个人年、执行节奏，如何影响「${title}」
5. 四术交叉结论：一致信号、冲突信号、风险点
6. 30-90 天行动建议

免责声明必须自然融入：本报告基于传统命理与数字命理原则，仅供文化参考、自我觉察与个人规划，不构成金融、法律、医疗或其他专业建议。
`
    });

    const text = response.output_text?.trim() || "";
    const parsed = normalizeAiReportPayload(text, fallbackReport(body), 7);

    return NextResponse.json({
      configured: true,
      model,
      summary: parsed.summary || fallbackReport(body).summary,
      sections: parsed.sections?.length ? parsed.sections.slice(0, 7) : fallbackReport(body).sections
    });
  } catch (error) {
    console.error("General report generation error", error);
    return NextResponse.json(fallbackReport(body));
  }
}
