import OpenAI from "openai";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api-auth";
import { rateLimitRequest } from "@/lib/rate-limit";
import { normalizeAiReportPayload } from "@/lib/report-json";
import {
  createOpenAIResponseWithFallback,
  getOpenAIErrorMessage,
  getOpenAIModel,
  getResponseReasoningOptions
} from "@/lib/openai-runtime";

type NumerologyReportBody = {
  fullName?: string;
  gender?: string;
  birthDate?: string;
  birthTime?: string;
  focus?: string;
};

const model = getOpenAIModel();
const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);

function fallbackReport(body: NumerologyReportBody) {
  return {
    configured: false,
    model,
    summary: `${body.fullName || "用户"} 的数字命理报告已围绕「${body.focus || "综合人生方向"}」生成。报告重点读取生命路径数、命运数、灵魂渴望数、人格数、个人年数与 1-9 能量分布。`,
    sections: [
      { title: "核心数字", content: "生命路径数代表人生主线，命运数代表外在使命，灵魂渴望数代表内在驱动力。三者结合，可看出个人优势、挑战与成长课题。" },
      { title: "事业财富", content: "适合先把能力结构化，再用稳定的沟通、计划与复盘累积信任。财富宜走长期、可复制、可验证的收入路线。" },
      { title: "行动建议", content: "把今年目标拆成季度行动，保持稳定输出，避免情绪化决策。重要合作前先确认角色、预算、边界与时间表。" }
    ]
  };
}

export async function POST(request: Request) {
  const limited = rateLimitRequest(request, { scope: "numerology-report", limit: 6, windowMs: 60_000 });

  if (limited) {
    return limited;
  }

  const { errorResponse } = await requireAuthenticatedUser(request);

  if (errorResponse) {
    return errorResponse;
  }

  const body = (await request.json().catch(() => ({}))) as NumerologyReportBody;

  if (!hasOpenAIKey) {
    return NextResponse.json(fallbackReport(body));
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 45000 });
    const { response, model: usedModel } = await createOpenAIResponseWithFallback(client, {
      model,
      max_output_tokens: 2600,
      ...getResponseReasoningOptions(model),
      instructions:
        "你是易玺老师的数字命理报告助理。请用中文生成现代、专业、温暖、可执行的数字命理报告段落。输出必须是严格 JSON：{\"summary\":\"...\",\"sections\":[{\"title\":\"...\",\"content\":\"...\"}]}。summary 不超过 120 字，sections 最多 6 个，每个 content 不超过 180 字。不要使用 Markdown。不要绝对化，不要提供金融、法律、医疗或专业建议。",
      input: `
用户资料：
${JSON.stringify(body, null, 2)}

必须覆盖：
1. 生命路径数、命运数、灵魂渴望数、人格数、生日数、成熟数、个人年数
2. 1-9 能量分布、缺失数字与重复数字
3. 事业、财富、关系、健康生活方式
4. 人生周期与未来十年年度趋势
5. 幸运数字、颜色、方向、日期与合作对象
6. 最终人生建议

请加入免责声明：This report is based on numerology principles and is for cultural reference, self-reflection, and personal planning only. It is not financial, legal, medical, or professional advice.
`
    });
    const rawText = response.output_text?.trim() || "";
    const parsed = normalizeAiReportPayload(rawText, fallbackReport(body), 6);

    return NextResponse.json({
      configured: true,
      model: usedModel,
      summary: parsed.summary || fallbackReport(body).summary,
      sections: parsed.sections?.length ? parsed.sections.slice(0, 6) : fallbackReport(body).sections
    });
  } catch (error) {
    console.error("Numerology report generation error", getOpenAIErrorMessage(error));
    return NextResponse.json(fallbackReport(body));
  }
}
