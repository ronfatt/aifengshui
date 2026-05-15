import OpenAI from "openai";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api-auth";
import { emptyMemberProfile } from "@/lib/member-profile";
import { rateLimitRequest } from "@/lib/rate-limit";

type ChatRequest = {
  message?: string;
  memberLevel?: string;
  points?: number;
  profile?: {
    name?: string;
    birthDate?: string;
    birthTime?: string;
    birthTimeLabel?: string;
    gender?: string;
    email?: string;
    phone?: string;
    region?: string;
  };
};

const model = process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || "gpt-5.4-mini";
const reasoningEffort = model === "gpt-5" ? "minimal" : "none";
const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);

function buildPrompt({ message, memberLevel, points, profile }: Required<ChatRequest>) {
  const isPaidTier = !memberLevel.toLowerCase().includes("free");
  const isStrategicTier = memberLevel.includes("高阶") || memberLevel.toLowerCase().includes("strategic");

  return `
用户问题：${message}

会员资料：
- 姓名：${profile.name || "未填写"}
- 会员等级：${memberLevel}
- 可用点数：${points}
- 出生日期：${profile.birthDate || "未填写"}
- 出生时间：${profile.birthTimeLabel || profile.birthTime || "未填写"}
- 性别：${profile.gender || "未填写"}
- Email：${profile.email || "未填写"}
- 手机号：${profile.phone || "选填未填"}
- 地区：${profile.region || "未填写"}
- 当前日期：${new Date().toLocaleDateString("zh-CN", { timeZone: "Asia/Kuala_Lumpur" })}

系统底层分析框架：
- Time Engine：先以公历日期、出生时间、当前查询日期作为时间输入，形成今日趋势变量。
- Ziwei Matrix：把十二宫位视为数据桶；命宫、财帛宫、官禄宫、夫妻宫、交友宫、福德宫是重点读取位。
- Dynamic Engine：短线运势以飞星派四化轨迹为主，三合派星曜组合为底盘辅助；化禄/化权/化科/化忌是动态加减分触发器。
- Meihua Engine：付费版可加入梅花易数作为“当下一问一事”的即时象意判断。以问题时间、用户问题关键词和当前日期形成上卦/下卦/动爻的象意框架，重点看体卦、用卦、生克、动爻、变卦与互卦趋势。
- Scoring Engine：先判断财运、事业、关系、健康的分数与风险，再生成行动建议。
- LLM Interpretation：你只负责把结构化判断讲清楚，不要假装绝对准确，不要编造具体排盘细节。

会员权限规则：
- Free 免费版：只给简短方向，不展开梅花易数卦象，不输出复杂术语。
- 进阶会员版：必须使用“紫微斗数 + 梅花易数”双引擎。紫微用于命盘结构、周期与宫位；梅花用于当前问题的象意、体用关系、行动时机。
- 高阶战略版：在双引擎基础上加入流月/流年、商业五行策略、风险分层和更明确的行动路线。

当前预计算信号：
- 今日总分 89，事业 91，财运 82，感情 76
- 事业：官禄宫受化权意象增强，适合合作沟通与方案推进
- 财运：财帛宫有武曲/禄意象，但地空地劫风险需保守处理
- 关系：交友宫适合客户沟通，但夫妻/亲密关系宜放慢语速
- 今日策略：先整理资料、确认边界，再推进合作

请用以下格式回答：
1. 问题总结
2. 紫微矩阵判断
${isPaidTier ? "3. 梅花易数即时判断（说明体用、生克、动爻/变卦趋势；不要硬编卦名，除非可从输入合理推导）" : "3. 今日方向"}
${isStrategicTier ? "4. 战略判断（流月/流年 + 商业五行策略）" : "4. 风险提醒"}
${isStrategicTier ? "5. 3 个行动路线" : "5. 3 个建议行动"}
6. 适合时间

请控制在 ${isStrategicTier ? "360" : isPaidTier ? "280" : "180"} 字以内。若用户需要更深分析，最后用一句话引导生成深度报告。
`;
}

export async function POST(request: Request) {
  try {
    const limited = rateLimitRequest(request, { scope: "fengshui-chat", limit: 20, windowMs: 60_000 });

    if (limited) {
      return limited;
    }

    const { errorResponse } = await requireAuthenticatedUser(request);

    if (errorResponse) {
      return errorResponse;
    }

    const body = (await request.json()) as ChatRequest;
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json({ error: "请输入问题。" }, { status: 400 });
    }

    if (!hasOpenAIKey) {
      return NextResponse.json(
        { error: "服务器还没有设置 OPENAI_API_KEY，请先在 .env.local 加入 API Key。" },
        { status: 500 }
      );
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000
    });

    const response = await client.responses.create({
      model,
      max_output_tokens: 900,
      reasoning: {
        effort: reasoningEffort
      },
      instructions:
        "你是 AI 风水师，服务 AI 命理决策平台。回答必须使用中文，专业、稳重、简洁，优先给用户可执行建议。底层逻辑以紫微斗数矩阵、天干地支时间变量、飞星派四化动态、三合派星曜底盘、梅花易数即时象意、五行平衡与风险评分为主。紫微斗数用于长期结构和宫位趋势，梅花易数用于当下一问一事的体用、生克、动爻、变卦趋势。你不能声称结果绝对准确，不能编造用户未提供的精确命盘或具体卦名。涉及健康、法律、投资等高风险事项时，必须加入风险提醒并建议咨询专业人士。聊天回复要短，深度内容留给报告中心。",
      input: buildPrompt({
        message,
        memberLevel: body.memberLevel || "Plus",
        points: body.points ?? 0,
        profile: body.profile || emptyMemberProfile
      })
    });

    const answer = response.output_text?.trim() || "暂时无法生成回复，请稍后再试。";

    return NextResponse.json({
      answer,
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

export async function GET() {
  return NextResponse.json({
    provider: "openai",
    configured: hasOpenAIKey,
    model,
    endpoint: "responses"
  });
}
