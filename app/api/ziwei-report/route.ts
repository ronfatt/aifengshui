import OpenAI from "openai";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api-auth";
import { rateLimitRequest } from "@/lib/rate-limit";
import { normalizeAiReportPayload } from "@/lib/report-json";
import { getMingliCalendar } from "@/lib/mingli-calendar";
import { getZiweiChart } from "@/lib/ziwei-engine";

type ZiweiReportBody = {
  fullName?: string;
  gender?: string;
  birthDate?: string;
  birthTime?: string;
  birthLocation?: string;
  calendarType?: "Gregorian" | "Lunar";
  focus?: string;
};

type ZiweiChartData = NonNullable<ReturnType<typeof getZiweiChart>>;
type ZiweiPalaceData = ZiweiChartData["palaces"][number];

const model = process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || "gpt-5.4-mini";
const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);
const reasoningEffort = model === "gpt-5" ? "minimal" : "none";

const sectionTitles = [
  "一、命宫总论",
  "二、官禄宫事业定位",
  "三、财帛宫财富模式",
  "四、夫妻宫关系模式",
  "五、疾厄宫身心节律",
  "六、福德宫内在状态",
  "七、三方四正交叉判断",
  "八、大限阶段与当前节奏",
  "九、流年策略与红黑榜",
  "十、风水调理与行动清单"
];

function findPalace(chart: ZiweiChartData | null, keyword: string) {
  return chart?.palaces.find((palace) => palace.palaceName.includes(keyword));
}

function palaceBrief(palace?: ZiweiPalaceData) {
  if (!palace) {
    return "宫位资料待完整排盘，建议先确认出生日期、出生时辰与性别。";
  }

  return `${palace.palace}，主星：${palace.stars}；辅曜：${palace.minor}；四化：${palace.transform}；大限：${palace.age}。${palace.summary}`;
}

function actionList(items: string[]) {
  return items.map((item) => `□ ${item}`).join(" ");
}

