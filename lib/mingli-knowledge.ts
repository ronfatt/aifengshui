import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

type KnowledgeDoc = {
  file: string;
  category: string;
  topics: string[];
  text: string;
};

type KnowledgeQuery = {
  query: string;
  category?: "meihua" | "liuyao" | "ziwei" | "bazi" | "fengshui" | "general";
  maxChars?: number;
};

let cachedDocs: KnowledgeDoc[] | null = null;

const knowledgeDir = path.join(process.cwd(), "knowledge-base", "fengshui-mingli", "processed", "extracted");

const keywordGroups: Record<string, string[]> = {
  meihua: ["梅花", "卦", "本卦", "互卦", "变卦", "动爻", "体用", "生克", "起卦", "断卦", "六十四卦", "八卦", "类象"],
  liuyao: ["六爻", "用神", "世爻", "应爻", "六亲", "六神", "爻位", "卦身", "纳甲", "应期", "冲合", "旺衰", "动爻", "变爻"],
  ziwei: ["紫微", "命宫", "财帛", "官禄", "夫妻", "福德", "迁移", "交友", "四化", "化禄", "化权", "化科", "化忌", "大限", "流年"],
  bazi: ["八字", "四柱", "天干", "地支", "十神", "五行", "日主", "用神", "忌神", "大运", "流年"],
  fengshui: ["风水", "方位", "布局", "财位", "颜色", "五行", "开运", "通关", "九运", "离火"],
  business: ["事业", "财运", "合作", "开业", "创业", "投资", "签约", "客户", "现金流", "营商"],
  relationship: ["感情", "婚姻", "关系", "伴侣", "夫妻", "沟通", "家庭", "孩子", "父母"],
  health: ["健康", "睡眠", "压力", "情绪", "身心", "疲劳"]
};

export const meihuaPromptGuardrails = `【梅花易数 Prompt 严限规则】

[体用生克严限规则]
- 基础五行映射必须固定：乾兑属金，坎属水，震巽属木，离属火，坤艮属土。
- 体卦代表求测者本人、本体、核心立场；用卦代表外界环境、他人、突发事件或作用力。
- 用生体（大吉）：主有进益、顺遂、贵人相助。
- 体用比和（次吉）：主谋事可成、平稳、多得朋友助力。
- 体克用（小吉/平）：主事情在掌控中，但求谋劳碌、诸事多迟延、克得辛苦。
- 体生用（小凶/耗）：主泄气、破耗、多做少成、为人作嫁、精力分散。
- 用克体（大凶）：主压力极大、官非、阻碍、疾病或事情败坏。
- 禁止混淆“体克用”和“用克体”。体克用不是大凶，是可控但辛苦；用克体才是压力大、受制重。

[体用生克 × CLUE 提取规则]
- 禁止脱离生克关系孤立解释象意。每一个 Clue 必须先过体用生克，再决定吉凶方向。
- 用生体：从用卦 Clue 中提取“正面、助力、资源、贵人、扶持”。
- 用克体：从用卦 Clue 中提取“阻碍、风险、破坏者、压制源、破财点”。
- 体生用：从用卦 Clue 中提取“消耗目标、投资去向、精力流失点、为人作嫁之处”。
- 体克用：从用卦 Clue 中提取“被征服的目标、业务对象、需克服的难点、可掌控但费力之处”。
- 体用比和：从用卦 Clue 中提取“合作伙伴、同行、协同环境、同频资源”。

[64卦现代语境过滤规则]
- 分析本卦、互卦、变卦时，必须提取该卦在现代生活/商业语境下的核心痛点与状态，不准只吐古文。
- 遇“大过”卦：重点提炼“压力超载、硬撑、需要减负、结构承载不足”。
- 遇“小过”卦：重点提炼“小有过度、宜下不宜上、注意细节、不可贪大”。
- 遇“丰”卦：重点提炼“表面繁荣、虚火上升、防盛极必衰、名高利微”。
- 所有 64 卦古文断语必须 100% 翻译为一针见血的现代心理与行动建议。

[八卦类象 Clue 输出规则]
- 当卦象中出现乾、兑、离、震、巽、坎、艮、坤任一卦，必须输出“核心时空线索 Clue”。
- 禁止输出古文，必须贴近现代生活。
- 统一格式：核心能量状态、可能涉及的人物、可能涉及的场景/媒介、启发式提问。
- Clue 必须优先引用《金钥匙姓名学》取象：乾=权威/一把手/父亲/高端场所/金钱钟表；兑=口舌/饭局/年轻女性/娱乐争论；离=曝光/文件/屏幕/文化传播/眼目心火；震=启动/车辆/声音/争论/长男行动派；巽=渗透/介绍人/文件票据/自由职业/东南风口；坎=暗流/现金流/黑色物/地下室/风险陷阱；艮=阻隔/门槛/靠山/不动产/守门人；坤=承载/后勤/母亲年长女性/土地仓储/底层团队。
- 示例：兑卦
  核心能量状态：喜悦但带有缺憾，容易祸从口出或流于表面。
  可能涉及的人物：年轻女性、下属、女性朋友、从事口才/销售/咨询行业的人。
  可能涉及的场景/媒介：饭局、会议、争论、娱乐场所、带有破损/缺口的东西。
  启发式提问：你想一想，当下这件事的转机或卡点，是否正卡在一位“能说会道”的女性身上？或者需要你通过一场饭局沟通来破局？
- 举一反三：震卦输出变动/速度/男性/车辆；艮卦输出阻隔/靠山/少男/不动产；其他卦也按现代生活类象过滤。

[输出过滤器]
- 不要写成易经百科全书。
- 每个判断必须经过三个漏斗：阶段吉凶、现代能量状态、启发式提问。
- 术语后必须翻译成白话，再落到现实行动。`;

