import OpenAI from "openai";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api-auth";
import { rateLimitRequest } from "@/lib/rate-limit";

type IntegratedReportBody = {
  fullName?: string;
  gender?: string;
  birthDate?: string;
  birthTime?: string;
  birthLocation?: string;
  calendarType?: "Gregorian" | "Lunar";
  focus?: string;
  questionCategory?: string;
  specificQuestion?: string;
  divinationDateTime?: string;
  manualNumbers?: string;
  mode?: "random" | "time";
};

const model = process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || "gpt-5.4-mini";
const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);
const reasoningEffort = model === "gpt-5" ? "minimal" : "none";

function fallbackReport(body: IntegratedReportBody) {
  const name = body.fullName || "用户";
  const focus = body.focus || "business";

  return {
    configured: false,
    model,
    summary: `${name} 的综合命理合参报告已围绕「${focus}」生成。报告以八字看命局底盘，紫微斗数看长期格局，梅花易数看当下问题，数字命理看个人节奏，最后整合成可执行建议。`,
    sections: [
      {
        title: "八字命理：命局底盘",
        content: "以出生年月日时观察五行强弱、日主状态、十神结构与大运流年节奏，判断个人底层资源、承载力与适合累积成果的方式。"
      },
      {
        title: "紫微斗数：长期格局",
        content: "以命宫、身宫、官禄宫、财帛宫与大限流年为主轴，判断个人阶段、事业财帛资源、适合放大的优势与需要谨慎处理的风险。"
      },
      {
        title: "梅花易数：当下应机",
        content: `围绕「${body.specificQuestion || "当前关键问题"}」观察现状、转折与结果。若时机未稳，先整理资料和边界；若条件成熟，可先小规模推进。`
      },
      {
        title: "数字命理：行为节奏",
        content: "以生命路径、命运数、个人年数与 1-9 能量分布观察沟通方式、执行习惯与年度节奏，帮助把命理判断转成现实行动。"
      },
      {
        title: "合参结论",
        content: "四术一致时可主动推进；四术分歧时，应先补足信息、降低承诺、设定止损和复盘节点。重大财务、法律、医疗事项须咨询对应专业人士。"
      }
    ]
  };
}

export async function POST(request: Request) {
  const limited = rateLimitRequest(request, { scope: "integrated-report", limit: 5, windowMs: 60_000 });

  if (limited) {
    return limited;
  }

  const { errorResponse } = await requireAuthenticatedUser(request);

  if (errorResponse) {
    return errorResponse;
  }

  const body = (await request.json().catch(() => ({}))) as IntegratedReportBody;

  if (!hasOpenAIKey) {
    return NextResponse.json(fallbackReport(body));
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 50000
    });

    const response = await client.responses.create({
      model,
      max_output_tokens: 2200,
      reasoning: { effort: reasoningEffort },
      instructions:
        "你是易玺老师的综合命理报告助理。请用中文生成专业、稳重、可执行的付费报告内容。重点结合八字命理、紫微斗数、梅花易数、数字命理四套系统。八字负责命局底盘与五行强弱；紫微负责十二宫与阶段格局；梅花负责当前问题与时机；数字命理负责个人节奏与行为模式。不要把报告写成单一系统报告。不要绝对化，不要提供金融、法律、医疗或专业建议。输出必须是严格 JSON：{\"summary\":\"...\",\"sections\":[{\"title\":\"...\",\"content\":\"...\"}]}。summary 不超过 160 字，sections 需要 7-9 个，每个 content 120-220 字，不要 Markdown。",
      input: `
用户资料：
${JSON.stringify(body, null, 2)}

报告必须覆盖：
1. 八字命理：四柱、五行强弱、日主状态、十神倾向、大运/流年基础
2. 紫微斗数：命宫/身宫/事业/财帛/关系/大限流年方向
3. 梅花易数：根据具体问题、三数或时间，解释现状、过程、变数与结果
4. 数字命理：生命路径、个人年、姓名/生日节奏、执行习惯
5. 四术交叉验证：哪些信号一致，哪些地方需要谨慎
6. 针对 focus 输出事业、财富、关系、健康或商业策略
7. 未来 90 天行动建议
8. 风险提醒与免责声明

免责声明必须自然融入：本报告基于传统命理与数字命理原则，仅供文化参考、自我觉察与个人规划，不构成金融、法律、医疗或其他专业建议。
`
    });

    const text = response.output_text?.trim() || "";
    let parsed: { summary?: string; sections?: { title: string; content: string }[] };

    try {
      parsed = JSON.parse(text) as { summary?: string; sections?: { title: string; content: string }[] };
    } catch {
      parsed = {
        summary: text.slice(0, 360) || fallbackReport(body).summary,
        sections: [{ title: "AI 综合解析", content: text.slice(0, 1800) || fallbackReport(body).sections[0].content }]
      };
    }

    return NextResponse.json({
      configured: true,
      model,
      summary: parsed.summary || fallbackReport(body).summary,
      sections: parsed.sections?.length ? parsed.sections.slice(0, 9) : fallbackReport(body).sections
    });
  } catch (error) {
    console.error("Integrated report generation error", error);
    return NextResponse.json(fallbackReport(body));
  }
}
