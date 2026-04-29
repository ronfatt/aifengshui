import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Brain,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Compass,
  Gem,
  HeartHandshake,
  MessageCircleQuestion,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp
} from "lucide-react";
import { AppShell, SectionHeader, StatusPill } from "@/components/shell";

const pains = [
  {
    icon: Compass,
    title: "重大选择没有把握",
    desc: "换工作、投资、创业、关系推进，都需要看清节奏。"
  },
  {
    icon: Brain,
    title: "建议很多但不够个人化",
    desc: "你需要的是结合出生资料、当下问题和时间趋势的答案。"
  },
  {
    icon: CalendarCheck,
    title: "机会来了却不知道何时行动",
    desc: "正确的方向加上正确的时间，才更容易把努力变成结果。"
  }
];

const featureCards = [
  {
    icon: CalendarCheck,
    title: "每日运势",
    desc: "每天更新今日评分、宜忌、财运、事业、感情与贵人方向。",
    points: ["今日评分 89", "宜 / 忌", "幸运颜色"]
  },
  {
    icon: Brain,
    title: "AI 深度报告",
    desc: "一键生成财运、事业、感情合盘、流年与择日报告。",
    points: ["结构化分析", "PDF 报告", "行动建议"]
  },
  {
    icon: Sparkles,
    title: "改运方案",
    desc: "不只告诉你趋势，也给出空间布局、择日与开运建议。",
    points: ["风水布局", "开运产品", "课程学习"]
  }
];

const scenarios = [
  "我该不该换工作？",
  "这笔投资适合吗？",
  "最近为什么一直不顺？",
  "我适合创业吗？",
  "这个人适合我吗？",
  "什么时候开始新计划最好？"
];

const tiers = [
  {
    name: "Free",
    price: "免费",
    desc: "先体验每日运势与基础问答。",
    includes: ["每日专属运势", "AI 基础问答", "注册赠送点数"],
    tone: "light"
  },
  {
    name: "Pro",
    price: "按需升级",
    desc: "适合经常做事业、财运与关系判断的用户。",
    includes: ["更深度分析", "AI 命理报告", "高级命理功能", "重点决策建议"],
    tone: "featured"
  },
  {
    name: "Master",
    price: "高级决策",
    desc: "适合需要完整趋势判断与报告输出的用户。",
    includes: ["深度决策分析", "报告生成", "专属行动策略", "高阶功能优先体验"],
    tone: "dark"
  }
];

