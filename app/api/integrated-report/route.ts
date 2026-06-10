import OpenAI from "openai";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api-auth";
import { getMingliKnowledgeContext, meihuaPromptGuardrails } from "@/lib/mingli-knowledge";
import { rateLimitRequest } from "@/lib/rate-limit";
import { normalizeAiReportPayload } from "@/lib/report-json";
import { getMingliCalendar } from "@/lib/mingli-calendar";
import { getZiweiChart } from "@/lib/ziwei-engine";

type IntegratedReportBody = {
  fullName?: string;
  gender?: string;
  birthDate?: string;
  birthTime?: string;
  birthLocation?: string;
  calendarType?: "Gregorian" | "Lunar";
  lunarDate?: string;
  birthHourBranch?: string;
  focus?: string;
  questionCategory?: string;
  specificQuestion?: string;
  divinationDateTime?: string;
  manualNumbers?: string;
  mode?: "random" | "time";
};

type IntegratedReportSection = {
  title: string;
  content: string;
};

type IntegratedReportPayload = {
  summary?: string;
  sections?: IntegratedReportSection[];
  scores?: Record<string, number>;
  actions?: Record<string, string[]>;
};

const model = process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || "gpt-5.4-mini";
const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);
const reasoningEffort = model === "gpt-5" ? "minimal" : "none";