export const hexagramOneWordPromptRules = `# Role: 周易六十四卦·心易神断师

# Context & Goal:
用户此时心中默想了一个具体问题，并随机抽取到六十四卦中的某一卦。
你需要生成[一个核心关键字]和[一段神谕式断语]。文字要精炼、宿命感强，能瞬间击中用户的心理共鸣。

# Strict Rules for Output:
1. 【关键字规范】
- 禁止直接使用卦名。
- 必须将该卦核心意象转化为现代人秒懂的具象动词或名词。
- 字数限制：2-4 个字。

2. 【神谕断语规范】
- 字数限制：严格控制在 80-120 字之间。
- 语气风格：笃定、睿智、灵动，带有心理学解惑的东方美学。
- 禁止出现任何易学术语，例如九二爻、内卦、五行、错卦。
- 必须采用：现状解构 -> 核心卡点 -> 破局行动。

3. 【64卦意象转译】
- 乾卦：破茧。时机已到，别再隐藏，高调出手，拿回主导权。
- 坤卦：承载。宜守不宜攻，收起锋芒，配合、包容、积累。
- 坎卦：暗流。眼前有看不见的陷阱，切勿盲目投资或信任他人。
- 离卦：聚焦。心思太散，需要高度集中注意力，断舍离。
- 咸卦：电光。此事与直觉高度相关，相信第一反应，但要验证。
- 大过卦：重负。撑得太久，需要减负、拒绝和放手。
- 解卦：松绑。转机已至，斩断不再滋养你的关系或工作。
- 其他卦请举一反三，把古文断语翻译成现代心理与行动建议。

4. 【宇宙显化线索 Clue】
- 断语最后必须附带一个不超过 20 字的线索，格式为：【今日线索】：XXXX。
- 线索必须来自该卦类象，例如方向、人物、颜色、物件、场景、消息来源。
- 禁止输出泛泛而谈的祝福语。`;

