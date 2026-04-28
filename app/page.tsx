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
    title: "做决定很难",
    desc: "换工作、创业、投资、感情选择，每一步都关系到未来。"
  },
  {
    title: "信息太多，没有方向",
    desc: "你听过很多建议，但真正适合自己的时间和路径并不清晰。"
  },
  {
    title: "不知道什么时候行动",
    desc: "机会不是每天都有，关键是看懂节奏，避开不合适的时机。"
  }
];

const features = [
  {
    icon: Bot,
    title: "AI 风水师",
    desc: "24/7 AI 命理师，随时为你分析人生问题。",
    points: ["事业决策分析", "财运趋势判断", "感情关系解析", "风险提醒", "最佳行动时间建议"]
  },
  {
    icon: CalendarCheck,
    title: "每日运势",
    desc: "根据你的八字资料，每天更新专属运势。",
    points: ["今日评分", "宜 / 忌", "财运 / 事业 / 感情", "幸运颜色", "贵人方向"]
  },
  {
    icon: Brain,
    title: "AI 深度报告",
    desc: "一键生成你的专属命理报告。",
    points: ["财运报告", "事业规划", "感情合盘", "流年分析", "开业择日"]
  },
  {
    icon: Compass,
    title: "改运与解决方案",
    desc: "不只是分析，更告诉你接下来怎么做。",
    points: ["开运建议", "风水布局", "择日建议", "行动策略", "产品与课程建议"]
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
    price: "免费开始",
    desc: "先体验每日运势和基础 AI 问答。",
    includes: ["每日专属运势", "AI 基础问答", "注册赠送点数", "适合第一次体验"]
  },
  {
    name: "Premium",
    price: "按需升级",
    desc: "当你需要更精准答案时，再使用点数或会员功能。",
    includes: ["更深度分析", "AI 命理报告", "高级命理功能", "重点决策建议"]
  }
];

const trustItems = [
  ["AI 技术支持", "基于 OpenAI API 与结构化命理提示词"],
  ["命理分析框架", "结合八字、五行、奇门、梅花与时间趋势"],
  ["Beta 用户体验", "已有早期用户用于每日运势、事业和关系决策"],
  ["安全提醒", "重要健康、法律、投资问题会提示咨询专业人士"]
];

