import OpenAI from "openai";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api-auth";
import { rateLimitRequest } from "@/lib/rate-limit";

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
  try {
    return JSON.parse(text) as IntegratedReportPayload;
  } catch {
    return {
      summary: text.slice(0, 360) || fallbackReport(body).summary,
      sections: [{ title: "AI 综合解析", content: text.slice(0, 1800) || fallbackReport(body).sections[0].content }]
    };
  }
}

function buildReportInput(body: IntegratedReportBody, retry = false) {
  return `
用户资料：
${JSON.stringify(body, null, 2)}

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
- 必须结合出生资料、起卦时间/数字、具体问题和重点领域，不可只写通用鸡汤。
- 要写出“为什么这样判断”：例如性格承载、时机成熟度、资源状态、人和阻力、风险来源、通关方式。
- 必须包含风险雷达式判断：现金流、时机、人际合作、身心消耗各自有什么隐患与处理方式。
- 必须包含行动优先级：现在要做、需要等待、可以推进、必须避开的事项。
- 产品建议必须克制、自然，只在确实符合用户主题时推荐。
- 危机处理与仪式建议必须安全、可执行，不得夸大效果。
- 通关建议要能拆成 7 日执行计划：每天一个动作，包含整理、沟通、复盘、空间调整、静心、验证与总结。
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
        content: `${name} 的底层能量偏向先观察、再判断，适合在资料完整、节奏稳定时发挥。优势在于能把复杂事情拆开处理，适合长期规划、专业积累和建立可信任的关系网络。弱点是压力累积后容易沉默、拖延或突然切断沟通。真正适合你的成长方式不是短期冲刺，而是把目标拆成可复盘、可持续、可复制的节奏。`
      },
      {
        title: "二、当前阶段重点",
        content: `现阶段不适合只看短期结果，而要先确认方向、资源、人际与健康是否能承载下一步。围绕「${question}」，建议先用小范围验证代替一次性决定；凡是需要长期投入的事情，要先设定退出条件、复盘日期和最低可接受结果。若近期感觉卡住，问题往往不在努力不足，而在资源分配、时间窗口和情绪负荷没有同步整理。`
      },
      {
        title: "三、事业与财富拆解",
        content: "事业上适合走稳定专业路线，先做出可复制流程，再扩大影响力。财务上宜重视现金流、预算、合约与回款节奏，不宜因短期机会而忽略成本。若要合作或投资，必须先确认角色、分账、责任和违约处理方式。接下来更适合把现有能力产品化，而不是频繁换方向；真正能带来收入提升的，是标准化交付、复购和清楚的客户筛选。"
      },
      {
        title: "四、关系与人际模式",
        content: "关系中容易承担过多情绪劳动，表面配合，内在却累积不满。建议把需求讲清楚，不用用沉默测试对方。重要关系要看对方是否稳定、是否愿意沟通、是否能一起面对现实问题，而不是只看感觉或当下热度。若出现反复消耗，要先停止解释过多，改用边界、时间表和实际行动来判断关系是否值得继续投入。"
      },
      {
        title: "五、通关与危机处理",
        content: "遇到阻滞时，先做三件事：第一，暂停情绪化回应；第二，把问题写成事实、风险、选择三栏；第三，在 24 小时内只做可逆的小决定。通关重点是用稳定作息、清楚边界和空间整理来降低内耗。若出现破财、冲突或健康压力，先止损、再复盘、后行动。重大财务、法律、医疗事项必须咨询专业人士，本报告只作为文化参考。"
      },
      {
        title: "六、产品与空间建议",
        content: "适合使用能帮助稳定、整理与聚焦的产品，例如桌面收纳、白水晶或金属类小物来强化规则感；需要提升行动力时，可使用九运香、暖光灯或红金色小物，但不宜过度。工作区建议保持左侧整齐、正前方开阔，避免文件堆压。若你正在处理事业或财务主题，可优先选择办公室布局用品、开运香氛和行动规划课程，而不是一次性购买太多摆件。"
      },
      {
        title: "七、仪式与行动建议",
        content: "建议连续 7 天做一个简单仪式：每天固定时间点香或静坐 9 分钟，写下当天最重要的一件事，并在完成后整理桌面。若主题是健康，仪式重点应放在睡眠、饮水、散步和情绪释放；若主题是事业，则放在计划、跟进和复盘。仪式不是迷信动作，而是把注意力、空间和行为节奏重新统一，让你更容易稳定执行。"
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
        content: "接下来最适合采用稳中推进的策略：先确认方向，再聚焦一个主项目，避免同时追逐太多机会。每天保持一个固定复盘动作，每周检查现金流和人际消耗，每月评估是否扩大投入。命理给的是节奏参考，真正改变结果的，是你能否把判断变成持续行动。"
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
