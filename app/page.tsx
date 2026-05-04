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
} from "lucide-react";
import { AppShell } from "@/components/shell";

const ctaPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#B91C1C] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(185,28,28,0.22)] transition hover:-translate-y-0.5 hover:bg-[#991B1B]";
const ctaDark =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#064E3B] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(6,78,59,0.18)] transition hover:-translate-y-0.5 hover:bg-[#053C2F]";
const ctaGhost =
  "inline-flex items-center justify-center gap-2 rounded-full border border-[#D4AF37]/45 bg-white px-6 py-3.5 text-sm font-semibold text-[#064E3B] shadow-sm transition hover:-translate-y-0.5 hover:border-[#D4AF37] hover:shadow-md";

const painCards = [
  ["机会来了，不敢出手", "不知道现在是不是最好的时机。", Target],
  ["决定很多，还是没把握", "信息太乱，越分析越不确定。", Compass],
  ["想布局未来，看不清风险", "事业、财运、合作与方向，都需要先判断节奏。", ShieldCheck]
] as const;

const methodCards = [
  ["AI即时分析", "快速整理问题、趋势与行动建议。", Bot],
  ["大师深度诊断", "结合命理、风水与实战经验判断关键节点。", Gem],
  ["双引擎服务", "AI先给方向，大师再做判断，更快、更稳、更落地。", Orbit]
] as const;

const services = [
  ["今日运势", "快速了解今日事业、财运、感情与行动方向。", "立即体验", CalendarDays],
  ["AI深度报告", "生成个人趋势、优势、风险与未来建议。", "生成报告", FileText],
  ["风水布局建议", "针对家居、办公室、店铺提供布局建议。", "查看方案", Compass],
  ["大师一对一咨询", "由易玺大师提供深度判断与行动方案。", "预约咨询", MessageCircle]
] as const;

const businessAdvantages = [
  ["AI辅助接待", "自动完成初步测算与问题整理。", Bot],
  ["标准化产品输出", "报告、咨询、布局建议可复制交付。", PackageCheck],
  ["大师IP背书", "借助易玺大师方法论提升信任。", BadgeCheck],
  ["可复制创业模式", "适合顾问、代理、内容创业者与门店。", Network]
] as const;

const packages = [
  ["AI深度报告", "适合想了解事业、财运、感情与未来趋势的人。", "生成报告", "点数制", ["趋势分析", "风险提醒", "行动建议"]],
  ["大师咨询", "适合正在面对关键决定，需要深度判断的人。", "预约大师", "预约制", ["深度判断", "命理风水结合", "定制方案"]],
  ["创业合作", "适合想进入AI风水命理服务市场的人。", "申请合作", "合作制", ["平台系统", "AI工具", "合作支持"]]
] as const;

const peopleImages = {
  advisor: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=82",
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
      <p className={`text-sm font-semibold uppercase tracking-[0.18em] ${inverted ? "text-[#D4AF37]" : "text-[#8A6D00]"}`}>
        {eyebrow}
      </p>
      <h2 className={`mt-3 text-4xl font-semibold leading-tight md:text-6xl ${inverted ? "text-white" : "text-[#064E3B]"}`}>
        {title}
      </h2>
      {desc ? <p className={`mt-5 text-lg leading-8 ${inverted ? "text-white/68" : "text-[#333333]/68"}`}>{desc}</p> : null}
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
    <article
      className={`rounded-3xl border p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
        dark ? "border-white/10 bg-white/8 text-white" : "border-[#064E3B]/10 bg-white text-[#0B0B0B]"
      }`}
    >
      <span className={`grid size-12 place-items-center rounded-2xl ${dark ? "bg-[#D4AF37]/16 text-[#D4AF37]" : "bg-[#ECFDF5] text-[#064E3B]"}`}>
        <Icon className="size-6" />
      </span>
      <h3 className="mt-5 text-xl font-semibold">{title}</h3>
      <p className={`mt-3 text-sm leading-6 ${dark ? "text-white/62" : "text-[#333333]/62"}`}>{desc}</p>
    </article>
  );
}

function HeroPhoneMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[370px]">
      <div className="absolute inset-x-10 top-10 h-[86%] rounded-[3rem] bg-[#D4AF37]/20 blur-3xl" />
      <div className="relative rounded-[2.6rem] border border-[#D4AF37]/35 bg-[#102019] p-3 shadow-[0_28px_90px_rgba(6,78,59,0.35)]">
        <div className="rounded-[2rem] bg-[#F7F7F7] p-4">
          <div className="mx-auto mb-5 h-1.5 w-20 rounded-full bg-[#102019]/12" />
          <div className="rounded-3xl bg-[#102019] p-5 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">今日能量评分</p>
                <p className="mt-2 text-7xl font-semibold leading-none">89</p>
              </div>
              <span className="grid size-14 place-items-center rounded-2xl bg-[#D4AF37]/15 text-[#D4AF37]">
                <Sparkles className="size-7" />
              </span>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2">
              {[
                ["事业", "91"],
                ["财运", "82"],
                ["感情", "76"]
              ].map(([label, score]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/8 p-3 text-center">
                  <p className="text-xs text-white/48">{label}</p>
                  <p className="mt-1 text-2xl font-semibold text-[#D4AF37]">{score}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 rounded-3xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8A6D00]">今日建议</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#0B0B0B]">
              适合整理方向、规划资源、重新判断下一步行动。
            </p>
          </div>
          <div className="mt-4 grid gap-2">
            {["AI 24/7 即时分析", "易玺大师实战背书", "个人 / 企业 / 创业适用"].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-[#064E3B]">
                <CheckCircle2 className="size-4 text-[#D4AF37]" />
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
    <div className="mt-7 flex flex-wrap items-center gap-4">
      <div className="flex -space-x-3">
        {[peopleImages.clientA, peopleImages.founder, peopleImages.clientB, peopleImages.clientC].map((src, index) => (
          <img
            key={src}
            src={src}
            alt={`用户头像 ${index + 1}`}
            className="size-12 rounded-full border-2 border-white object-cover shadow-sm"
          />
        ))}
      </div>
      <div>
        <p className="text-sm font-semibold text-[#064E3B]">真实咨询场景，更像一位随身顾问</p>
        <p className="mt-1 text-sm text-[#333333]/60">适合个人测算、企业决策与顾问型创业使用</p>
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#ECFDF5] px-5 py-20 md:py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-28 top-10 size-[620px] rounded-full border border-[#D4AF37]/30 opacity-30" />
        <div className="absolute right-12 top-36 size-[380px] rounded-full border border-[#D4AF37]/30 opacity-30" />
        <div className="absolute left-0 top-0 h-full w-full bg-[linear-gradient(115deg,rgba(255,255,255,0.92),rgba(236,253,245,0.68),rgba(6,78,59,0.12))]" />
      </div>
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <span className="inline-flex rounded-full border border-[#D4AF37]/35 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#8A6D00] shadow-sm">
            AI Feng Shui Master
          </span>
          <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[1.05] text-[#064E3B] md:text-7xl">
            AI风水命理平台，帮你看清方向
          </h1>
          <p className="mt-6 max-w-3xl text-xl font-semibold leading-9 text-[#0B0B0B] md:text-2xl">
            结合 AI 快速分析与易玺大师专业判断，为你的事业、财运、感情与人生布局，提供更清晰、更实战的行动建议。
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
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
          <div className="mt-9 grid max-w-3xl gap-3 sm:grid-cols-3">
            {["AI 24/7 即时分析", "易玺大师实战背书", "个人 / 企业 / 创业适用"].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-full border border-[#D4AF37]/25 bg-white/80 px-4 py-3 text-sm font-semibold text-[#064E3B] shadow-sm">
                <BadgeCheck className="size-4 shrink-0 text-[#D4AF37]" />
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
    <section className="bg-[#F7F7F7] px-5 py-20">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="WHY NOW"
          title="不是你不努力，而是方向、时间、布局没对上"
          desc="很多时候，真正影响结果的，不只是能力，而是你是否在正确的时间，做了正确的决定。"
        />
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
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
    <section className="bg-white px-5 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <SectionIntro
            eyebrow="AI + MASTER METHOD"
            title="AI提升效率，大师决定深度"
            desc="AI 负责快速分析与整理方向，易玺大师负责判断关键节点、风险与真正可执行的策略。"
          />
          <div className="overflow-hidden rounded-[2rem] border border-[#064E3B]/10 bg-[#F7F7F7] shadow-sm">
            <img
              src={peopleImages.consultation}
              alt="AI 风水命理咨询场景"
              className="h-72 w-full object-cover"
            />
          </div>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
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
    <section id="services" className="bg-[#ECFDF5] px-5 py-20">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="OUR SERVICES"
          title="你现在就可以开始的服务"
          desc="从快速测算到深度咨询，从个人方向到企业布局，选择适合你当前阶段的服务。"
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {services.map(([title, desc, cta, Icon]) => (
            <article key={title} className="rounded-[2rem] border border-[#064E3B]/10 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl">
              <Icon className="size-7 text-[#D4AF37]" />
              <h3 className="mt-5 text-2xl font-semibold text-[#064E3B]">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#333333]/64">{desc}</p>
              <Link href="/dashboard" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#B91C1C]">
                {cta} <ArrowRight className="size-4" />
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
    <section id="master" className="bg-white px-5 py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative overflow-hidden rounded-[2rem] border border-[#064E3B]/10 bg-[#F7F7F7] p-8">
          <div className="absolute right-8 top-8 rounded-full bg-[#D4AF37]/15 px-4 py-2 text-xs font-semibold text-[#8A6D00]">
            MASTER PROFILE
          </div>
          <div className="relative min-h-[520px] overflow-hidden rounded-[1.5rem] bg-white">
            <img
              src={peopleImages.advisor}
              alt="易玺大师顾问形象示意"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(6,78,59,0.88))]" />
            <div className="absolute inset-x-6 bottom-6 rounded-3xl border border-white/20 bg-white/12 p-5 text-white backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">Master Consultation</p>
              <p className="mt-2 text-2xl font-semibold">真人顾问形象区</p>
              <p className="mt-2 text-sm leading-6 text-white/72">之后可替换为易玺大师本人照片或品牌形象照。</p>
            </div>
          </div>
        </div>
        <div>
          <SectionIntro
            eyebrow="MASTER PROFILE"
            title="易玺大师｜实战派风水命理顾问"
            desc="专注企业风水、个人命理与布局策略，擅长把命理、风水与现实决策结合，帮助用户看清趋势、规避风险、找准行动节奏。"
          />
          <div className="mt-7 flex flex-wrap gap-2">
            {["紫微斗数判断趋势", "风水布局优化环境", "战略视角给出建议", "企业 / 个人 / 创业适用"].map((item) => (
              <span key={item} className="rounded-full border border-[#D4AF37]/25 bg-[#ECFDF5] px-4 py-2 text-sm font-semibold text-[#064E3B]">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function BusinessSection() {
  return (
    <section id="business" className="relative overflow-hidden bg-[#102019] px-5 py-24 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(212,175,55,0.24),transparent_32%),linear-gradient(120deg,rgba(185,28,28,0.18),transparent_38%)]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <SectionIntro
            eyebrow="AI FENG SHUI BUSINESS"
            title="不只是算命服务，更是AI赋能的风水创业平台"
            desc="适合想进入风水命理行业、打造个人品牌、开展线上咨询服务的人。"
            inverted
          />
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link href="/dashboard" className={ctaPrimary}>
              申请了解创业合作 <ArrowRight className="size-4" />
            </Link>
            <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/15">
              查看平台模式
            </Link>
          </div>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {businessAdvantages.map(([title, desc, Icon]) => (
            <IconCard key={title} icon={Icon} title={title} desc={desc} dark />
          ))}
        </div>
        <div className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/8 shadow-[0_26px_80px_rgba(0,0,0,0.25)]">
          <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
            <img
              src={peopleImages.consultation}
              alt="AI 风水创业平台咨询团队"
              className="h-72 w-full object-cover lg:h-full"
            />
            <div className="p-8 lg:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">REAL SERVICE FLOW</p>
              <h3 className="mt-3 text-3xl font-semibold leading-tight">从线上测算，到真人咨询，再到产品成交</h3>
              <p className="mt-4 text-sm leading-7 text-white/64">
                平台不是只有页面和报告，而是把顾问、客户、内容、课程与代理服务串成可落地的服务流程。
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["客户接待", "报告交付", "咨询预约", "创业转化"].map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-semibold text-white/82">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PackageSection() {
  return (
    <section className="bg-[#ECFDF5] px-5 py-20">
      <div className="mx-auto max-w-7xl">
        <SectionIntro eyebrow="START NOW" title="从一次测算开始，看清你的下一步" />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {packages.map(([title, desc, cta, price, items], index) => (
            <article
              key={title}
              className={`rounded-[2rem] border p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl ${
                index === 1 ? "border-[#D4AF37] bg-[#102019] text-white" : "border-[#064E3B]/10 bg-white text-[#0B0B0B]"
              }`}
            >
              <p className={index === 1 ? "text-sm font-semibold text-[#D4AF37]" : "text-sm font-semibold text-[#8A6D00]"}>{price}</p>
              <h3 className="mt-3 text-2xl font-semibold">{title}</h3>
              <p className={index === 1 ? "mt-3 text-sm leading-6 text-white/62" : "mt-3 text-sm leading-6 text-[#333333]/62"}>{desc}</p>
              <div className="mt-5 space-y-2">
                {items.map((item) => (
                  <p key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className={index === 1 ? "size-4 text-[#D4AF37]" : "size-4 text-[#064E3B]"} />
                    {item}
                  </p>
                ))}
              </div>
              <Link href="/dashboard" className={index === 1 ? "mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-[#102019]" : "mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#064E3B] px-5 py-3 text-sm font-semibold text-white"}>
                {cta} <ArrowRight className="size-4" />
              </Link>
            </article>
          ))}
        </div>
        <div className="mt-10 rounded-[2rem] bg-[#064E3B] px-6 py-8 text-center text-white shadow-[0_20px_60px_rgba(6,78,59,0.2)]">
          <p className="text-lg font-semibold md:text-2xl">AI 给你速度，大师给你深度，平台给你机会。</p>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <AppShell>
      <main className="overflow-hidden bg-white">
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