function normalizeSections(sections?: IntegratedReportSection[]) {
  const seen = new Set<string>();

  return (sections || [])
    .map((section, index) => ({
      title: section.title?.trim().replace(/^#+\s*/, "") || `第 ${index + 1} 节`,
      content: section.content?.trim() || ""
    }))
    .filter((section) => {
      if (section.content.length < 60) return false;

      const key = `${section.title}:${section.content.slice(0, 90)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 12);
}

function sectionSimilarity(a: string, b: string) {
  const wordsA = new Set(a.replace(/[^\p{Script=Han}a-z0-9]/giu, "").split(""));
  const wordsB = new Set(b.replace(/[^\p{Script=Han}a-z0-9]/giu, "").split(""));

  if (!wordsA.size || !wordsB.size) return 0;

  let overlap = 0;
  wordsA.forEach((word) => {
    if (wordsB.has(word)) overlap += 1;
  });

  return overlap / Math.min(wordsA.size, wordsB.size);
}

function hasReportQualityIssues(sections: IntegratedReportSection[]) {
  if (sections.length < 10) return true;

  const shortSections = sections.filter((section) => section.content.length < 150);
  if (shortSections.length > 2) return true;

  for (let index = 0; index < sections.length; index += 1) {
    for (let next = index + 1; next < sections.length; next += 1) {
      if (sectionSimilarity(sections[index].content, sections[next].content) > 0.86) {
        return true;
      }
    }
  }

  return false;
}

function parseReportPayload(text: string, body: IntegratedReportBody): IntegratedReportPayload {
  return normalizeAiReportPayload(text, fallbackReport(body), 12) as IntegratedReportPayload;
}

function buildReportInput(body: IntegratedReportBody, retry = false) {
  const calendar = getMingliCalendar(body.birthDate, body.birthTime, body.calendarType || "Gregorian");
  const ziweiChart = getZiweiChart(body);
  const knowledgeQuery = `${body.focus || ""} ${body.questionCategory || ""} ${body.specificQuestion || ""} ${body.manualNumbers || ""}`;
  const knowledgeCategory = knowledgeQuery.includes("六爻") || knowledgeQuery.includes("用神") || knowledgeQuery.includes("世爻") || knowledgeQuery.includes("应爻")
    ? "liuyao"
    : body.questionCategory
      ? "meihua"
      : undefined;
  const knowledgeContext = getMingliKnowledgeContext({
    query: knowledgeQuery,
    category: knowledgeCategory,
    maxChars: 5600
  });

  return `
用户资料：
${JSON.stringify(body, null, 2)}

真实万年历与四柱基础资料（必须优先采用，不要自行猜测；报告正文不需要逐项公开底层系统名称）：
${JSON.stringify(calendar, null, 2)}

紫微十二宫排盘资料（只作为底层判断依据，正文不要机械罗列整张盘）：
${JSON.stringify(ziweiChart, null, 2)}
${knowledgeContext}
${meihuaPromptGuardrails}

底层推演要求：
- 用出生年月日时推演个人底盘、五行倾向、性格承载、事业财运基础与长期周期。
- 用宫位/阶段逻辑推演人生当前阶段、资源、人际、事业、财帛、家庭与风险重点。
- 用提问时间/三数/当前问题推演当下局势、转折、阻力、结果与时机窗口。
- 用生日与姓名节奏推演行为模式、沟通方式、执行习惯、年度节奏与个人成长课题。

输出质量要求：
- 不要列出底层系统名称，不要让用户感觉是四份报告拼接。
- 不要重复同一句结论；每段必须承担不同功能。
- 每段必须包含具体判断、行动、风险或可验证的建议。
- 文字要像正式付费命理报告：每段先给判断，再说明原因，最后给行动。
- 排版必须适合手机阅读：每个 section 必须使用“【标签】短句”结构，单个自然段不超过 3 行。
- 禁止大段散文；每个 section 至少包含 3 个标签，例如【核心优势】【潜在卡点】【行动清单】。
- 每个 section 必须至少出现一个【依据】或【盘面依据】标签，引用出生资料、四柱、五行、宫位、起卦时间/数字、日主、流年或数字节奏之一；不能只写心理学判断。
- 每个弱点或风险后面，必须给至少 1 个具体应对场景或行动建议。
- 每个行动建议必须包含时间、方位/空间、行为动作三者中至少两个，例如“本周三前整理东南方文件区”“未来 7 天每天 9 分钟复盘现金流”。
- 必须含 10%-20% 命理术语，但术语后必须立刻用白话解释。例如“财帛宫受制：代表现金流和收款节奏要更谨慎”。
- 行动清单必须用可执行格式，例如“[ ] 检查未来 3 个月现金流”“[ ] 将合作分账写进文字确认”。
- 必须结合出生资料、起卦时间/数字、具体问题和重点领域，不可只写通用鸡汤。
- 禁止重复模板句。不要连续使用“稳中求进”“先整理后推进”“避免冲动”等相同表达；每一节必须有不同的判断角度。
- 要写出“为什么这样判断”：例如性格承载、时机成熟度、资源状态、人和阻力、风险来源、通关方式。
- 必须包含风险雷达式判断：现金流、时机、人际合作、身心消耗各自有什么隐患与处理方式。
- 必须包含行动优先级：现在要做、需要等待、可以推进、必须避开的事项。
- 产品建议必须克制、自然，只在确实符合用户主题时推荐。
- 危机处理与仪式建议必须安全、可执行，不得夸大效果。
- 通关建议要能拆成 7 日执行计划：每天一个动作，包含整理、沟通、复盘、空间调整、静心、验证与总结。
- 结尾必须完成闭环：点出问题 -> 安抚情绪 -> 指向下一步动作，不要制造未完待续的焦虑。
${retry ? "- 上一次输出质量不足：这一次必须写满 12 个章节，每章观点不可重复，必须更具体、更有执行性。" : ""}

正文必须输出以下结构，但不要解释使用了哪套系统：
1. 命格总论与人生主轴：底层性格、优势、弱点、人生主线
2. 五行气场与承载能力：行动力、财流、表达、稳定度与压力来源
3. 当前阶段状态：现在处于扩张、整理、等待、转向或修复哪一种状态
4. 重点问题判断：针对 specificQuestion 与 focus 深入拆解，必须给明确倾向
5. 事业/学业/能力路径：适合的定位、行业、工作方式、团队角色
6. 财运/资源/现金流管理：收入模式、风险点、守财与扩张方式
7. 关系/家庭/人际互动：贵人、小人、合作、伴侣或家庭沟通提醒
8. 健康与情绪倾向：只做生活提醒，必须声明非医疗建议
9. 未来 30/60/90 天行动节奏：每个阶段给具体任务
10. 危机处理建议：遇到阻力、误判、破财、冲突时怎么处理
11. 通关建议：颜色、方位、空间整理、日常行为、心法，必须可以落地成 7 日行动
12. 产品与仪式建议：可推荐九运香、水晶、五行饰品、办公室布局用品、课程或咨询，但必须自然、克制，不要硬销，并说明适合什么情况使用

额外必须包含在相关章节中的高价值栏目：
- 【财富六维体检】：正财运、偏财运、守财力、资源整合力、行动爆发力、抗险能力，分别给一句判断。
- 【财运红黑榜】：未来 1-3 个月内，给“红榜：适合推进/收款/谈判的窗口”和“黑榜：不宜冲动投资/签约/借贷的窗口”。可以用“上旬/中旬/下旬”表达，不要硬编精确农历日。
- 【贵人与防小人指南】：描述近期该借力的人格特征、行业/角色，以及要避开的“画饼型/催促型/边界不清型”对象。
- 【风水阵法与办公环境调理】：必须给桌面、财位、颜色、收纳或光源建议，强调是行动提醒和环境管理，不夸大功效。
- 【每日增频小仪式】：必须给 1 个 3-9 分钟可执行动作，例如钱包整理、桌面清理、点香静坐、账目复盘或发一条关键跟进消息。

免责声明必须自然融入：本报告基于传统命理与数字命理原则，仅供文化参考、自我觉察与个人规划，不构成金融、法律、医疗或其他专业建议。
`;
}

function fallbackReport(body: IntegratedReportBody) {
  const name = body.fullName || "用户";
  const focus = body.focus || "business";
  const question = body.specificQuestion || "当前关键问题";

  return {
    configured: false,
    model,
    summary: `${name} 的个人命理综合报告已围绕「${focus}」生成。整体重点在于先稳定内在节奏与现实资源，再处理关键问题，避免在压力下做过度承诺。`,
    sections: [
      {
        title: "一、个人底层性格与优势",
        content: `【核心优势】${name} 的底层能量偏向先观察、再判断，细致入微，适合把复杂事情拆开处理。【命理白话】这类似命盘里“福德承压、官禄要稳”的状态：想得深，但不能长期靠硬撑。【潜在卡点】压力累积后容易沉默、拖延或突然切断沟通。【行动清单】[ ] 本周只保留 1 个主目标；[ ] 把重要计划拆成 3 个可复盘节点。`
      },
      {
        title: "二、当前阶段重点",
        content: `【阶段判断】现阶段不是强攻期，而是整理、校准与小范围验证期。【当前关键】围绕「${question}」，不要先问能不能成，要先问资源、人和、时间窗口是否够承载。【行动清单】[ ] 设定最低可接受结果；[ ] 写下退出条件；[ ] 约定 14 天后复盘。【提醒】卡住不代表失败，多数是资源分配和情绪负荷未同步。`
      },
      {
        title: "三、事业与财富拆解",
        content: "【事业定位】适合走稳定专业路线，先做可复制流程，再扩大影响力。【财帛提醒】财星有机会，但守财力必须先补；白话就是现金流、预算、合约和回款要比曝光更重要。【行动清单】[ ] 检查未来 3 个月现金流；[ ] 合作前写清分账、责任、违约处理；[ ] 把现有能力包装成标准服务。"
      },
      {
        title: "四、关系与人际模式",
        content: "关系中容易承担过多情绪劳动，表面配合，内在却累积不满。建议把需求讲清楚，不用用沉默测试对方。重要关系要看对方是否稳定、是否愿意沟通、是否能一起面对现实问题，而不是只看感觉或当下热度。若出现反复消耗，要先停止解释过多，改用边界、时间表和实际行动来判断关系是否值得继续投入。"
      },
      {
        title: "五、通关与危机处理",
        content: "【危机处理】遇到阻滞时，先暂停情绪化回应，再把问题写成事实、风险、选择三栏。【通关逻辑】若处于“财帛受压、福德内耗”的阶段，空间和作息会直接影响判断质量。【行动清单】[ ] 24 小时内只做可逆决定；[ ] 先止损、再复盘、后行动；[ ] 重大财务、法律、医疗事项咨询专业人士。"
      },
      {
        title: "六、产品与空间建议",
        content: "【财位布局】工作区正前方保持开阔，左手边可放计划表、收纳盒或小型绿植，帮助稳定节奏。【桌面阵法】白水晶或金属小物适合放在文件旁，用来提醒规则、边界和收款纪律。【产品建议】事业与财务主题可优先选择办公室布局用品、九运香或行动规划课程，不建议一次购买太多摆件。"
      },
      {
        title: "七、仪式与行动建议",
        content: "【每日增频】连续 7 天固定 9 分钟：点香或静坐，写下当天最重要的一件事，完成后整理桌面。【钱包整理术】每天晚上清空收据，纸币同向摆放，提醒自己让财富井然有序。【白话解释】仪式不是保证结果，而是把注意力、空间和行动节奏重新统一。"
      },
      {
        title: "八、30/60/90 天执行节奏",
        content: "未来 30 天适合整理资料、重设边界和确认优先级；60 天内适合小规模测试合作、产品、课程或计划；90 天内才适合扩大投入。所有重大事项都要设置复盘点：完成什么、停止什么、投入多少、何时判断成败。只要你能把节奏放慢一点，反而更容易避开误判和资源浪费。"
      },
      {
        title: "九、重点问题判断",
        content: `针对「${question}」，关键不是立刻求一个绝对答案，而是先判断这件事是否具备时间、资源、人和与风险承接。若其中两项不足，建议先补条件再推进；若三项以上具备，可以先做可逆试行。你需要特别留意承诺过快、沟通不清、预算模糊这三类风险。`
      },
      {
        title: "十、事业能力路径",
        content: "事业发展适合从专业可信度切入，再逐步扩大规模。你不适合长期处在混乱、频繁救火的环境中，否则判断力会被消耗。更好的路径是把经验变成 SOP、把服务变成产品、把客户反馈变成案例。凡是能积累信任、复购和转介绍的工作模式，都比短期爆发更适合。"
      },
      {
        title: "十一、财富与资源管理",
        content: "财富重点在于守住现金流，再谈扩张。建议把收入分成生活、储备、学习、营销和投资五类，避免所有资源混在一起。若有合作分账、代理收益或团队奖金，一定要先有书面规则与结算周期。越是熟人合作，越需要把数字、责任和退出机制讲清楚。"
      },
      {
        title: "十二、最终整合建议",
        content: "【最终判断】接下来最适合稳中推进：先确认方向，再聚焦一个主项目，避免同时追逐太多机会。【安全网】不必过度焦虑，此阶段的慢，是为了日后的稳。【下一步】每天固定复盘，每周检查现金流和人际消耗，每月再评估是否扩大投入。命理给的是节奏参考，真正改变结果的是持续行动。"
      }
    ]
  };
}

export async function POST(request: Request) {
  const limited = rateLimitRequest(request, { scope: "integrated-report", limit: 5, windowMs: 60_000 });

  if (limited) {
    return limited;
  }

  const { errorResponse } = await requireAuthenticatedUser(request);

  if (errorResponse) {
    return errorResponse;
  }

  const body = (await request.json().catch(() => ({}))) as IntegratedReportBody;

  if (!hasOpenAIKey) {
    return NextResponse.json(fallbackReport(body));
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 50000
    });

    const instructions =
      "你是易玺老师的高阶个人命理报告助理。底层分析必须融合八字命理、紫微斗数、梅花易数、生命数字四套系统，但报告正文不要逐段提及这些系统名称，不要写“八字显示/紫微显示/梅花显示/数字显示”。你要把四套系统的判断融合成一份完整、细致、可执行的个人命理分析。文字要像专业付费报告：有判断、有原因、有风险、有行动、有通关方法，不要重复，不要空泛，不要只给简单建议。不要绝对化，不要提供金融、法律、医疗或专业建议。输出必须是严格 JSON：{\"summary\":\"...\",\"sections\":[{\"title\":\"...\",\"content\":\"...\"}],\"scores\":{\"overall\":数字,\"career\":数字,\"wealth\":数字,\"relationship\":数字,\"health\":数字,\"timing\":数字,\"risk\":数字},\"actions\":{\"now\":[\"...\"],\"avoid\":[\"...\"],\"ritual\":[\"...\"],\"products\":[\"...\"]}}。summary 220-320 字，sections 必须 12 个，每个 content 260-420 字，不要 Markdown。每个 section 的标题和内容必须明显不同，禁止重复同一句结论。";

    const firstResponse = await client.responses.create({
      model,
      max_output_tokens: 5600,
      reasoning: { effort: reasoningEffort },
      instructions,
      input: buildReportInput(body)
    });

    let parsed = parseReportPayload(firstResponse.output_text?.trim() || "", body);
    let sections = normalizeSections(parsed.sections);
    let qualityRetried = false;

    if (hasReportQualityIssues(sections)) {
      qualityRetried = true;
      const retryResponse = await client.responses.create({
        model,
        max_output_tokens: 6000,
        reasoning: { effort: reasoningEffort },
        instructions,
        input: buildReportInput(body, true)
      });

      const retryParsed = parseReportPayload(retryResponse.output_text?.trim() || "", body);
      const retrySections = normalizeSections(retryParsed.sections);

      if (!hasReportQualityIssues(retrySections)) {
        parsed = retryParsed;
        sections = retrySections;
      }
    }

    const fallback = fallbackReport(body);

    return NextResponse.json({
      configured: true,
      model,
      summary: parsed.summary || fallback.summary,
      sections: sections.length >= 6 ? sections : fallback.sections,
      scores: parsed.scores,
      actions: parsed.actions,
      quality: {
        retried: qualityRetried,
        passed: !hasReportQualityIssues(sections),
        sectionCount: sections.length
      }
    });
  } catch (error) {
    console.error("Integrated report generation error", error);
    return NextResponse.json(fallbackReport(body));
  }
}
