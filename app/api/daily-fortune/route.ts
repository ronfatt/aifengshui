import OpenAI from "openai";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api-auth";
import { emptyMemberProfile, type MemberProfile } from "@/lib/member-profile";
import { rateLimitRequest } from "@/lib/rate-limit";
import { buildDailyFortuneMatrix, buildPublicDailyAlmanac } from "@/lib/daily-fortune-engine";
import { getMingliCalendar } from "@/lib/mingli-calendar";
import {
  createOpenAIResponseWithFallback,
  getOpenAIErrorMessage,
  getOpenAIModel,
  getResponseReasoningOptions
} from "@/lib/openai-runtime";

const model = getOpenAIModel();
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
  const publicAlmanac = buildPublicDailyAlmanac();
  const personalCalendar = getMingliCalendar(
    activeProfile.birthDate,
    activeProfile.birthTime || activeProfile.birthTimeLabel,
    "Gregorian"
  );
  const personalZodiac = personalCalendar?.zodiac || "";
  const personalDayMaster = personalCalendar?.dayMaster || "";
  const personalZodiacFortune = personalZodiac
    ? publicAlmanac.zodiac.find((item) => item.zodiac === personalZodiac)
    : null;
  const personalDayMasterFlow = personalDayMaster
    ? publicAlmanac.dayMasterFlow.find((item) => item.stem === personalDayMaster)
    : null;
  const profileReady = Boolean(activeProfile.name && activeProfile.name !== "未填写" && activeProfile.birthDate && personalCalendar);
  const personalBrief = profileReady
    ? `系统已按 ${activeProfile.name} 的生日换算：生肖${personalZodiac || "待定"}，日主${personalDayMaster || "待定"}，四柱${personalCalendar?.fourPillarsText || "待校准"}。`
    : "会员命理资料未完整，今日只能提供大众流日建议；请先补姓名、生日、出生时间与性别，才能生成个人化运势。";

  if (!hasOpenAIKey) {
    return NextResponse.json({
      configured: false,
      model,
      reading: `${personalBrief} 今日${dailyMatrix.weather.label}，${dailyMatrix.headline}。财富${dailyMatrix.wealth.score}分、事业${dailyMatrix.career.score}分、人际桃花${dailyMatrix.relationship.score}分。${personalZodiacFortune ? `生肖${personalZodiac}：${personalZodiacFortune.headline}；` : ""}${personalDayMasterFlow ? `日主${personalDayMaster}：${personalDayMasterFlow.tenGod}，${personalDayMasterFlow.advice}` : ""} 今日宜：${dailyMatrix.yi.join("、")}；忌：${dailyMatrix.ji.join("、")}。开运小动作：${dailyMatrix.actionSecret}`,
      profile: activeProfile,
      matrix: dailyMatrix,
      publicAlmanac,
      personalCalendar,
      personalZodiacFortune,
      personalDayMasterFlow
    });
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000
    });

    const { response, model: usedModel, fallbackUsed } = await createOpenAIResponseWithFallback(client, {
      model,
      max_output_tokens: 950,
      ...getResponseReasoningOptions(model),
      instructions:
        "你是 AI 风水命理师，也是一个每日运势产品的内容设计师。请根据系统给出的真实万年历、会员命理资料、每日气象站矩阵生成今日运势。必须中文、简短、好懂、可执行，像天气预报一样直观。禁止恐吓、宿命论、绝对化。必须优先采用系统提供的公历/农历/四柱/生肖/日主，不可自行猜测或改写。若资料不完整，要明确提醒先补资料，不要假装个人化。",
      input: `
会员资料：
${JSON.stringify(activeProfile, null, 2)}

个人命理换算：
${JSON.stringify(personalCalendar, null, 2)}

大众黄历与流日数据：
${JSON.stringify(publicAlmanac, null, 2)}

个人生肖今日数据：
${JSON.stringify(personalZodiacFortune, null, 2)}

个人日主今日数据：
${JSON.stringify(personalDayMasterFlow, null, 2)}

会员等级：
${memberLevel}

结构化数据：
${JSON.stringify(dailyMatrix, null, 2)}

请输出：
1. 今日一句话总评
2. 个人重点：必须结合生肖或日主，若资料不足则写补资料提醒
3. 财富磁场、职场能量、人际桃花各一句
4. 吉时、吉方、穿衣颜色各一句
5. 今日开运小动作 1 个，必须是零成本、马上能做
6. 今日所忌 1 句，要精准到场景
7. 今日线索 1 句
总字数 320 字以内。风格：温暖、笃定、像专业师傅给用户早晨提醒。
`
    });

    return NextResponse.json({
      configured: true,
      model: usedModel,
      fallbackUsed,
      reading: response.output_text?.trim() || "今日稳中有进，适合先整理资料，再推进合作。",
      profile: activeProfile,
      matrix: dailyMatrix,
      publicAlmanac,
      personalCalendar,
      personalZodiacFortune,
      personalDayMasterFlow
    });
  } catch (error) {
    console.error("OpenAI daily fortune error", getOpenAIErrorMessage(error));
    return NextResponse.json(
      {
        configured: true,
        model,
        reading: `${personalBrief} 今日${dailyMatrix.weather.label}，${dailyMatrix.headline}。今日宜 ${dailyMatrix.yi.join("、")}，忌 ${dailyMatrix.ji.join("、")}。开运小动作：${dailyMatrix.actionSecret}`,
        profile: activeProfile,
        matrix: dailyMatrix,
        publicAlmanac,
        personalCalendar,
        personalZodiacFortune,
        personalDayMasterFlow
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
