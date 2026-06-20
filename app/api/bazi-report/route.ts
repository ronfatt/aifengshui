import OpenAI from "openai";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api-auth";
import { rateLimitRequest } from "@/lib/rate-limit";
import { normalizeAiReportPayload } from "@/lib/report-json";
import { getBaziAnalysis } from "@/lib/bazi-engine";
import {
  createOpenAIResponseWithFallback,
  getOpenAIErrorMessage,
  getOpenAIModel,
  getResponseReasoningOptions
} from "@/lib/openai-runtime";

type BaziReportBody = {
  fullName?: string;
  gender?: string;
  birthDate?: string;
  birthTime?: string;
  birthLocation?: string;
  calendarType?: "Gregorian" | "Lunar";
  focus?: string;
};

const model = getOpenAIModel();
const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);

function fallbackReport(body: BaziReportBody) {
  const focus = body.focus || "career";
  const name = body.fullName || "用户";
  const analysis = getBaziAnalysis(body);
  const calendar = analysis?.calendar;
  const usefulGods = analysis?.usefulGods.join("、") || "待校准";
  const avoidGods = analysis?.avoidGods.join("、") || "待校准";
  const topTenGod = analysis?.tenGodDistribution[0];
  const interactions = analysis?.interactions.length
    ? analysis.interactions.map((item) => `${item.type}${item.pair}：${item.meaning}`).join("；")
    : "合冲刑害未见特别集中，宜以五行强弱与十神结构为主。";

  return {
    configured: false,
    model,
    analysis,
    summary: `${name} 的八字报告已围绕「${focus}」生成。日主为${analysis?.dayMaster || "待排"}${analysis?.dayMasterElement || ""}，身强弱判为「${analysis?.dayMasterStrength || "待校准"}」，喜用倾向为${usefulGods}，报告会以四柱、五行、十神、合冲与流年共同判断。`,
    sections: [
      {
        title: "命局总论",
        content: `以公历 ${calendar?.solarDate || body.birthDate || "未提供日期"} ${calendar?.solarTime || body.birthTime || "未提供时辰"}、农历 ${calendar?.lunarDateText || "待换算"}、四柱 ${calendar?.fourPillarsText || "待排盘"} 为基础。${analysis ? `本命日主为${analysis.dayMaster}${analysis.dayMasterElement}，当前结构重点是「${analysis.dayMasterStrength}」与资源调候。` : "请先补齐出生资料以完成排盘。"}` 
      },
      {
        title: "五行强弱与喜忌",
        content: `五行分布：${analysis?.elementScores.map((item) => `${item.element}${item.percentage}%（${item.level}）`).join("、") || "待分析"}。喜用倾向：${usefulGods}；需谨慎过旺或过度使用的能量：${avoidGods}。这代表行动上要先补节奏，再谈扩张。`
      },
      {
        title: "十神结构",
        content: topTenGod
          ? `命局较突出的十神为「${topTenGod.tenGod}」，出现 ${topTenGod.count} 次。${topTenGod.tone} 这会影响用户处理事业、财富、人际与压力的习惯。`
          : "十神结构较平均，适合以长期规划、稳定复盘与标准化流程取胜。"
      },
      {
        title: "合冲刑害与风险点",
        content: interactions
      },
      {
        title: "事业财运建议",
        content: "事业上宜先建立可复制流程、现金流表、合约边界与交付标准。财务上先守正财与稳定收入，再逐步测试偏财机会；避免高杠杆、口头承诺和短期情绪决策。"
      },
      {
        title: "感情与人际建议",
        content: "关系中要把期待说清楚，少用压抑或猜测处理问题。若命局金土较重，容易重责任但表达偏硬；建议把关心转成具体行动，也把边界讲明。"
      },
      {
        title: "健康与生活提醒",
        content: "健康部分只作为生活节律参考，不构成医疗建议。若命局土金偏显，要注意压力、消化、呼吸、睡眠与久坐问题；适合规律作息、轻运动和定期体检。"
      },
      {
        title: "大运流年行动",
        content: `未来阶段建议按「先整理、再扩张、后固化」推进。${analysis?.annualLuck.slice(0, 3).map((row) => `${row.year}${row.ganZhi}：${row.theme}，${row.reminder}`).join("；") || "流年待排盘后细化。" }`
      }
    ]
  };
}

export async function POST(request: Request) {
  const limited = rateLimitRequest(request, { scope: "bazi-report", limit: 6, windowMs: 60_000 });

  if (limited) {
    return limited;
  }

  const { errorResponse } = await requireAuthenticatedUser(request);

  if (errorResponse) {
    return errorResponse;
  }

  const body = (await request.json().catch(() => ({}))) as BaziReportBody;
  const analysis = getBaziAnalysis(body);

  if (!hasOpenAIKey) {
    return NextResponse.json(fallbackReport(body));
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 45000
    });

    const { response, model: usedModel } = await createOpenAIResponseWithFallback(client, {
      model,
      max_output_tokens: 3600,
      ...getResponseReasoningOptions(model),
      instructions:
        "你是易玺老师的八字命理报告助理，精通四柱八字、十神、五行强弱、合冲刑害、大运流年，并能把术语翻译成用户能执行的现实建议。必须严格采用系统提供的 analysis JSON，不得自行发明四柱、农历或干支。输出必须是 JSON，格式为 {\"summary\":\"...\",\"sections\":[{\"title\":\"...\",\"content\":\"...\"}]}。sections 需要 8-10 个，每段必须包含【盘面依据】【白话判断】【风险提醒】【行动建议】中的至少三个标签，其中【盘面依据】必须引用四柱、日主、十神、五行、合冲刑害或大运流年之一。每指出一个风险，必须立刻给一个行动建议；每个行动建议必须包含时间、方位、行为动作三者中至少两个。禁止空洞套话和重复句式，例如连续使用“稳中求进”“先整理后推进”。单段不要超过 220 字。不要声称绝对准确，不要提供金融、法律、医疗或专业建议。",
      input: `
用户资料：
${JSON.stringify(body, null, 2)}

真实八字结构化分析（必须优先采用，不要自行猜测）：
${JSON.stringify(analysis, null, 2)}

报告必须覆盖：
1. 命局总论
2. 四柱结构
3. 五行强弱与喜忌
4. 十神分布
5. 合冲刑害与风险
6. 性格底色
7. 事业财运
8. 感情关系
9. 健康与生活提醒
10. 大运流年行动建议

免责声明必须自然融入：传统命理仅供文化参考、自我觉察和个人规划，不构成专业建议。
`
    });

    const text = response.output_text?.trim() || "";
    const parsed = normalizeAiReportPayload(text, fallbackReport(body), 5);

    return NextResponse.json({
      configured: true,
      model: usedModel,
      analysis,
      summary: parsed.summary || fallbackReport(body).summary,
      sections: parsed.sections?.length ? parsed.sections.slice(0, 10) : fallbackReport(body).sections
    });
  } catch (error) {
    console.error("Bazi report generation error", getOpenAIErrorMessage(error));
    return NextResponse.json(fallbackReport(body));
  }
}
