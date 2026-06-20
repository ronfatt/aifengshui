import OpenAI from "openai";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api-auth";
import { emptyMemberProfile } from "@/lib/member-profile";
import { getMingliKnowledgeContext, hexagramOneWordPromptRules, meihuaPromptGuardrails } from "@/lib/mingli-knowledge";
import { getOpenAIErrorMessage, getOpenAIModel, getResponseReasoningOptions } from "@/lib/openai-runtime";
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

const model = getOpenAIModel();
const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);

function isStrategicTierForResponse(memberLevel: string) {
  return memberLevel.includes("高阶") || memberLevel.toLowerCase().includes("strategic");
}

function buildPrompt({ message, memberLevel, points, profile }: Required<ChatRequest>) {
  const isPaidTier = !memberLevel.toLowerCase().includes("free");
  const isStrategicTier = isStrategicTierForResponse(memberLevel);
  const targetLength = isStrategicTier ? "1400-1800 字" : isPaidTier ? "950-1300 字" : "320-450 字";
  const knowledgeCategory = message.includes("六爻") || message.includes("用神") || message.includes("世爻") || message.includes("应爻")
    ? "liuyao"
    : message.includes("梅花") || message.includes("卦")
      ? "meihua"
      : undefined;
  const knowledgeContext = getMingliKnowledgeContext({
    query: message,
    category: knowledgeCategory,
    maxChars: isPaidTier ? 5200 : 2600
  });

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
- LLM Interpretation：你要像一位有实战经验的风水命理老师，给出约 80% 专业深度的拆解。要讲逻辑、讲象意、讲趋势、讲可执行建议；不要只给泛泛安慰。

会员权限规则：
- Free 免费版：给清楚方向和 3 个行动建议，可以轻量解释，不展开完整卦象。
- 进阶会员版：必须使用“紫微斗数 + 梅花易数”双引擎。紫微用于命盘结构、周期与宫位；梅花用于当前问题的象意、体用关系、行动时机。回答要接近专业老师口吻，要有拆局深度，不要像普通 AI 摘要。
- 高阶战略版：在双引擎基础上加入流月/流年、商业五行策略、风险分层和更明确的行动路线。回答要像私人顾问分析，可加入阶段策略、风险预案、行动优先级。

当前预计算信号：
- 今日总分 89，事业 91，财运 82，感情 76
- 事业：官禄宫受化权意象增强，适合合作沟通与方案推进
- 财运：财帛宫有武曲/禄意象，但地空地劫风险需保守处理
- 关系：交友宫适合客户沟通，但夫妻/亲密关系宜放慢语速
- 今日策略：先整理资料、确认边界，再推进合作
${knowledgeContext}
${message.includes("卦") || message.includes("梅花") || isPaidTier ? `\n梅花易数输出过滤器：\n${meihuaPromptGuardrails}` : ""}
${message.includes("64") || message.includes("六十四") || message.includes("一字") ? `\n64卦一字输出过滤器：\n${hexagramOneWordPromptRules}` : ""}

回答风格要求：
- 开头称呼用户为“易玺老师”或“从这个问题来看”，语气稳重、专业、有温度。
- 不要使用 Markdown 表格。可以使用“一、二、三、四”分段和「○」小点。
- 要像截图示例那样：先定结构，再拆现状、隐患、趋势、建议。
- 付费版必须写得更完整：每个主要分段至少 2 段解释，不要只有一句话；建议部分必须给到可执行步骤。
- 语言要有“老师在现场看盘”的感觉，例如“这个地方要注意”“真正的关键不在表面，而在……”“如果继续这样走，会出现……；如果调整方式，则……”
- 可以使用“体代表自己/家庭/主位，用代表外部/对象/事件”的表达，但不要让术语堆太多，要翻译成用户能理解的话。
- 如果用户提供卦名、本卦/互卦/变卦/数字/图片中的卦象信息，可以直接沿用这些卦象分析。
- 如果用户没有提供明确卦名或完整排盘，不要硬编“准确卦名”。可以写“若以当前时间与问题象意来看，可暂以体用、生克、动变趋势作参考拆解”。
- 不要制造恐惧，不要说绝对会发生。要用“倾向、较适合、需要注意、建议先……”。
- 涉及投资、医疗、法律、重大决定时必须加一句风险提醒。

请按以下结构输出，长度控制在 ${targetLength}：
一、问题定性
用 2-3 句话说明用户问的核心是什么，属于事业/财运/关系/家庭/健康/搬迁/合作/决策哪一类。

二、盘面/能量结构
${isPaidTier ? "结合紫微宫位趋势 + 梅花体用象意说明：谁为体、谁为用，当前是相生、相克、泄气、比和还是受制。若不能确定卦名，就不要写死卦名，而是写象意结构。" : "用简单语言说明今日趋势和适合/不适合的方向。"}

三、当前现状
说明现在表面看起来是什么情况，真正的压力点、卡点或机会点在哪里。

四、隐患与转折
${isPaidTier ? "说明互卦/中间过程的隐忧、心理压力、沟通冲突、资源阻滞或时机变化。要具体，不要泛泛。" : "指出 1-2 个风险。"}

五、趋势判断
${isPaidTier ? "说明变卦/后续趋势：这件事如果继续推进会如何，如果调整方式又会如何。" : "给出短期趋势。"}

六、化解与行动建议
给 5-7 条可执行建议，包括沟通方式、时间选择、方位/颜色/五行行为、需要避开的动作。建议要落地。

${isPaidTier ? "七、应事策略与通关方法\n把建议拆成：马上做、暂时不要做、观察什么信号、何时再推进。可加入简单安全的通关方法，例如整理空间、调整方位、颜色、点香/静坐/复盘，不得夸大效果。\n\n八、老师式总结\n用 3-5 句话给最终判断：是否适合做、适合怎样做、什么时候再看。最后可轻量引导用户生成完整报告。" : "七、总结\n用 2-3 句话给最终判断：是否适合做、适合怎样做、什么时候再看。最后可轻量引导用户生成完整报告。"}
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
      max_output_tokens: isStrategicTierForResponse(body.memberLevel || "Plus") ? 3400 : 2600,
      ...getResponseReasoningOptions(model),
      instructions:
        "你是易玺老师风格的 AI 风水命理师，服务 AI 命理决策平台。回答必须使用中文，像有实战经验的风水命理老师：先定问题，再拆盘面结构、现状、隐患、趋势和化解行动。用户问题开头可能会带有“问题类型”，要优先按该类型判断。底层逻辑以紫微斗数矩阵、天干地支时间变量、飞星派四化动态、三合派星曜底盘、梅花易数即时象意、五行平衡与风险评分为主。紫微斗数用于长期结构和宫位趋势，梅花易数用于当下一问一事的体用、生克、动爻、互卦、变卦趋势。不要声称结果绝对准确，不要编造用户未提供的精确命盘或具体卦名；若资料不足，要说明是象意参考。涉及健康、法律、投资等高风险事项时，必须加入风险提醒并建议咨询专业人士。",
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
    console.error("OpenAI fengshui chat error", getOpenAIErrorMessage(error));
    return NextResponse.json(
      { error: "AI 风水命理师暂时无法回应，请稍后再试。" },
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
