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
