import OpenAI from "openai";
import { NextResponse } from "next/server";
import { demoMemberProfile, type MemberProfile } from "@/lib/member-profile";

const model = process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || "gpt-5.4-mini";
const reasoningEffort = model === "gpt-5" ? "minimal" : "none";
const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);

const dailyMatrix = {
  date: new Date().toLocaleDateString("zh-CN", { timeZone: "Asia/Kuala_Lumpur" }),
  overall: 89,
  wealth: {
    score: 82,
    palace: "流日财帛宫",
    signals: ["武曲", "禄意象", "福德宫辅助"],
    risks: ["地空/地劫意象", "偏财不宜冒进"]
  },
  career: {
    score: 91,
    palace: "流日官禄宫",
    signals: ["化权", "紫微/天相意象", "适合谈合作"],
    risks: ["承诺过快", "细节未落纸"]
  },
  relationship: {
    score: 76,
    palace: "交友宫 / 夫妻宫",
    signals: ["客户沟通窗口", "人缘可用"],
    risks: ["沟通宜慢", "避免试探"]
  },
  method: "短线以飞星四化为主，三合星曜结构为底盘辅助"
};

type DailyFortuneRequest = {
  memberLevel?: string;
  profile?: Partial<MemberProfile>;
};

async function generateFortune({
  profile = demoMemberProfile,
  memberLevel = "进阶会员版"
}: {
  profile?: Partial<MemberProfile>;
  memberLevel?: string;
}) {
  const activeProfile = {
    ...demoMemberProfile,
    ...profile
  };

  if (!hasOpenAIKey) {
    return NextResponse.json({
      configured: false,
      model,
      reading: `${activeProfile.name} 今日宜先整理资料，再推进合作。`,
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
        "你是 AI 风水师。请根据系统给出的结构化紫微矩阵与评分生成今日运势。必须中文、稳重、清晰、有行动建议。不要声称绝对准确，不要编造额外排盘细节。",
      input: `
会员资料：
${JSON.stringify(activeProfile, null, 2)}

会员等级：
${memberLevel}

结构化数据：
${JSON.stringify(dailyMatrix, null, 2)}

请输出：
1. 今日一句话总评
2. 财运、事业、感情各一句
3. 今日最适合做的 3 件事
4. 一个风险提醒
总字数 180 字以内。
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
        reading: `${activeProfile.name} 的 AI 今日运势暂时无法生成，当前使用系统预设：稳中有进，先整理后扩张。`,
        profile: activeProfile,
        matrix: dailyMatrix
      },
      { status: 200 }
    );
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as DailyFortuneRequest;
  return generateFortune({
    profile: body.profile,
    memberLevel: body.memberLevel
  });
}

export async function GET() {
  return generateFortune({});
}
