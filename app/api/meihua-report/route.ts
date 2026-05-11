import OpenAI from "openai";
import { NextResponse } from "next/server";

type MeihuaReportBody = {
  fullName?: string;
  gender?: string;
  birthDate?: string;
  birthTime?: string;
  birthLocation?: string;
  questionCategory?: string;
  specificQuestion?: string;
  divinationDateTime?: string;
  manualNumbers?: string;
  mode?: "random" | "time";
};

const model = process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || "gpt-5.4-mini";
const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);
const reasoningEffort = model === "gpt-5" ? "minimal" : "none";

function fallbackReport(body: MeihuaReportBody) {
  return {
    configured: false,
    model,
    summary: `${body.fullName || "用户"} 的梅花易数报告已围绕「${body.specificQuestion || body.questionCategory || "当前问题"}」生成。此卦象以先观局势、再看转折、最后定行动窗口为主。`,
    sections: [
      { title: "现状判断", content: "本卦显示当前事情尚在整理阶段，表面有阻力，实则适合先确认核心目标和关键关系。" },
      { title: "变卦趋势", content: "变卦提示后续会出现新的沟通窗口，但需要顺势而行，不宜急于一次完成所有推进。" },
      { title: "行动建议", content: "先收集信息、确认边界与时间点；宜在清晰、安静、可控的环境中做决定。" }
    ]
  };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as MeihuaReportBody;

  if (!hasOpenAIKey) {
    return NextResponse.json(fallbackReport(body));
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 45000 });
    const response = await client.responses.create({
      model,
      max_output_tokens: 1400,
      reasoning: { effort: reasoningEffort },
      instructions:
        "你是易玺老师的梅花易数报告助理。请用中文生成专业、稳重、可执行的梅花易数报告段落。输出必须是 JSON：{\"summary\":\"...\",\"sections\":[{\"title\":\"...\",\"content\":\"...\"}]}。不要绝对化，不要提供金融、法律、医疗或专业建议。",
      input: `
用户资料与起卦信息：
${JSON.stringify(body, null, 2)}

必须覆盖：
1. 起卦方式与本卦现状
2. 变卦未来趋势
3. 动爻转折点
4. 体用与五行生克
5. 时间窗口与行动建议

请加入免责声明：传统梅花易数仅供文化参考、自我觉察和个人规划，不构成专业建议。
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
    console.error("Meihua report generation error", error);
    return NextResponse.json(fallbackReport(body));
  }
}
