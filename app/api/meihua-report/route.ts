import OpenAI from "openai";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api-auth";
import { meihuaPromptGuardrails } from "@/lib/mingli-knowledge";
import { rateLimitRequest } from "@/lib/rate-limit";

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
    summary: `${body.fullName || "用户"} 的梅花易数报告已围绕「${body.specificQuestion || body.questionCategory || "当前问题"}」生成。报告会以本卦看现状、互卦看中段压力、变卦看结果，并用体用生克判断吉凶与行动策略。`,
    sections: [
      { title: "一、现状解构（本卦）", content: "先判断体卦与用卦五行关系：体克用为可控但劳碌，体生用为泄气付出，用克体为压力较强，用生体为外部助力，比和为基础稳定。当前不只看吉凶，而是看谁主动、谁受制、哪里费力。" },
      { title: "二、过程推演（互卦）", content: "互卦代表事情中段的隐秘夹层、压力来源与不可控因素。若出现大过、金木相战、冲克之象，应提示阶段性高压、方向调整、资源承载不足或沟通阻力。" },
      { title: "三、最终走向（变卦）", content: "变卦代表结果与落脚点。若体生用，虽然表面热闹，但可能付出多于收获；若用生体，则可顺势承接；若用克体，应先避开硬碰硬。" },
      { title: "四、三阶段吉凶能量看板", content: "以本卦、互卦、变卦分别给出能量百分比和定性，例如：当下中吉、过程考验、结果虚吉。整体定局要用白话说明：宜守成、宜小步、宜验证或可主动推进。" },
      { title: "五、时空类象 Clue", content: "根据出现的乾、兑、离、震、巽、坎、艮、坤，给出人物、行为、空间、身心线索，引导用户对照现实。类象不是直接答案，而是帮助用户找到对应的人事物。" },
      { title: "六、五行调频与行动建议", content: "若出现五行相克，应给出通关五行。例如木克土时，优先用火通关：木生火、火生土，化克为生。建议可落到颜色、方位、时间、沟通方式、整理空间与简单仪式。" }
    ]
  };
}

export async function POST(request: Request) {
  const limited = rateLimitRequest(request, { scope: "meihua-report", limit: 6, windowMs: 60_000 });

  if (limited) {
    return limited;
  }

  const { errorResponse } = await requireAuthenticatedUser(request);

  if (errorResponse) {
    return errorResponse;
  }

  const body = (await request.json().catch(() => ({}))) as MeihuaReportBody;

  if (!hasOpenAIKey) {
    return NextResponse.json(fallbackReport(body));
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 45000 });
    const response = await client.responses.create({
      model,
      max_output_tokens: 2600,
      reasoning: { effort: reasoningEffort },
      instructions:
        `你是易玺老师的专业梅花易数与现代心理咨询占卜助理。请用中文生成专业、稳重、可执行的梅花易数报告。输出必须是严格 JSON：{"summary":"...","sections":[{"title":"...","content":"..."}]}。

核心逻辑必须遵守：
${meihuaPromptGuardrails}

1. 先识别起卦数字、起卦时间、体卦、用卦、动爻、本卦、互卦、变卦。
2. 分别判断本卦、互卦、变卦的体用五行生克：
   必须严格使用上方“体用生克严限规则”，不得自行改写吉凶等级。
3. 本卦看现状，互卦看中段压力与暗线，变卦看最终走向和落脚点，动爻看转折触发处。
4. 必须调取八卦万物类象：乾、兑、离、震、巽、坎、艮、坤。只要卦象中出现对应卦，就在“核心时空线索 Clue”中给出人物、行为、空间、身体/情绪提醒和启发式提问。
5. 必须给出五行通关与调频方案：颜色、方位、行为风水、沟通建议、简单仪式。若相克，优先用中间五行通关，例如木克土，用火通关，木生火、火生土。
6. 拒绝纯术语堆砌。每个术语后必须翻译成白话。
7. 语气沉稳、玄学专业、启发性、温暖而笃定。不要恐吓，不要绝对承诺，不要提供金融、法律、医疗或专业建议。`,
      input: `
用户资料与起卦信息：
${JSON.stringify(body, null, 2)}

输出 sections 必须包含 8-10 个栏目：
1. 起卦方式与盘面摘要：说明随机数/时间起卦、上卦、下卦、动爻、本卦、互卦、变卦
2. 现状解构（本卦）：必须写体用五行生克关系，并转成白话
3. 过程推演（互卦）：必须写中段压力、暗线、不可控因素
4. 最终走向（变卦）：必须写结果是否虚实、是否付出大于收获、是否适合推进
5. 动爻转折点：说明第几爻动、代表哪一类触发
6. 三阶段吉凶能量看板：当下/过程/结果各给百分比、吉凶定性和一句话说明
7. 核心时空线索 Clue：人物、行为、空间、身心提醒、联想问题
8. 五行通关与能量调频：通关五行、颜色、方位、行为风水、仪式建议
9. 针对问题的实战建议：现在做什么、避免什么、等待什么、准备什么
10. 免责声明

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
      sections: parsed.sections?.length ? parsed.sections.slice(0, 10) : fallbackReport(body).sections
    });
  } catch (error) {
    console.error("Meihua report generation error", error);
    return NextResponse.json(fallbackReport(body));
  }
}
