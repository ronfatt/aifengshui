import OpenAI from "openai";
import { NextResponse } from "next/server";

type BaziReportBody = {
  fullName?: string;
  gender?: string;
  birthDate?: string;
  birthTime?: string;
  birthLocation?: string;
  calendarType?: "Gregorian" | "Lunar";
  focus?: string;
};

const model = process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || "gpt-5.4-mini";
const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);
const reasoningEffort = model === "gpt-5" ? "minimal" : "none";

function fallbackReport(body: BaziReportBody) {
  const focus = body.focus || "career";
  const name = body.fullName || "用户";

  return {
    configured: false,
    model,
    summary: `${name} 的八字报告已围绕「${focus}」生成。整体命局重视稳定、规划与长期累积，适合先建立标准，再借流动资源打开机会。`,
    sections: [
      {
        title: "命局总论",
        content: `以 ${body.birthDate || "未提供日期"} ${body.birthTime || "未提供时辰"}、${body.birthLocation || "未提供出生地"} 为基础，报告从四柱、十神、五行强弱、大运与流年综合判断。`
      },
      {
        title: "重点方向",
        content: "当前适合先整理资源、现金流、合作边界与执行节奏。若要扩大事业或投资，应先看清风险、时间窗口与自身承载力。"
      },
      {
        title: "实用建议",
        content: "用木水之气疏通成长与财流，用金的规则感建立表达与系统，用土的稳定性做长期复盘。避免因急于证明自己而过度承诺。"
      }
    ]
  };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as BaziReportBody;

  if (!hasOpenAIKey) {
    return NextResponse.json(fallbackReport(body));
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 45000
    });

    const response = await client.responses.create({
      model,
      max_output_tokens: 1400,
      reasoning: { effort: reasoningEffort },
      instructions:
        "你是易玺老师的八字命理报告助理。请用中文生成专业、稳重、可执行的八字报告内容。不要声称绝对准确，不要提供金融、法律、医疗或专业建议。输出必须是 JSON，格式为 {\"summary\":\"...\",\"sections\":[{\"title\":\"...\",\"content\":\"...\"}]}。sections 只需 3-5 个重点段落，详细表格由系统模板负责呈现。",
      input: `
用户资料：
${JSON.stringify(body, null, 2)}

报告必须覆盖：
1. 命局总论
2. 性格与五行倾向
3. 事业财运
4. 感情关系
5. 健康与生活提醒

免责声明必须自然融入：传统命理仅供文化参考、自我觉察和个人规划，不构成专业建议。
`
    });

    const text = response.output_text?.trim() || "";
    let parsed: { summary?: string; sections?: { title: string; content: string }[] };

    try {
      parsed = JSON.parse(text) as { summary?: string; sections?: { title: string; content: string }[] };
    } catch {
      parsed = {
        summary: text.slice(0, 320) || fallbackReport(body).summary,
        sections: [{ title: "AI 综合解析", content: text.slice(0, 1400) || fallbackReport(body).sections[0].content }]
      };
    }

    return NextResponse.json({
      configured: true,
      model,
      summary: parsed.summary || fallbackReport(body).summary,
      sections: parsed.sections?.length ? parsed.sections.slice(0, 5) : fallbackReport(body).sections
    });
  } catch (error) {
    console.error("Bazi report generation error", error);
    return NextResponse.json(fallbackReport(body));
  }
}