const frameworkBlocks = {
  base: `【内部判断框架：通用命理顾问输出】
- 先判断用户真正的问题类型：事业、财运、关系、健康、合作、搬迁、开业、问卦或人生方向。
- 先定性，再拆因果：当前状态是什么，卡点来自时机、资源、人和、情绪、环境还是决策方式。
- 输出必须转成现实行动：现在做什么、暂缓什么、观察什么信号、何时复盘。
- 不用恐吓式语言，不做绝对承诺，不把命理当成金融、医疗、法律判断。`,
  meihua: `【内部判断框架：梅花易数】
- 梅花用于“一问一事”和当下时机，不用于替代长期命盘。
- 优先读：本卦定现状，互卦看过程阻力，变卦看后续走向，动爻看转折点。
- 体用关系转译：体代表自己/主位/根基，用代表对象/事件/外部状态；体生用多为自己付出，用生体多为外部助力；体克用可控但费力，用克体压力较大；比和代表基础稳定。
- 生克必须先判断再下结论：用生体=大吉、进益顺遂；体用比和=次吉、平稳可成；体克用=小吉/平、可控但劳碌迟延；体生用=小凶/耗、泄气破耗；用克体=大凶、压力阻碍大。
- 互卦必须看中段压力、暗线与不可控因素；变卦必须看最终走向是否“虚热、耗财、名高利微、为人作嫁”或真正落地。
- 遇到乾/兑/离/震/巽/坎/艮/坤，必须转成万物类象 Clue：人物、行为、空间、身体/情绪提醒与启发式提问。
- 五行相克时要给通关法。例如木克土，不是直接补土，而是优先用火通关：木生火、火生土，化克为生。
- 64 卦古文必须翻译成现代心理与行动建议：大过=压力超载；小过=细节过度、宜小不宜大；丰=表面繁荣、虚火、防盛极必衰。
- 输出时不要硬编卦名；若没有完整卦象，就用“当前时间与问题象意”做参考拆解。`,
  liuyao: `【内部判断框架：六爻】
- 六爻用于具体事件判断：求财、合作、感情、疾病、官非、搬迁、失物、出行、工作变动等。
- 优先读：用神是否得位，世应关系，六亲六神取象，动爻变爻，月日旺衰，冲合刑害，空亡伏藏，应期。
- 世爻代表自己/发问者，应爻代表对方/外部环境；世应相生多有配合，相克多有阻力，比和多为僵持或平衡。
- 输出时要把“用神、世应、动变、旺衰”转成现实语言：谁主动、谁受制、何处有阻力、什么时候适合推进。`,
  ziwei: `【内部判断框架：紫微斗数】
- 紫微用于人生结构、阶段趋势和宫位主题，不用于短句式随机占断。
- 重点宫位映射：命宫看性格与主轴，官禄宫看事业路径，财帛宫看收入与财务模式，夫妻宫看亲密关系，交友宫看客户/团队/合作，福德宫看内在承载，迁移宫看外部机会。
- 四化转译：化禄看资源与机会，化权看推动与压力，化科看名声/贵人/修复，化忌看卡点/债务/执念/风险。
- 建议要落到阶段策略：扩张、守成、调整、修复、等待或验证。`,
  bazi: `【内部判断框架：八字命理】
- 八字用于底层承载、五行平衡、日主状态、十神倾向、大运流年和长期资源结构。
- 五行转译：木为成长规划，火为表达影响，土为稳定承载，金为规则执行，水为流动智慧与现金流。
- 用神/忌神不要武断；资料不足时以“倾向”表达，并说明需要完整排盘确认。
- 输出时要连接现实：行业适配、做事方式、合作边界、财务纪律、健康生活提醒。`,
  numerology: `【内部判断框架：数字命理】
- 数字命理用于行为节奏、性格表达、个人年主题、沟通方式和执行习惯。
- 不要把数字单独当成命运结论；要和出生资料、问题主题、行动场景交叉判断。
- 输出重点：今年适合启动/整理/合作/学习/收成/转型，用户应如何安排节奏。`,
  fengshui: `【内部判断框架：行为风水与通关】
- 通关建议必须安全、简单、可执行，不能承诺必然改变结果。
- 可用维度：颜色、方位、整理空间、光线、香氛、静坐、写计划、沟通复盘、择时行动。
- 五行行为转译：木为规划与学习，火为曝光与行动，土为稳定与制度，金为边界与决断，水为流动与复盘。
- 产品建议要克制：只有在用户主题相关时，才推荐九运香、五行饰品、办公室布局用品、课程或大师咨询。`
};

function getFrameworkContext(query: string, category?: string) {
  const blocks = [frameworkBlocks.base];
  const shouldInclude = (group: keyof typeof frameworkBlocks, keys: string[]) =>
    category === group || keys.some((key) => query.includes(key));

  if (shouldInclude("meihua", keywordGroups.meihua)) blocks.push(frameworkBlocks.meihua);
  if (shouldInclude("liuyao", keywordGroups.liuyao)) blocks.push(frameworkBlocks.liuyao);
  if (shouldInclude("ziwei", keywordGroups.ziwei)) blocks.push(frameworkBlocks.ziwei);
  if (shouldInclude("bazi", keywordGroups.bazi)) blocks.push(frameworkBlocks.bazi);
  if (["数字", "生命数字", "个人年", "姓名"].some((key) => query.includes(key))) {
    blocks.push(frameworkBlocks.numerology);
  }
  if (shouldInclude("fengshui", keywordGroups.fengshui) || blocks.length === 1) {
    blocks.push(frameworkBlocks.fengshui);
  }

  return `\n\n${blocks.join("\n\n")}`;
}

