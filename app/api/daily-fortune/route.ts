import OpenAI from "openai";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api-auth";
import { emptyMemberProfile, type MemberProfile } from "@/lib/member-profile";
import { rateLimitRequest } from "@/lib/rate-limit";
import { buildDailyFortuneMatrix } from "@/lib/daily-fortune-engine";

const model = process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || "gpt-5.4-mini";
const reasoningEffort = model === "gpt-5" ? "minimal" : "none";
const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);

type DailyFortuneRequest = {
  memberLevel?: string;
  profile?: Partial<MemberProfile>;
};

async function generateFortune({
  profile = emptyMemberProfile,
  memberLevel = "进阶会员版"
}: {
  profile?: Partial<MemberProfile>;
  memberLevel?: string;
}) {
  const activeProfile = {
    ...emptyMemberProfile,
    ...profile
  };
  const dailyMatrix = buildDailyFortuneMatrix(activeProfile, memberLevel);

  if (!hasOpenAIKey) {
    return NextResponse.json({
      configured: false,
      model,
      reading: `${activeProfile.name} 今日${dailyMatrix.weather.label}，${dailyMatrix.headline}。${dailyMatrix.wealth.label}${dailyMatrix.wealth.score}分，${dailyMatrix.career.label}${dailyMatrix.career.score}分，人际桃花${dailyMatrix.relationship.score}分。今日宜：${dailyMatrix.yi.join("、")}；忌：${dailyMatrix.ji.join("、")}。开运小动作：${dailyMatrix.actionSecret}`,
      profile: activeProfile,
      matrix: dailyMatrix
    });
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000
    });

    const response = await client.responses.create({
      model,
      max_output_tokens: 700,
      reasoning: {
        effort: reasoningEffort
      },
      instructions:
        "你是 AI 风水命理师，也是一个每日运势产品的内容设计师。请根据系统给出的每日紫微气象站数据生成今日运势。必须中文、简短、好懂、可执行，像天气预报一样直观。禁止恐吓、宿命论、绝对化，不要编造额外排盘细节。",
      input: `
会员资料：
${JSON.stringify(activeProfile, null, 2)}

会员等级：
${memberLevel}

结构化数据：
${JSON.stringify(dailyMatrix, null, 2)}

请输出：
1. 今日一句话总评
2. 财富磁场、职场能量、人际桃花各一句
3. 今日开运小动作 1 个，必须是零成本、马上能做
4. 今日所忌 1 句，要精准到场景
5. 今日线索 1 句
总字数 220 字以内。风格：温暖、笃定、像专业师傅给用户早晨提醒。
`
    });

    return NextResponse.json({
      configured: true,
      model,
      reading: response.output_text?.trim() || "今日稳中有进，适合先整理资料，再推进合作。",
      profile: activeProfile,
      matrix: dailyMatrix
    });
  } catch (error) {
    console.error("OpenAI daily fortune error", error);
    return NextResponse.json(
      {
        configured: true,
        model,
        reading: `${activeProfile.name} 今日${dailyMatrix.weather.label}，${dailyMatrix.headline}。今日宜 ${dailyMatrix.yi.join("、")}，忌 ${dailyMatrix.ji.join("、")}。开运小动作：${dailyMatrix.actionSecret}`,
        profile: activeProfile,
        matrix: dailyMatrix
      },
      { status: 200 }
    );
  }
}

export async function POST(request: Request) {
  const limited = rateLimitRequest(request, { scope: "daily-fortune", limit: 12, windowMs: 60_000 });

  if (limited) {
    return limited;
  }

  const { errorResponse } = await requireAuthenticatedUser(request);

  if (errorResponse) {
    return errorResponse;
  }

  const body = (await request.json().catch(() => ({}))) as DailyFortuneRequest;
  return generateFortune({
    profile: body.profile,
    memberLevel: body.memberLevel
  });
}

export async function GET() {
  return generateFortune({});
}