function buildFallbackSections(body: ZiweiReportBody, chart: ZiweiChartData | null, calendar: ReturnType<typeof getMingliCalendar>) {
  const ming = findPalace(chart, "命宫");
  const career = findPalace(chart, "官禄");
  const wealth = findPalace(chart, "财帛");
  const spouse = findPalace(chart, "夫妻");
  const health = findPalace(chart, "疾厄");
  const fortune = findPalace(chart, "福德");
  const travel = findPalace(chart, "迁移");
  const friends = findPalace(chart, "交友");
  const property = findPalace(chart, "田宅");
  const parents = findPalace(chart, "父母");
  const current = chart?.currentHoroscope?.[0]?.palaceName || "当前流年宫位待校准";
  const focus = body.focus || "综合命盘";

  return [
    {
      title: sectionTitles[0],
      content: `【盘面依据】${palaceBrief(ming)}【白话判断】命宫代表人格底盘与人生主轴，当前命盘更重视秩序、专业与长期信任，不适合靠短线冲动取胜。【警示】压力大时容易把事情都扛在自己身上，导致判断变慢。【行动】${actionList(["把今年目标压缩成 1 个主项目", "建立每周复盘表", "重大决定先做风险清单"])}`
    },
    {
      title: sectionTitles[1],
      content: `【盘面依据】${palaceBrief(career)}【白话判断】官禄宫看事业角色与职场打法。此阶段适合把经验产品化、流程化，用制度和标准交付建立权威。【警示】不要同时开太多战线，越分散越难形成口碑。【行动】${actionList(["列出核心服务 SOP", "为每个项目设定交付边界", "保留可量化 KPI"])}`
    },
    {
      title: sectionTitles[2],
      content: `【盘面依据】${palaceBrief(wealth)}【白话判断】财帛宫看现金流、收入模式与守财能力。现阶段宜重视稳定收入、复购与长期合约，少碰高杠杆和信息不透明的投资。【警示】看似机会多，但真正能留下来的钱才算财。【行动】${actionList(["检查未来 90 天现金流", "把收入分成运营/储备/投资三层", "合作款项先写清结算周期"])}`
    },
    {
      title: sectionTitles[3],
      content: `【盘面依据】${palaceBrief(spouse)}【白话判断】夫妻宫也代表长期合作关系。此盘在关系中需要清楚规则、角色和期待，越含糊越容易累积误会。【警示】不要用沉默代替沟通，也不要把事业压力带入亲密关系。【行动】${actionList(["固定一次高质量沟通", "把财务/家庭/事业期待写清", "重要承诺避免只用口头约定"])}`
    },
    {
      title: sectionTitles[4],
      content: `【盘面依据】${palaceBrief(health)}【白话判断】疾厄宫只作生活节律参考，不作医疗判断。此阶段重点在睡眠、消化、肩颈与压力管理，忙碌时更要守住规律。【警示】长期熬夜会削弱判断力，影响事业与财务节奏。【行动】${actionList(["设定固定睡眠时段", "减少夜间重大决策", "若身体不适请咨询医生"])}`
    },
    {
      title: sectionTitles[5],
      content: `【盘面依据】${palaceBrief(fortune)}【白话判断】福德宫看内在能量、精神满足与抗压能力。若福德宫压力重，外在越成功，内心越需要安定结构。【警示】不要只靠意志硬撑，情绪透支会让判断偏激。【行动】${actionList(["每天留 20 分钟安静整理", "减少无效社交", "用运动或静坐恢复精神电量"])}`
    },
    {
      title: sectionTitles[6],
      content: `【盘面依据】迁移宫：${palaceBrief(travel)} 交友宫：${palaceBrief(friends)} 田宅宫：${palaceBrief(property)}【白话判断】事业与财富不只看单宫，还要看外部市场、人脉质量和空间根基。外部机会能带动成长，但必须筛选合作对象。【行动】${actionList(["优先选择规则清楚的伙伴", "办公室与文件区保持整洁", "客户来源分层管理"])}`
    },
    {
      title: sectionTitles[7],
      content: `【盘面依据】当前触发：${current}；父母/制度宫：${palaceBrief(parents)}【白话判断】大限代表十年阶段主题，流年代表当下触发点。现在不是单看吉凶，而是看资源是否到位、制度是否能承接扩张。【警示】条件未齐时强攻，会变成名气上升但消耗也上升。【行动】${actionList(["先补团队制度", "再谈扩张", "关键合约请专业人士复核"])}`
    },
    {
      title: sectionTitles[8],
      content: `【红榜】未来 3 个月适合做流程整理、老客户复购、品牌内容沉淀与团队训练。【黑榜】不宜冲动投资、情绪性换方向、临时借贷或仓促签长期合约。【节奏】若目标是「${focus}」，先守现金流，再找贵人资源，最后才放大规模。${actionList(["每月做一次财务盘点", "每周固定跟进关键客户", "重大支出设置冷静期"])}`
    },
    {
      title: sectionTitles[9],
      content: `【风水调理】办公桌后方宜有靠，左手青龙位保持活跃，可放常用计划本或绿植；财务文件集中收纳，避免票据散乱。【色彩建议】米白、深青、金色作稳定与专业感；过多强红色会放大急躁。【仪式建议】每日开工前写下 3 件最重要的事，先做最能产生现金流的一件。传统紫微斗数仅供文化参考、自我觉察和个人规划，不构成投资、法律、医疗或专业建议。`
    }
  ];
}

function fallbackReport(body: ZiweiReportBody) {
  const calendar = getMingliCalendar(body.birthDate, body.birthTime, body.calendarType || "Gregorian");
  const chart = getZiweiChart(body);
  const sections = buildFallbackSections(body, chart, calendar);

  return {
    configured: false,
    model,
    chart,
    summary: `${body.fullName || "用户"} 的紫微斗数命盘报告已围绕「${body.focus || "综合命盘"}」生成。系统已换算命宫 ${chart?.mainPalaceBranch ? `${chart.mainPalaceBranch}宫` : calendar?.mingGong || "待排盘"}、身宫 ${chart?.bodyPalaceBranch ? `${chart.bodyPalaceBranch}宫` : calendar?.shenGong || "待排盘"}、五行局 ${chart?.fiveElementName || "待校准"} 与四柱 ${calendar?.fourPillarsText || "待排盘"}，重点在命宫格局、事业宫发展、财帛宫资源流动与大限流年节奏。`,
    sections
  };
}