function loadKnowledgeDocs() {
  if (cachedDocs) return cachedDocs;

  if (!existsSync(knowledgeDir)) {
    cachedDocs = [];
    return cachedDocs;
  }

  cachedDocs = readdirSync(knowledgeDir)
    .filter((file) => file.endsWith(".txt"))
    .map((file) => {
      const fullPath = path.join(knowledgeDir, file);
      const raw = readFileSync(fullPath, "utf8");
      const category = raw.match(/^Category:\s*(.+)$/m)?.[1]?.trim() || "general";
      const topics = (raw.match(/^Topics:\s*(.+)$/m)?.[1] || "")
        .split(",")
        .map((topic) => topic.trim())
        .filter(Boolean);

      return {
        file,
        category,
        topics,
        text: raw.replace(/^# Source:[\s\S]+?\n---\n/, "").trim()
      };
    })
    .filter((doc) => doc.text.length > 80);

  return cachedDocs;
}

function scoreDoc(doc: KnowledgeDoc, query: string, category?: string) {
  const haystack = `${doc.file}\n${doc.category}\n${doc.topics.join(" ")}\n${doc.text.slice(0, 20000)}`;
  const queryChars = Array.from(new Set(query.replace(/[^\p{Script=Han}a-zA-Z0-9]/gu, "").split("")));
  let score = 0;

  if (category && doc.category === category) score += 12;
  if (doc.category === "meihua" && keywordGroups.meihua.some((key) => query.includes(key))) score += 8;
  if (doc.category === "ziwei" && keywordGroups.ziwei.some((key) => query.includes(key))) score += 8;

  for (const [group, keywords] of Object.entries(keywordGroups)) {
    const groupHits = keywords.filter((keyword) => query.includes(keyword) || haystack.includes(keyword)).length;
    if (groupHits && keywords.some((keyword) => query.includes(keyword))) {
      score += groupHits + (group === doc.category ? 4 : 0);
    }
  }

  for (const char of queryChars) {
    if (haystack.includes(char)) score += 0.08;
  }

  return score;
}

function pickSnippet(text: string, query: string, maxLength: number) {
  const keywords = Object.values(keywordGroups).flat().filter((keyword) => query.includes(keyword));
  const firstKeyword = keywords.find((keyword) => text.includes(keyword));
  const index = firstKeyword ? text.indexOf(firstKeyword) : 0;
  const start = Math.max(0, index - Math.floor(maxLength * 0.28));
  return text.slice(start, start + maxLength).replace(/\n{3,}/g, "\n\n").trim();
}

export function getMingliKnowledgeContext({ query, category, maxChars = 4200 }: KnowledgeQuery) {
  const docs = loadKnowledgeDocs();
  const frameworkContext = getFrameworkContext(query, category);

  if (!docs.length) {
    return frameworkContext;
  }

  const ranked = docs
    .map((doc) => ({ doc, score: scoreDoc(doc, query, category) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (!ranked.length) {
    return frameworkContext;
  }

  const chunks: string[] = [];
  let remaining = maxChars;

  for (const item of ranked) {
    if (remaining < 400) break;

    const snippet = pickSnippet(item.doc.text, query, Math.min(900, remaining - 180));
    if (!snippet) continue;

    const block = [
      `【资料来源：${item.doc.file}】`,
      `分类：${item.doc.category}；主题：${item.doc.topics.join("、") || "未分类"}`,
      snippet
    ].join("\n");

    chunks.push(block);
    remaining -= block.length;
  }

  if (!chunks.length) return frameworkContext;

  return `${frameworkContext}\n\n可参考的内部命理知识库摘录：\n${chunks.join("\n\n---\n\n")}\n\n使用要求：只能吸收其判断逻辑，不要长篇照抄资料原文；要转化成用户能理解的分析与行动建议。`;
}

export function getKnowledgeStats() {
  const docs = loadKnowledgeDocs();
  return {
    extractedDocs: docs.length,
    categories: docs.reduce<Record<string, number>>((acc, doc) => {
      acc[doc.category] = (acc[doc.category] || 0) + 1;
      return acc;
    }, {})
  };
}