const trustItems = [
  ["AI 技术支持", "基于 OpenAI API 与结构化命理提示词"],
  ["命理分析框架", "结合八字、五行、奇门、梅花与时间趋势"],
  ["Beta 用户体验", "已有早期用户用于每日运势、事业和关系决策"],
  ["安全提醒", "健康、法律、投资问题会提示咨询专业人士"]
];

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[360px] xl:max-w-[430px]">
      <div className="absolute inset-x-6 top-8 h-[88%] rounded-[3rem] bg-[#D4AF37]/25 blur-3xl" />
      <div className="relative rounded-[2.6rem] border border-[#D4AF37]/30 bg-[#064E3B] p-3 shadow-[0_28px_90px_rgba(6,78,59,0.32)]">
        <div className="rounded-[2rem] bg-[#ECFDF5] p-4 text-[#1F2937] xl:p-5">
          <div className="mx-auto mb-5 h-1.5 w-20 rounded-full bg-[#064E3B]/14" />
          <div className="rounded-3xl bg-[#064E3B] p-4 text-white xl:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D4AF37]">今日能量评分</p>
                <p className="mt-2 text-6xl font-semibold leading-none xl:text-7xl">89</p>
              </div>
              <span className="grid size-14 place-items-center rounded-2xl bg-[#D4AF37]/18 text-[#D4AF37]">
                <Star className="size-7 fill-[#D4AF37]/20" />
              </span>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2">
              {[
                ["财运", "82"],
                ["事业", "91"],
                ["感情", "76"]
              ].map(([label, score]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/8 p-3 text-center">
                  <p className="text-xs text-white/52">{label}</p>
                  <p className="mt-1 text-xl font-semibold text-[#D4AF37]">{score}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="ml-auto max-w-[82%] rounded-2xl bg-white px-4 py-3 text-sm font-semibold">
              我适合这个月换工作吗？
            </div>
            <div className="max-w-[88%] rounded-2xl bg-[#064E3B] px-4 py-3 text-sm leading-6 text-white">
              适合先谈机会，不宜仓促离职。最佳推进期在本月下旬，先整理作品与谈判条件。
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-[#D4AF37]/35 bg-[#D4AF37]/12 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8A6D00]">今日行动</p>
            <p className="mt-2 text-sm font-semibold leading-6">今日宜：复盘计划、沟通合作、调整办公桌左前方。</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatPreview() {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
      <div className="rounded-[1.4rem] bg-white p-5 text-ink">
        <div className="flex items-center justify-between border-b border-black/10 pb-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-full bg-ink text-gold">
              <Bot className="size-5" />
            </span>
            <div>
              <p className="font-semibold">AI 风水师</p>
              <p className="text-xs text-ink/50">在线分析中</p>
            </div>
          </div>
          <StatusPill>Pro</StatusPill>
        </div>
        <div className="mt-5 space-y-4">
          <div className="ml-auto max-w-[78%] rounded-2xl bg-cloud px-4 py-3 text-sm font-semibold">
            我最近事业停滞，是该换方向还是继续坚持？
          </div>
          <div className="max-w-[86%] rounded-2xl bg-ink px-4 py-3 text-sm leading-6 text-white">
            你的问题不是能力不足，而是节奏需要调整。未来两周适合先补强合作资源，月底再做方向决定。
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["风险", "避免冲动签约"],
              ["时机", "下旬更顺"],
              ["行动", "先谈资源"]
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-black/10 bg-white p-3">
                <p className="text-xs text-ink/48">{label}</p>
                <p className="mt-1 text-sm font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EnergyMap() {
  return (
    <section className="bg-[#F7FBF7] px-5 py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative mx-auto grid size-[320px] place-items-center rounded-full bg-white shadow-[0_28px_80px_rgba(6,78,59,0.14)] md:size-[420px]">
          <div className="absolute inset-7 rounded-full border-[18px] border-[#064E3B]" />
          <div className="absolute inset-12 rounded-full border-[10px] border-[#D4AF37]" />
          <div className="absolute left-16 top-16 h-[2px] w-[72%] rotate-[-42deg] bg-[#D4AF37]" />
          <span className="absolute right-16 top-20 rounded-full bg-[#064E3B] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white">
            贵人方：东南
          </span>
          <span className="absolute bottom-14 left-8 rounded-full bg-[#ECFDF5] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#064E3B]">
            今日宜：复盘
          </span>
          <div className="text-center">
            <p className="text-7xl font-semibold text-[#064E3B]">89</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#8A6D00]">今日能量分</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8A6D00]">Energy Map</p>
          <h2 className="mt-4 max-w-3xl font-serif text-4xl font-semibold leading-tight text-[#064E3B] md:text-6xl">
            把今日运势变成一张可行动的能量地图
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#1F2937]/68">
            用户每天打开不只是看一句运势，而是看到评分、方向、宜忌和建议行动，形成每日回访习惯。
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              ["今日评分", "整体 89，事业推进强于财务冒进"],
              ["幸运方位", "东南方适合沟通、会谈和新合作"],
              ["今日宜忌", "宜复盘整理，忌冲动投资与急签合同"],
              ["行动建议", "先确认资源，再推进关键决定"]
            ].map(([title, desc]) => (
              <div key={title} className="rounded-2xl border border-[#D4AF37]/25 bg-white p-5 shadow-sm">
                <CheckCircle2 className="size-5 text-[#D4AF37]" />
                <h3 className="mt-4 text-lg font-semibold text-[#064E3B]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#1F2937]/62">{desc}</p>
              </div>
            ))}
          </div>
          <Link
            href="/dashboard"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#8A6D00] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#6F5700]"
          >
            生成我的今日能量图 <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <AppShell>
      <main className="overflow-hidden bg-white">
        <section className="emerald-hero relative px-5 py-20 md:py-24">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-24 top-10 size-[620px] rounded-full border border-[#D4AF37]/40 opacity-[0.12]" />
            <div className="absolute -right-6 top-28 size-[460px] rounded-full border border-[#D4AF37]/40 opacity-[0.12]" />
            <div className="absolute right-20 top-48 size-[300px] rounded-full border border-[#D4AF37]/40 opacity-[0.12]" />
            <div className="absolute left-0 top-0 h-full w-full bg-[linear-gradient(110deg,rgba(236,253,245,0.52),transparent_46%)]" />
          </div>
          <div className="relative mx-auto grid min-h-[680px] max-w-7xl items-center gap-10 md:grid-cols-[1fr_360px] xl:grid-cols-[1.05fr_0.95fr] xl:gap-14">
            <div>
              <span className="inline-flex rounded-full bg-[#D4AF37]/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#8A6D00]">
                千年命理 · 现代 AI
              </span>
              <h1 className="mt-6 max-w-4xl font-serif text-5xl font-semibold leading-[1.02] text-[#064E3B] md:text-6xl xl:text-8xl">
                AI 风水师，帮你看清方向
              </h1>
              <p className="mt-6 max-w-3xl text-2xl font-semibold leading-9 text-[#1F2937] md:text-3xl">
                结合 AI、八字、五行与风水逻辑，为你的事业、财运、感情与每日决策提供清晰建议。
              </p>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#1F2937]/68 md:text-xl">
                每天先看运势，再问 AI 风水师。把不确定的问题，转成趋势、风险和下一步行动。
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full bg-[#064E3B] px-6 py-4 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(6,78,59,0.24)] transition hover:-translate-y-0.5 hover:bg-[#053D2F]"
                >
                  免费获取今日运势 <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/55 bg-white/72 px-6 py-4 text-sm font-semibold text-[#064E3B] shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:shadow-soft"
                >
                  立即体验 AI 风水师
                </Link>
              </div>
              <div className="mt-9 grid max-w-xl gap-3 sm:grid-cols-3">
                {["今日评分", "AI 对话", "深度报告"].map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-white/80 px-4 py-3 text-sm font-semibold text-[#064E3B] shadow-sm backdrop-blur">
                    <BadgeCheck className="size-4 shrink-0 text-[#D4AF37]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <PhoneMockup />
          </div>
        </section>

        <section className="bg-[#ECFDF5] px-5 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8A6D00]">Why Now</p>
              <h2 className="mt-3 font-serif text-4xl font-semibold leading-tight text-[#064E3B] md:text-6xl">
                为什么越来越多人开始用 AI 看运势？
              </h2>
            </div>
            <div className="mt-10 grid gap-4">
              {pains.map((pain) => {
                const Icon = pain.icon;
                return (
                  <article
                    key={pain.title}
                    className="group flex flex-col gap-5 rounded-3xl border border-[#D4AF37]/20 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#D4AF37]/55 hover:shadow-soft sm:flex-row sm:items-center"
                  >
                    <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-[#064E3B]/8 text-[#064E3B] ring-1 ring-[#D4AF37]/30">
                      <Icon className="size-7" />
                    </span>
                    <div>
                      <h3 className="text-2xl font-semibold text-[#064E3B]">{pain.title}</h3>
                      <p className="mt-2 leading-7 text-[#1F2937]/62">{pain.desc}</p>
                    </div>
                  </article>
                );
              })}
            </div>
            <p className="mt-12 max-w-5xl font-serif text-4xl font-semibold leading-tight text-[#064E3B] md:text-6xl">
              你缺的不是努力，而是<span className="text-[#8A6D00]">正确的时间与方向</span>
            </p>
          </div>
        </section>

        <section className="grid-paper border-y border-[#064E3B]/10 px-5 py-20">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              eyebrow="Modern Feng Shui Method"
              title="把复杂命理，变成你看得懂的下一步"
              desc="主体验不是一堆功能，而是一套能回答问题、判断时机、给出行动建议的 AI 风水方法。"
            />
            <div className="mt-10 grid gap-5 lg:grid-cols-[1.12fr_0.88fr]">
              <article className="relative overflow-hidden rounded-3xl border border-[#D4AF37]/30 bg-[#064E3B] p-8 text-white shadow-[0_24px_80px_rgba(6,78,59,0.28)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(212,175,55,0.20),transparent_30%),linear-gradient(135deg,rgba(236,253,245,0.10),transparent_45%)]" />
                <div className="relative">
                  <span className="grid size-16 place-items-center rounded-2xl bg-[#D4AF37]/12 text-[#D4AF37] ring-1 ring-[#D4AF37]/30">
                    <Bot className="size-8" />
                  </span>
                  <h3 className="mt-8 font-serif text-4xl font-semibold md:text-6xl">AI 命理分析</h3>
                  <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">
                    24/7 AI 命理师，随时为你分析事业、财运、感情、风险与最佳行动时间。
                  </p>
                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    {["事业决策分析", "财运趋势判断", "感情关系解析", "风险提醒", "最佳行动时间建议"].map((point) => (
                      <p key={point} className="flex items-center gap-2 rounded bg-white/8 px-3 py-3 text-sm text-white/82">
                        <CheckCircle2 className="size-4 shrink-0 text-[#D4AF37]" />
                        {point}
                      </p>
                    ))}
                  </div>
                  <Link
                    href="/dashboard"
                    className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-[#064E3B] transition hover:bg-[#E3C65A]"
                  >
                    立即问 AI <ArrowRight className="size-4" />
                  </Link>
                </div>
              </article>

              <div className="grid gap-5">
                {featureCards.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <article
                      key={feature.title}
                      className="rounded-3xl border border-[#D4AF37]/20 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#D4AF37]/55 hover:shadow-soft"
                    >
                      <div className="flex items-start gap-4">
                        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#ECFDF5] text-[#064E3B] ring-1 ring-[#D4AF37]/25">
                          <Icon className="size-6" />
                        </span>
                        <div>
                          <h3 className="text-2xl font-semibold text-[#064E3B]">{feature.title}</h3>
                          <p className="mt-2 leading-7 text-[#1F2937]/62">{feature.desc}</p>
                        </div>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {feature.points.map((point) => (
                          <span key={point} className="rounded-full bg-[#ECFDF5] px-3 py-2 text-xs font-semibold text-[#064E3B]/75">
                            {point}
                          </span>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <EnergyMap />

        <section className="relative bg-[#064E3B] px-5 py-24 text-white">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(212,175,55,0.20),transparent_42%),radial-gradient(circle_at_78%_35%,rgba(236,253,245,0.14),transparent_30%)]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.82fr_1.18fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#D4AF37]">Immersive Chat</p>
              <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight md:text-6xl">
                24/7 AI风水师，随时为你解答
              </h2>
              <p className="mt-5 text-lg leading-8 text-white/68">
                不需要等预约。把问题说出来，系统会结合你的基础资料、问题类型与当前时间，输出趋势、风险和行动建议。
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/78">八字基础</span>
                <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/78">五行趋势</span>
                <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/78">行动时间</span>
              </div>
            </div>
            <ChatPreview />
          </div>
        </section>

        <section className="px-5 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8A6D00]">Real Questions</p>
                <h2 className="mt-3 font-serif text-4xl font-semibold text-[#064E3B] md:text-6xl">不知道问什么？从这里开始</h2>
              </div>
              <p className="max-w-xl text-lg leading-8 text-[#1F2937]/62">
                每个问题都可以直接进入 AI 风水师，让用户更快开始第一次互动。
              </p>
            </div>
            <div className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {scenarios.map((scenario) => (
                <Link
                  key={scenario}
                  href="/dashboard"
                  className="group flex items-center justify-between rounded-2xl border border-[#D4AF37]/20 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#D4AF37]/60 hover:bg-[#ECFDF5] hover:shadow-soft"
                >
                  <span className="flex items-center gap-3 text-lg font-semibold text-[#064E3B]">
                    <MessageCircleQuestion className="size-5 shrink-0 text-[#8A6D00]" />
                    {scenario}
                  </span>
                  <ArrowRight className="size-4 text-[#064E3B]/32 transition group-hover:translate-x-1 group-hover:text-[#8A6D00]" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#ECFDF5] px-5 py-20">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              eyebrow="Membership"
              title="免费开始，按需升级"
              desc="你只为更精准的答案付费。先体验，再根据需要升级到深度分析、AI 报告与高级命理功能。"
            />
            <div className="mt-12 grid items-stretch gap-5 lg:grid-cols-3">
              {tiers.map((tier) => {
                const isFeatured = tier.tone === "featured";
                const isDark = tier.tone === "dark";
                return (
                  <article
                    key={tier.name}
                    className={[
                      "rounded-3xl border p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft",
                      isFeatured ? "border-[#D4AF37] bg-white shadow-[0_24px_70px_rgba(212,175,55,0.18)] lg:-mt-6 lg:mb-6" : "",
                      isDark ? "border-[#064E3B] bg-[#064E3B] text-white" : "border-[#D4AF37]/20 bg-white text-[#1F2937]"
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={isDark ? "text-sm font-semibold uppercase tracking-[0.16em] text-[#D4AF37]" : "text-sm font-semibold uppercase tracking-[0.16em] text-[#8A6D00]"}>
                          {tier.name}
                        </p>
                        <h3 className="mt-3 text-4xl font-semibold">{tier.price}</h3>
                      </div>
                      <Gem className="size-8 text-[#D4AF37]" />
                    </div>
                    <p className={isDark ? "mt-4 leading-7 text-white/62" : "mt-4 leading-7 text-[#1F2937]/62"}>{tier.desc}</p>
                    <ul className="mt-6 space-y-3">
                      {tier.includes.map((item) => (
                        <li key={item} className={isDark ? "flex gap-2 text-sm text-white/78" : "flex gap-2 text-sm text-[#1F2937]/72"}>
                          <CheckCircle2 className={isDark ? "mt-0.5 size-4 shrink-0 text-[#D4AF37]" : "mt-0.5 size-4 shrink-0 text-[#064E3B]"} />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/dashboard"
                      className={[
                        "mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition",
                        isDark ? "bg-[#D4AF37] text-[#064E3B] hover:bg-[#E3C65A]" : isFeatured ? "bg-[#064E3B] text-white hover:bg-[#053D2F]" : "border border-[#D4AF37]/35 bg-white text-[#064E3B] hover:border-[#D4AF37]"
                      ].join(" ")}
                    >
                      开始体验 <ArrowRight className="size-4" />
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="garden-quote px-5 py-28 text-center text-white">
          <div className="mx-auto max-w-4xl">
            <p className="font-serif text-3xl font-semibold italic leading-tight md:text-5xl">
              你的空间，是你状态的延伸。方向对了，行动才会更稳。
            </p>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
              AI Feng Shui Master
            </p>
          </div>
        </section>

        <section className="border-y border-[#064E3B]/10 bg-white px-5 py-20">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr]">
            <SectionHeader
              eyebrow="Beyond Reading"
              title="进阶学习与现实应用"
              desc="当你想进一步理解命理、调整空间或把建议落地，可以选择课程、学习内容和实体开运产品。"
            />
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                [Clock3, "风水课程", "学习基础命理与空间布局"],
                [Sparkles, "命理学习", "理解八字、五行与时间趋势"],
                [HeartHandshake, "开运产品", "把建议应用到日常生活"]
              ].map(([Icon, title, desc]) => {
                const TypedIcon = Icon as typeof Sparkles;
                return (
                  <article key={title as string} className="rounded-3xl border border-[#D4AF37]/20 bg-rice p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
                    <TypedIcon className="size-6 text-[#D4AF37]" />
                    <h3 className="mt-4 text-lg font-semibold text-[#064E3B]">{title as string}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#1F2937]/58">{desc as string}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-5 py-20">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              eyebrow="Trust"
              title="AI 技术与传统命理结合，让答案更清晰"
              desc="我们把命理框架结构化，让 AI 能稳定地按问题类型、会员资料和当前时间生成分析。"
            />
            <div className="mt-10 grid gap-4 md:grid-cols-4">
              {trustItems.map(([title, desc]) => (
                <article key={title} className="rounded-3xl border border-[#D4AF37]/20 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#D4AF37]/55 hover:shadow-soft">
                  <ShieldCheck className="size-6 text-[#D4AF37]" />
                  <h3 className="mt-4 font-semibold text-[#064E3B]">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#1F2937]/58">{desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-20">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-[#064E3B] px-6 py-20 text-center text-white shadow-[0_28px_90px_rgba(6,78,59,0.28)] md:px-12">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(212,175,55,0.30),transparent_42%),radial-gradient(circle_at_70%_35%,rgba(236,253,245,0.18),transparent_34%)]" />
            <div className="relative">
              <TrendingUp className="mx-auto size-10 text-[#D4AF37]" />
              <h2 className="mt-5 font-serif text-5xl font-semibold leading-tight md:text-7xl">今天，先看清你的方向</h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/68">
                从今日运势开始，让 AI 风水师帮你把问题变成更清晰的行动。
              </p>
              <Link
                href="/dashboard"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-8 py-4 text-sm font-semibold text-[#064E3B] shadow-[0_18px_40px_rgba(212,175,55,0.28)] transition hover:-translate-y-0.5 hover:bg-[#E3C65A]"
              >
                立即获取你的今日运势 <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
