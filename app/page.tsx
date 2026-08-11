import type { ElementType } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  CalendarDays,
  CheckCircle2,
  Compass,
  FileText,
  Gem,
  MessageCircle,
  Network,
  Orbit,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Target,
  ChevronRight,
  Zap
} from "lucide-react";
import { AppShell } from "@/components/shell";

const ctaPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#E8D4A8] via-[#C79A54] to-[#997233] px-7 py-4 text-sm font-semibold text-[#050607] shadow-[0_12px_32px_rgba(199,154,84,0.3)] transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0";

const ctaDark =
  "inline-flex items-center justify-center gap-2 rounded-full border border-[#C79A54]/40 bg-[#0D1012] px-7 py-4 text-sm font-semibold text-[#E8D4A8] shadow-[0_12px_32px_rgba(0,0,0,0.5)] transition hover:-translate-y-0.5 hover:border-[#C79A54] hover:bg-[#1A1F24] hover:text-white";

const ctaGhost =
  "inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-4 text-sm font-semibold text-white/80 backdrop-blur-md transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10 hover:text-white";

const painCards = [
  ["机会来了，不敢出手", "不知道现在是不是最好的时机，缺乏明确的节奏指引。", Target],
  ["决定很多，还是没把握", "信息杂乱越分析越迷茫，关键时刻缺乏权威诊断。", Compass],
  ["想布局未来，看不清风险", "事业、财运、合作与方位，都需要提前预判隐患。", ShieldCheck]
] as const;

const methodCards = [
  ["AI 即时秒级推演", "24/7 全天候秒级整理问题结构、命运趋势与行动宜忌。", Bot],
  ["大师深度战略诊断", "结合数十载命理实战经验，在关键节点提供定盘星结论。", Gem],
  ["双引擎落地服务", "AI 快速破局整理方向，大师精准打定决心，更快更稳。", Orbit]
] as const;

const services = [
  ["今日运势", "快速了解今日事业、财运、感情与最佳行动方位。", "立即体验", CalendarDays],
  ["AI 深度报告", "生成个人八字/紫微趋势、优势、隐患与未来建议。", "生成报告", FileText],
  ["风水布局建议", "针对家居、办公室、店铺提供定制五行布局方案。", "查看方案", Compass],
  ["大师一对一咨询", "由易玺大师提供高阶深度诊断与商业行动决策。", "预约咨询", MessageCircle]
] as const;

const businessAdvantages = [
  ["AI 智能前置接待", "自动完成初步测算、命盘拆解与问题结构整理。", Bot],
  ["标准化产品交付", "报告、咨询、风水布局方案可复制、高保真交付。", PackageCheck],
  ["实战大师 IP 背书", "借助易玺大师多年实战品牌提升信任转化率。", BadgeCheck],
  ["可复制创业模式", "适合顾问、代理商、内容创业者与线下门店转型。", Network]
] as const;

const packages = [
  ["AI 深度报告", "适合想全方位看清个人事业、财运、感情与未来趋势的人。", "生成报告", "点数制", ["八字/紫微大运趋势分析", "五行盈缺与风险预警", "定制月度行动指南"]],
  ["大师深度咨询", "适合正在面对重大决策，需要权威大师定盘点拨的人。", "预约大师", "预约制", ["易玺大师 1 对 1 诊断", "命理 + 空间风水双重研判", "商业/人生定制解决方案"]],
  ["事业合伙人", "适合想进入 AI 赋能的风水命理蓝海市场的创业者。", "申请合作", "合作制", ["全套 AI 命理 SaaS 平台", "标准化服务交付工具", "大师 IP 赋能与团队支持"]]
] as const;

const peopleImages = {
  advisor: "/images/master-yixi.jpg",
  consultation: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=82",
  founder: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=320&q=80",
  clientA: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&q=80",
  clientB: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=80",
  clientC: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=320&q=80"
} as const;

function SectionIntro({
  eyebrow,
  title,
  desc,
  inverted = false
}: {
  eyebrow: string;
  title: string;
  desc?: string;
  inverted?: boolean;
}) {
  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2">
        <span className="h-px w-8 bg-gradient-to-r from-[#C79A54] to-transparent" />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C79A54] sm:text-sm">{eyebrow}</p>
      </div>
      <h2 className={`mt-3 font-serif text-3xl font-bold leading-tight sm:text-5xl md:text-6xl ${inverted ? "text-white" : "gold-gradient-text"}`}>
        {title}
      </h2>
      {desc ? <p className={`mt-4 text-base leading-8 sm:text-lg ${inverted ? "text-white/70" : "text-white/65"}`}>{desc}</p> : null}
    </div>
  );
}