export async function POST(request: Request) {
  const limited = rateLimitRequest(request, { scope: "ziwei-report", limit: 6, windowMs: 60_000 });

  if (limited) {
    return limited;
  }

  const { errorResponse } = await requireAuthenticatedUser(request);

  if (errorResponse) {
    return errorResponse;
  }

  const body = (await request.json().catch(() => ({}))) as ZiweiReportBody;
  const calendar = getMingliCalendar(body.birthDate, body.birthTime, body.calendarType || "Gregorian");
  const chart = getZiweiChart(body);

  if (!hasOpenAIKey) {
    return NextResponse.json(fallbackReport(body));
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 45000 });
    const response = await client.responses.create({
      model,
      max_output_tokens: 4200,
      reasoning: { effort: reasoningEffort },
      instructions:
        "你是易玺老师的紫微斗数命盘报告助理，精通传统紫微斗数、现代决策咨询与风水行动建议。请用中文生成专业、稳重、可执行的紫微斗数报告。输出必须是严格 JSON object，禁止 Markdown、禁止 code fence、禁止额外解释。格式只允许：{\"summary\":\"180-260字摘要\",\"sections\":[{\"title\":\"一、命宫总论\",\"content\":\"180-340字内容\"}]}。sections 必须刚好 10 节，标题必须依序使用：一、命宫总论；二、官禄宫事业定位；三、财帛宫财富模式；四、夫妻宫关系模式；五、疾厄宫身心节律；六、福德宫内在状态；七、三方四正交叉判断；八、大限阶段与当前节奏；九、流年策略与红黑榜；十、风水调理与行动清单。每节必须包含【盘面依据】【白话判断】【警示】【行动】四类短标签。【盘面依据】必须引用具体宫位、主星、辅星、四化、大限或流年触发，不可只写心理判断。必须根据提供的紫微排盘 JSON 写，不能编造 JSON 中没有的主星、辅星、四化、宫位。10%-20% 使用紫微术语，术语后必须马上用白话解释。拒绝空洞套话，每指出一个风险，必须给一个具体行动；每个行动要带有时间窗口、方位/空间整理或具体行为动作。不要绝对化，不要提供金融、法律、医疗或专业建议。",
      input: `
用户资料：
${JSON.stringify(body, null, 2)}

真实万年历与基础命盘资料（必须优先采用，不要自行猜测）：
${JSON.stringify(calendar, null, 2)}

紫微斗数排盘资料（十二宫、主星、辅星、四化、大限；必须优先采用，不要自行编造宫位星曜）：
${JSON.stringify(chart, null, 2)}

必须覆盖：
1. 命宫总论：个性、格局、优势、弱点
2. 十二宫重点：命宫、官禄、财帛、夫妻、疾厄、福德
3. 事业宫与财帛宫：职业定位、财富模式、风险边界
4. 感情与夫妻宫：关系模式、沟通方式、婚恋提醒
5. 疾厄宫与生活提醒：仅作生活节律提醒，必须加入非医疗免责声明
6. 大限阶段：当前阶段主题、适合做什么、不适合做什么
7. 流年策略：未来 12 个月节奏、红榜机会、黑榜避坑
8. 风水与行动建议：颜色、方向、办公桌/居家调理、可执行清单
9. 最终闭环：安抚、提醒、下一步行动

重要写作标准：
- 命理术语要少而准，例如「命宫」「官禄」「财帛」「四化」「大限」「三方四正」，但必须立刻翻译成现代生活语言。
- 单段不可太长，必须适合手机阅读。
- 行动建议要具体，例如检查现金流、建立 SOP、固定沟通、文件归档、合约复核、办公桌调理。
- 第十节必须加入免责声明：传统紫微斗数仅供文化参考、自我觉察和个人规划，不构成投资、医疗、法律或专业建议。
`
    });
    const rawText = response.output_text?.trim() || "";
    const parsed = normalizeAiReportPayload(rawText, fallbackReport(body), 10);
    const fallback = fallbackReport(body);

    return NextResponse.json({
      configured: true,
      model,
      summary: parsed.summary || fallback.summary,
      sections: parsed.sections?.length ? parsed.sections.slice(0, 10) : fallback.sections,
      chart
    });
  } catch (error) {
    console.error("Ziwei report generation error", error);
    return NextResponse.json(fallbackReport(body));
  }
}