export default function HomePage() {
  return (
    <AppShell>
      <main>
        <section className="hero-image px-5 text-white">
          <div className="mx-auto grid min-h-[760px] max-w-7xl items-center gap-12 py-20 lg:grid-cols-[1fr_420px]">
            <div className="max-w-4xl">
              <StatusPill>AI 命理决策系统 · Free Beta</StatusPill>
              <h1 className="mt-6 max-w-5xl text-5xl font-semibold leading-[1.08] md:text-7xl">
                Your Personal AI Feng Shui Master
              </h1>
              <p className="mt-5 max-w-3xl text-2xl font-semibold leading-9 text-white">
                AI 命理决策系统，帮你看清人生方向
              </p>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/78 md:text-xl">
                从每日运势、事业选择，到财富机会与人生决策，用 AI + 千年命理，为你提供清晰答案。
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded bg-cinnabar px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#991B1B]"
                >
                  免费获取今日运势 <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded border border-white/30 bg-white/12 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                >
                  立即体验 AI 风水师
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-5 text-sm text-white/72">
                <span className="flex items-center gap-2">
                  <BadgeCheck className="size-4 text-gold" /> 今日运势
                </span>
                <span className="flex items-center gap-2">
                  <BadgeCheck className="size-4 text-gold" /> AI 问答
                </span>
                <span className="flex items-center gap-2">
                  <BadgeCheck className="size-4 text-gold" /> 深度报告
                </span>
              </div>
            </div>

            <div className="mx-auto w-full max-w-[390px] rounded-[2rem] border border-white/20 bg-black/35 p-3 shadow-soft backdrop-blur">
              <div className="rounded-[1.55rem] border border-white/12 bg-rice p-4 text-ink">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-ink/52">今日运势评分</p>
                    <p className="mt-1 text-5xl font-semibold">89</p>
                  </div>
                  <span className="grid size-14 place-items-center rounded bg-gold/20 text-gold">
                    <Star className="size-7 fill-gold/20" />
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    ["财运", "82"],
                    ["事业", "91"],
                    ["感情", "76"]
                  ].map(([label, score]) => (
                    <div key={label} className="rounded border border-black/10 bg-white p-3 text-center">
                      <p className="text-xs text-ink/50">{label}</p>
                      <p className="mt-1 text-lg font-semibold text-cinnabar">{score}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded bg-ink p-4 text-white">
                  <p className="text-xs text-white/52">AI 风水师</p>
                  <p className="mt-2 text-sm leading-6">
                    今天适合整理计划、推进合作。重大决定建议避开冲动投入，先确认预算和时间。
                  </p>
                </div>
                <div className="mt-3 rounded border border-black/10 bg-white p-3">
                  <p className="text-xs text-ink/50">你可以问</p>
                  <p className="mt-1 text-sm font-semibold">我适合这个月换工作吗？</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-20">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              eyebrow="Why Now"
              title="为什么越来越多人开始用 AI 看运势？"
              desc="你缺的不是努力，而是对的时间和方向。AI 可以把复杂命理转成更容易理解的行动建议。"
            />
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {pains.map((pain) => (
                <article key={pain.title} className="rounded border border-black/10 bg-white p-6 shadow-sm">
                  <MessageCircleQuestion className="size-6 text-cinnabar" />
                  <h3 className="mt-4 text-xl font-semibold">{pain.title}</h3>
                  <p className="mt-3 leading-7 text-ink/62">{pain.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid-paper border-y border-black/10 px-5 py-20">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              eyebrow="Core Benefits"
              title="你得到的不是系统功能，而是更清楚的答案"
              desc="把每日运势、AI 分析、深度报告和现实行动建议放在同一个体验里。"
            />
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article key={feature.title} className="rounded border border-black/10 bg-white p-6 shadow-sm">
                    <Icon className="size-6 text-cinnabar" />
                    <h3 className="mt-4 text-2xl font-semibold">{feature.title}</h3>
                    <p className="mt-3 leading-7 text-ink/62">{feature.desc}</p>
                    <div className="mt-5 grid gap-2 sm:grid-cols-2">
                      {feature.points.map((point) => (
                        <p key={point} className="flex items-center gap-2 rounded bg-cloud px-3 py-2 text-sm text-ink/72">
                          <CheckCircle2 className="size-4 shrink-0 text-gold" />
                          {point}
                        </p>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-ink px-5 py-20 text-white">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">Real Questions</p>
              <h2 className="mt-3 text-3xl font-semibold md:text-5xl">你可以用它来做什么？</h2>
              <p className="mt-4 text-lg leading-8 text-white/68">
                当你卡在选择、时机、关系或方向时，直接问 AI，看见更完整的趋势和风险。
              </p>
              <Link
                href="/dashboard"
                className="mt-7 inline-flex items-center gap-2 rounded bg-cinnabar px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#991B1B]"
              >
                问 AI 看答案 <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {scenarios.map((scenario) => (
                <div key={scenario} className="rounded border border-white/15 bg-white/8 p-5">
                  <MessageCircleQuestion className="size-5 text-gold" />
                  <p className="mt-4 text-lg font-semibold">{scenario}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-20">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              eyebrow="Start Free"
              title="免费开始，按需升级"
              desc="先体验基础答案。当你需要更深入、更精准的分析时，再为深度报告和高级命理功能付费。"
            />
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {tiers.map((tier) => (
                <article key={tier.name} className="rounded border border-black/10 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cinnabar">{tier.name}</p>
                      <h3 className="mt-2 text-3xl font-semibold">{tier.price}</h3>
                    </div>
                    <Gem className="size-7 text-gold" />
                  </div>
                  <p className="mt-4 leading-7 text-ink/62">{tier.desc}</p>
                  <ul className="mt-5 space-y-3">
                    {tier.includes.map((item) => (
                      <li key={item} className="flex gap-2 text-sm text-ink/72">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-cinnabar" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
            <p className="mt-6 rounded border border-gold/35 bg-gold/10 p-4 text-center font-semibold text-ink">
              你只为更精准的答案付费。
            </p>
          </div>
        </section>

        <section className="border-y border-black/10 bg-white px-5 py-20">
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
                const TypedIcon = Icon as typeof Clock3;
                return (
                  <article key={title as string} className="rounded border border-black/10 bg-rice p-5">
                    <TypedIcon className="size-6 text-cinnabar" />
                    <h3 className="mt-4 text-lg font-semibold">{title as string}</h3>
                    <p className="mt-2 text-sm leading-6 text-ink/58">{desc as string}</p>
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
                <article key={title} className="rounded border border-black/10 bg-white p-5 shadow-sm">
                  <ShieldCheck className="size-6 text-cinnabar" />
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-ink/58">{desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-20">
          <div className="mx-auto max-w-7xl rounded bg-ink px-6 py-16 text-center text-white md:px-12">
            <TrendingUp className="mx-auto size-9 text-gold" />
            <h2 className="mt-5 text-4xl font-semibold md:text-6xl">你的命运，不应该靠运气</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/68">
              现在开始，用 AI 看清方向。
            </p>
            <Link
              href="/dashboard"
              className="mt-8 inline-flex items-center gap-2 rounded bg-cinnabar px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#991B1B]"
            >
              立即获取你的今日运势 <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
