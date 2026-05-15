import OpenAI from "openai";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api-auth";
import { rateLimitRequest } from "@/lib/rate-limit";

type ZiweiReportBody = {
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

function fallbackReport(body: ZiweiReportBody) {
  return {
    configured: false,
    model,
    summary: `${body.fullName || "用户"} 的紫微斗数命盘报告已围绕「${body.focus || "综合命盘"}」生成。命盘重点在命宫格局、事业宫发展、财帛宫资源流动与大限流年节奏。`,
    sections: [
      { title: "命宫总论", content: "命宫主个性、格局与人生主轴。此盘适合以专业、责任、资源整合为核心，先建立长期可信度，再逐步扩大影响力。" },
      { title: "事业财帛", content: "官禄宫与财帛宫显示适合系统化服务、管理、顾问、教育与商业运营。财运宜从正财、长期合作和可复制产品中累积。" },
      { title: "行动建议", content: "重要阶段先看大限，再看流年触发点。重大合作、投资或转型需保留复盘、预算和风险边界。" }
    ]
  };
}

export async function POST(request: Request) {
  const limited = rateLimitRequest(request, { scope: "ziwei-report", limit: 6, windowMs: 60_000 });

  if (limited) {
    return limited;
  }

  const { errorResponse } = await requireAuthenticatedUser(request);

  if (errorResponse) {
    return errorResponse;
  }

  const body = (await request.json().catch(() => ({}))) as ZiweiReportBody;

  if (!hasOpenAIKey) {
    return NextResponse.json(fallbackReport(body));
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 45000 });
    const response = await client.responses.create({
      model,
      max_output_tokens: 1500,
      reasoning: { effort: reasoningEffort },
      instructions:
        "你是易玺老师的紫微斗数命盘报告助理。请用中文生成专业、稳重、可执行的紫微斗数报告段落。输出必须是 JSON：{\"summary\":\"...\",\"sections\":[{\"title\":\"...\",\"content\":\"...\"}]}。不要绝对化，不要提供金融、法律、医疗或专业建议。",
      input: `
用户资料：
${JSON.stringify(body, null, 2)}

必须覆盖：
1. 命宫总论
2. 事业宫与财帛宫
3. 感情与夫妻宫
4. 疾厄宫与生活提醒
5. 大限流年与行动建议

请加入免责声明：传统紫微斗数仅供文化参考、自我觉察和个人规划，不构成专业建议。
`
    });
    const rawText = response.output_text?.trim() || "";
    let parsed: { summary?: string; sections?: { title: string; content: string }[] };

    try {
      parsed = JSON.parse(rawText) as { summary?: string; sections?: { title: string; content: string }[] };
    } catch {
      parsed = {
        summary: rawText.slice(0, 320) || fallbackReport(body).summary,
        sections: [{ title: "AI 综合解析", content: rawText.slice(0, 1400) || fallbackReport(body).sections[0].content }]
      };
    }

    return NextResponse.json({
      configured: true,
      model,
      summary: parsed.summary || fallbackReport(body).summary,
      sections: parsed.sections?.length ? parsed.sections.slice(0, 5) : fallbackReport(body).sections
    });
  } catch (error) {
    console.error("Ziwei report generation error", error);
    return NextResponse.json(fallbackReport(body));
  }
}
