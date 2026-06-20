import OpenAI from "openai";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api-auth";
import { getMingliKnowledgeContext, meihuaPromptGuardrails } from "@/lib/mingli-knowledge";
import { rateLimitRequest } from "@/lib/rate-limit";
import { normalizeAiReportPayload } from "@/lib/report-json";
import { getMingliCalendar } from "@/lib/mingli-calendar";
import { getZiweiChart } from "@/lib/ziwei-engine";
import { getOpenAIErrorMessage, getOpenAIModel, getResponseReasoningOptions } from "@/lib/openai-runtime";

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

const model = getOpenAIModel();
const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);

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
  const calendar = getMingliCalendar(body.subject?.birthDate, body.subject?.birthTime, body.subject?.calendarType || "Gregorian");
  const ziweiChart = getZiweiChart(body.subject);
  const baseLine = calendar
    ? `系统已按出生资料换算：公历 ${calendar.solarDate} ${calendar.solarTime}，农历 ${calendar.lunarDateText}，四柱 ${calendar.fourPillarsText}，日主 ${calendar.dayMaster}，生肖 ${calendar.zodiac}。`
    : "出生资料不足，系统暂时无法换算完整四柱；请补齐生日、出生时间与历法类型后再生成更完整报告。";
  const ziweiLine = ziweiChart
    ? `紫微基础盘显示命宫在${ziweiChart.mainPalaceBranch}，身宫在${ziweiChart.bodyPalaceBranch}，五行局为${ziweiChart.fiveElementName || "待校准"}。`
    : "紫微基础盘暂未生成，报告以现有资料做保守参考。";

  return {
    configured: false,
    model,
    summary: `${name} 的${title}已根据现有命理资料生成。${calendar ? `日主${calendar.dayMaster}，生肖${calendar.zodiac}，` : ""}重点围绕${focus}给出参考建议。`,
    sections: [
      {
        title: "八字命理：底层资源",
        content: `${baseLine} 本节以日主、五行强弱、十神倾向与大运流年基础，判断此主题的底层承载力、资源结构与长期适配度。`
      },
      {
        title: "紫微斗数：阶段宫位",
        content: `${ziweiLine} 本节从命宫、身宫、官禄宫、财帛宫、夫妻/交友宫与大限流年观察当前阶段的机会、贵人、压力来源与可放大的优势。`
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
    const calendar = getMingliCalendar(body.subject?.birthDate, body.subject?.birthTime, body.subject?.calendarType || "Gregorian");
    const ziweiChart = getZiweiChart(body.subject);

    const response = await client.responses.create({
      model,
      max_output_tokens: 1900,
      ...getResponseReasoningOptions(model),
      instructions:
        "你是易玺老师的一般付费命理报告助理。请用中文生成专业、稳重、可执行的报告内容。所有一般报告都必须用四术框架：八字命理、紫微斗数、梅花易数、数字命理。不要写成普通 AI 建议，也不要只写单一命理体系。输出必须是严格 JSON：{\"summary\":\"...\",\"sections\":[{\"title\":\"...\",\"content\":\"...\"}]}。summary 不超过 150 字，sections 需要 5-7 个，每段 100-200 字，不要 Markdown。不要绝对化，不要提供金融、法律、医疗或专业建议。",
      input: `
报告类型：${title}
报告重点：${focus}
用户与问题资料：
${JSON.stringify(body.subject || {}, null, 2)}

真实万年历与四柱资料（必须优先采用，不可自行改写）：
${JSON.stringify(calendar, null, 2)}

紫微斗数基础盘资料（必须优先采用，不可自行编造宫位、主星、四化）：
${JSON.stringify(ziweiChart, null, 2)}

${knowledgeContext}
${meihuaPromptGuardrails}

必须覆盖：
1. 八字命理：必须引用系统提供的公历/农历/四柱/日主；若资料缺失，明确写资料不足，不可猜测
2. 紫微斗数：必须引用系统提供的命宫/身宫/十二宫/主星资料；若资料缺失，明确写资料不足，不可猜测
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
    console.error("General report generation error", getOpenAIErrorMessage(error));
    return NextResponse.json(fallbackReport(body));
  }
}