function IconCard({
  icon: Icon,
  title,
  desc,
  dark = false
}: {
  icon: ElementType;
  title: string;
  desc: string;
  dark?: boolean;
}) {
  return (
    <article className="glass-panel glass-panel-interactive p-7 sm:p-8">
      <span className="grid size-13 place-items-center rounded-2xl border border-[#C79A54]/30 bg-gradient-to-br from-[#C79A54]/20 to-transparent text-[#C79A54] shadow-[0_0_15px_rgba(199,154,84,0.15)]">
        <Icon className="size-6" />
      </span>
      <h3 className="mt-6 font-serif text-xl font-bold text-white sm:text-2xl">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-white/60">{desc}</p>
    </article>
  );
}

function HeroPhoneMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[380px]">
      {/* Glow aura */}
      <div className="absolute -inset-4 rounded-[3.5rem] bg-gradient-to-tr from-[#C79A54]/30 via-transparent to-[#1495A0]/25 blur-3xl opacity-70" />
      
      {/* Outer Phone Shell */}
      <div className="relative rounded-[2.8rem] border border-[#C79A54]/40 bg-[#080A0C] p-3.5 shadow-[0_30px_90px_rgba(0,0,0,0.8),0_0_40px_rgba(199,154,84,0.15)]">
        <div className="overflow-hidden rounded-[2.2rem] border border-white/10 bg-[#0D1012] p-5">
          {/* Dynamic Speaker Notch */}
          <div className="mx-auto mb-5 flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-widest text-[#04c9db]">AI ENGINE ACTIVE</span>
            <div className="h-1.5 w-16 rounded-full bg-white/15" />
            <span className="size-2 rounded-full bg-[#04c9db] shadow-[0_0_10px_#04c9db] animate-ping" />
          </div>

          {/* Energy Score Main Dial Card */}
          <div className="glass-panel-gold p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#E8D4A8]">今日个人能量指数</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-serif text-6xl font-black leading-none gold-gradient-text">89</span>
                  <span className="text-xs font-semibold text-[#04c9db]">/ 100</span>
                </div>
              </div>
              <span className="grid size-12 place-items-center rounded-2xl border border-[#04c9db]/40 bg-[#04c9db]/15 text-[#04c9db] shadow-[0_0_18px_rgba(4,201,219,0.35)]">
                <Sparkles className="size-6 animate-pulse" />
              </span>
            </div>

            {/* Dimension Indicators */}
            <div className="mt-6 grid grid-cols-3 gap-2">
              {[
                ["事业格局", "91", "木旺"],
                ["财帛吉凶", "82", "金生"],
                ["姻缘磁场", "76", "水和"]
              ].map(([label, score, tag]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-black/40 p-2.5 text-center backdrop-blur">
                  <p className="text-[10px] text-white/50">{label}</p>
                  <p className="mt-0.5 font-serif text-lg font-bold text-[#E8D4A8]">{score}</p>
                  <span className="mt-1 inline-block rounded border border-[#04c9db]/30 bg-[#04c9db]/15 px-1.5 py-0.5 text-[9px] font-bold text-[#04c9db]">
                    {tag}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendation Teaser */}
          <div className="mt-4 rounded-2xl border border-[#04c9db]/30 bg-[#04c9db]/10 p-4 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-bold text-[#04c9db]">
              <Zap className="size-4 text-[#04c9db]" />
              今日关键提示
            </div>
            <p className="mt-1.5 text-xs font-medium leading-5 text-white/80">
              辰时（07-09）吉星高照，适合推进合作谈判与财务梳理；避免冲动情绪。
            </p>
          </div>

          {/* Check List */}
          <div className="mt-4 grid gap-2">
            {["AI 24/7 秒级大运推演", "易玺大师 1 对 1 定盘背书", "企业决策 / 个人命理全适用"].map((item) => (
              <div key={item} className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/4 px-3.5 py-2.5 text-xs font-semibold text-white/85">
                <CheckCircle2 className="size-4 shrink-0 text-[#04c9db]" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HumanTrustRow() {
  return (
    <div className="mt-9 flex flex-wrap items-center gap-4 border-t border-white/10 pt-7">
      <div className="flex -space-x-3">
        {[peopleImages.clientA, peopleImages.founder, peopleImages.clientB, peopleImages.clientC].map((src, index) => (
          <img
            key={src}
            src={src}
            alt={`顾问用户 ${index + 1}`}
            className="size-11 rounded-full border-2 border-[#C79A54]/60 object-cover shadow-lg"
          />
        ))}
      </div>
      <div>
        <p className="text-sm font-semibold text-white">真实实战咨询场景 · 随身 AI 命理决策顾问</p>
        <p className="mt-0.5 text-xs text-white/50">已服务 50,000+ 用户看清人生与商业决断节奏</p>
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden metaphysics-bg px-5 py-20 sm:py-28 lg:py-32">
      {/* Ambient background decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-32 top-10 size-[680px] rounded-full border border-[#C79A54]/20 bg-[#C79A54]/5 blur-3xl" />
        <div className="absolute -left-20 bottom-10 size-[480px] rounded-full border border-[#04c9db]/20 bg-[#04c9db]/5 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div>
          <span className="cyan-glow-badge inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.2em]">
            <Sparkles className="size-3.5 text-[#04c9db]" />
            AI FENG SHUI MASTER PLATFORM
          </span>

          <h1 className="mt-6 font-serif text-4xl font-black leading-[1.1] text-white sm:text-6xl lg:text-7xl">
            AI 风水命理平台 <br />
            <span className="gold-gradient-text">帮你看清方向与运势节奏</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-white/75 sm:text-xl">
            结合 AI 秒级数据推演与易玺大师实战专业经验，为你的事业、财运、感情与人生布局，提供更精准、更深度的行动指南。
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/dashboard" className={ctaPrimary}>
              免费测算 <ArrowRight className="size-4" />
            </Link>
            <Link href="#master" className={ctaDark}>
              预约大师
            </Link>
            <Link href="#business" className={ctaGhost}>
              创业合作
            </Link>
          </div>

          <div className="mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
            {["AI 24/7 秒级分析", "易玺大师实战背书", "个人 / 企业 / 创业适用"].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold text-white/90 backdrop-blur-md">
                <BadgeCheck className="size-4 shrink-0 text-[#C79A54]" />
                {item}
              </div>
            ))}
          </div>

          <HumanTrustRow />
        </div>

        <HeroPhoneMockup />
      </div>
    </section>
  );
}

function PainSection() {
  return (
    <section className="relative border-t border-white/10 bg-[#080A0C] px-5 py-24">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="WHY NOW"
          title="不是你不努力，而是方向、时机与布局没看清"
          desc="很多时候，真正影响结果的，不只是能力，而是你是否在正确的时间，做出正确的选择与布局。"
        />

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {painCards.map(([title, desc, Icon]) => (
            <IconCard key={title} icon={Icon} title={title} desc={desc} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CoreSolutionSection() {
  return (
    <section className="relative border-t border-white/10 bg-[#0A0D0F] px-5 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
          <SectionIntro
            eyebrow="DUAL-ENGINE METHODOLOGY"
            title="AI 提升效率，大师决定深度"
            desc="AI 负责快速整理问题结构与大运趋势，易玺大师负责在关键节点把脉定盘，给出真正可落地的闭环策略。"
          />
          <div className="relative overflow-hidden rounded-[2.5rem] border border-[#C79A54]/30 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
            <img
              src={peopleImages.consultation}
              alt="AI 风水命理咨询场景"
              className="h-80 w-full object-cover sm:h-96"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080A0C] via-transparent to-transparent opacity-90" />
            <div className="absolute bottom-6 inset-x-6 rounded-2xl border border-white/15 bg-black/60 p-5 backdrop-blur-md">
              <p className="text-xs font-bold tracking-widest text-[#C79A54]">AI + MASTER CONSULTATION</p>
              <p className="mt-1.5 font-serif text-lg font-bold text-white">秒级整理 · 专家定盘 · 实战指导</p>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {methodCards.map(([title, desc, Icon]) => (
            <IconCard key={title} icon={Icon} title={title} desc={desc} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ServicesSection() {
  return (
    <section id="services" className="relative border-t border-white/10 bg-[#080A0C] px-5 py-24">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="OUR SERVICES"
          title="你现在即可体验的核心服务"
          desc="从快速秒测到深度报告，从个人八字到企业风水布局，满足不同阶段决策需求。"
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {services.map(([title, desc, cta, Icon]) => (
            <article key={title} className="group glass-panel glass-panel-interactive flex flex-col justify-between p-7">
              <div>
                <span className="grid size-12 place-items-center rounded-xl border border-[#C79A54]/30 bg-[#C79A54]/10 text-[#C79A54] transition group-hover:scale-105">
                  <Icon className="size-6" />
                </span>
                <h3 className="mt-6 font-serif text-2xl font-bold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/60">{desc}</p>
              </div>
              <Link href="/dashboard" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#E8D4A8] transition group-hover:text-[#FFF0D0]">
                {cta} <ChevronRight className="size-4 transition group-hover:translate-x-1" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function MasterSection() {
  return (
    <section id="master" className="relative border-t border-white/10 bg-[#050607] px-5 py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-[#C79A54]/35 bg-[#0D1012] p-4 shadow-[0_0_50px_rgba(199,154,84,0.15)]">
          <div className="relative min-h-[480px] overflow-hidden rounded-[2rem] bg-black">
            <img
              src={peopleImages.advisor}
              alt="易玺大师"
              className="absolute inset-0 h-full w-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050607] via-transparent to-transparent" />
            <div className="absolute bottom-6 inset-x-6 rounded-2xl border border-[#C79A54]/30 bg-[#080A0C]/85 p-5 backdrop-blur-md">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C79A54]">CHIEF CONSULTANT</span>
              <h3 className="mt-1 font-serif text-2xl font-bold text-white">易玺大师</h3>
              <p className="mt-1.5 text-xs leading-5 text-white/70">
                实战派风水命理顾问，专注于把传统八字/紫微/风水与现实商业决策高效融合。
              </p>
            </div>
          </div>
        </div>

        <div>
          <SectionIntro
            eyebrow="MASTER PROFILE"
            title="易玺大师｜实战派风水命理顾问"
            desc="专注企业商业风水、个人命理研判与空间布局策略，擅长看清大运趋势、规避财务与风险隐患、找准真正行动节奏。"
          />

          <div className="mt-8 flex flex-wrap gap-2.5">
            {["紫微斗数判断大运", "风水布局优化磁场", "商业战略视角建议", "企业 / 个人 / 创业适用"].map((item) => (
              <span key={item} className="rounded-full border border-[#C79A54]/30 bg-[#C79A54]/10 px-4 py-2 text-xs font-semibold text-[#E8D4A8]">
                {item}
              </span>
            ))}
          </div>

          <div className="mt-10">
            <Link href="/dashboard" className={ctaPrimary}>
              预约大师深度咨询 <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function BusinessSection() {
  return (
    <section id="business" className="relative border-t border-white/10 bg-[#080A0C] px-5 py-24 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(199,154,84,0.15),transparent_40%)]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-end">
          <SectionIntro
            eyebrow="AI FENG SHUI BUSINESS PLATFORM"
            title="不只是测算服务，更是 AI 赋能的风水创业平台"
            desc="适合想进入风水命理蓝海市场、打造个人 IP 顾问品牌、开展线上咨询业务的创业者。"
            inverted
          />

          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link href="/dashboard" className={ctaPrimary}>
              申请了解创业合作 <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {businessAdvantages.map(([title, desc, Icon]) => (
            <IconCard key={title} icon={Icon} title={title} desc={desc} dark />
          ))}
        </div>
      </div>
    </section>
  );
}

function PackageSection() {
  return (
    <section className="relative border-t border-white/10 bg-[#050607] px-5 py-24">
      <div className="mx-auto max-w-7xl">
        <SectionIntro eyebrow="START NOW" title="从一次测算开始，看清你的下一步" />

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {packages.map(([title, desc, cta, price, items], index) => (
            <article
              key={title}
              className={`relative flex flex-col justify-between rounded-[2.5rem] p-8 sm:p-9 transition ${
                index === 1
                  ? "glass-panel-gold border-[#C79A54] shadow-[0_0_40px_rgba(199,154,84,0.2)]"
                  : "glass-panel"
              }`}
            >
              {index === 1 ? (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full border border-[#C79A54] bg-[#C79A54] px-4 py-1 text-[11px] font-bold tracking-widest text-[#050607]">
                  MOST POPULAR / 热门推荐
                </span>
              ) : null}

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C79A54]">{price}</p>
                <h3 className="mt-3 font-serif text-3xl font-bold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/60">{desc}</p>

                <div className="mt-7 space-y-3 border-t border-white/10 pt-6">
                  {items.map((item) => (
                    <p key={item} className="flex items-center gap-2.5 text-xs font-medium text-white/80">
                      <CheckCircle2 className="size-4 shrink-0 text-[#C79A54]" />
                      {item}
                    </p>
                  ))}
                </div>
              </div>

              <Link
                href="/dashboard"
                className={`mt-9 w-full ${index === 1 ? ctaPrimary : ctaDark}`}
              >
                {cta} <ArrowRight className="size-4" />
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-12 glass-panel-gold px-8 py-10 text-center">
          <p className="font-serif text-xl font-bold text-white sm:text-3xl">
            AI 给你速度，大师给你深度，平台给你机会。
          </p>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <AppShell>
      <main className="overflow-hidden bg-[#050607]">
        <HeroSection />
        <PainSection />
        <CoreSolutionSection />
        <ServicesSection />
        <MasterSection />
        <BusinessSection />
        <PackageSection />
      </main>
    </AppShell>
  );
}
