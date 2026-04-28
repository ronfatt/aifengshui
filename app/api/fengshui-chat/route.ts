import OpenAI from "openai";
import { NextResponse } from "next/server";

type ChatRequest = {
  message?: string;
  memberLevel?: string;
  points?: number;
  profile?: {
    birthDate?: string;
    birthTime?: string;
    gender?: string;
    region?: string;
  };
};

const model = process.env.OPENAI_CHAT_MODEL || "gpt-5.1";
const reasoningEffort = model.includes("gpt-5.1") ? "none" : "low";

function buildPrompt({ message, memberLevel, points, profile }: Required<ChatRequest>) {
  return `
用户问题：${message}

会员资料：
- 会员等级：${memberLevel}
- 可用点数：${points}
- 出生日期：${profile.birthDate || "未填写"}
- 出生时间：${profile.birthTime || "未填写"}
- 性别：${profile.gender || "未填写"}
- 地区：${profile.region || "未填写"}
- 当前日期：${new Date().toLocaleDateString("zh-CN", { timeZone: "Asia/Kuala_Lumpur" })}

请用以下格式回答：
1. 问题总结
2. 当前趋势
3. 风险提醒
4. 3 个建议行动
5. 适合时间

请控制在 180 字以内。若用户需要更深分析，最后用一句话引导生成深度报告。
`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequest;
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json({ error: "请输入问题。" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "服务器还没有设置 OPENAI_API_KEY，请先在 .env.local 加入 API Key。" },
        { status: 500 }
      );
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const response = await client.responses.create({
      model,
      max_output_tokens: 450,
      reasoning: {
        effort: reasoningEffort
      },
      instructions:
        "你是 AI 风水师，服务 AI 命理决策平台。回答必须使用中文，专业、稳重、简洁，优先给用户可执行建议。你可以结合八字基础、五行平衡、梅花易数、奇门遁甲和时间趋势做一般性分析，但不能声称结果绝对准确。涉及健康、法律、投资等高风险事项时，必须加入风险提醒并建议咨询专业人士。聊天回复要短，深度内容留给报告中心。",
      input: buildPrompt({
        message,
        memberLevel: body.memberLevel || "Plus",
        points: body.points ?? 2680,
        profile: body.profile || {}
      })
    });

    return NextResponse.json({
      answer: response.output_text || "暂时无法生成回复，请稍后再试。",
      model
    });
  } catch (error) {
    console.error("OpenAI fengshui chat error", error);
    return NextResponse.json(
      { error: "AI 风水师暂时无法回应，请稍后再试。" },
      { status: 500 }
    );
  }
}
