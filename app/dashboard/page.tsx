import Link from "next/link";
import {
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Coins,
  CreditCard,
  FileText,
  Flame,
  Palette,
  ShoppingBag,
  Sparkles,
  TrendingUp
} from "lucide-react";
import {
  dailyRituals,
  dashboardCourses,
  dashboardProducts,
  dashboardStats,
  recentInsights,
  reportTypes
} from "@/lib/data";
import { AppShell, MetricCard, SectionHeader, StatusPill } from "@/components/shell";
import { FengshuiChat } from "@/components/fengshui-chat";
import { HierarchyTree } from "@/components/hierarchy-tree";

export default function DashboardPage() {
  return (
    <AppShell>
      <main className="px-5 py-8">
        <div className="mx-auto max-w-7xl">
          <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded border border-black/10 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <StatusPill>Plus 会员 · 2,680 点可用</StatusPill>
                  <h1 className="mt-4 text-3xl font-semibold md:text-5xl">会员 Dashboard</h1>
                  <p className="mt-3 max-w-2xl text-ink/65">
                    填生日资料后，每日运势、AI 风水师、报告中心、点数钱包、商城课程和推荐收益都集中在这里。
                  </p>
                </div>
                <button className="inline-flex items-center gap-2 rounded bg-ink px-4 py-3 text-sm font-semibold text-white">
                  充值点数 <CreditCard className="size-4" />
                </button>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {dashboardStats.map((stat) => (
                  <MetricCard key={stat.label} {...stat} />
                ))}
              </div>
            </div>

            <div className="rounded border border-black/10 bg-ink p-6 text-white shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/58">今日运势</p>
                  <h2 className="mt-2 text-2xl font-semibold">稳中有进，先整理后扩张</h2>
                </div>
                <CalendarDays className="size-8 text-gold" />
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-[150px_1fr]">
                <div className="rounded border border-gold/35 bg-gold/12 p-4">
                  <p className="text-xs text-white/55">今日评分</p>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-5xl font-semibold leading-none text-gold">89</span>
                    <span className="pb-1 text-sm text-white/52">/100</span>
                  </div>
                  <p className="mt-3 text-xs text-white/62">适合推进合作与整理计划</p>
                </div>
                <div className="rounded border border-white/12 bg-white/8 p-4">
                  <div className="grid gap-4">
                    {[
                      ["财运", 82, "偏财不宜冒进"],
                      ["事业", 91, "适合谈合作"],
                      ["感情", 76, "沟通宜慢"]
                    ].map(([label, score, note]) => (
                      <div key={label as string}>
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-semibold text-white">{label}</span>
                          <span className="text-gold">{score}/100</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-white/12">
                          <div
                            className="h-2 rounded-full bg-gold"
                            style={{ width: `${score}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-white/52">{note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  ["财运", "偏财不宜冒进"],
                  ["事业", "适合谈合作"],
                  ["感情", "沟通宜慢"],
                  ["健康", "注意睡眠"]
                ].map(([label, value]) => (
                  <div key={label} className="rounded border border-white/12 bg-white/8 p-4">
                    <p className="text-xs text-white/50">{label}</p>
                    <p className="mt-2 font-semibold">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded bg-white/8 p-3">
                  <Palette className="size-4 text-gold" />
                  <p className="mt-2 text-sm">幸运色：青绿</p>
                </div>
                <div className="rounded bg-white/8 p-3">
                  <TrendingUp className="size-4 text-gold" />
                  <p className="mt-2 text-sm">贵人方：东南</p>
                </div>
                <div className="rounded bg-white/8 p-3">
                  <Flame className="size-4 text-gold" />
                  <p className="mt-2 text-sm">今日宜：复盘</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-5 lg:grid-cols-[0.8fr_1.1fr_1.1fr]">
            <div className="rounded border border-black/10 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-ink/55">连续签到</p>
                  <p className="mt-2 text-4xl font-semibold">7 天</p>
                </div>
                <span className="grid size-11 place-items-center rounded bg-gold/15 text-gold">
                  <Sparkles className="size-5" />
                </span>
              </div>
              <div className="mt-5 grid grid-cols-7 gap-1">
                {["一", "二", "三", "四", "五", "六", "日"].map((day) => (
                  <div key={day} className="grid aspect-square place-items-center rounded bg-cinnabar text-xs font-semibold text-white">
                    {day}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-ink/60">保持 14 天可解锁一次免费深度分析。</p>
            </div>

            <div className="rounded border border-black/10 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">今日开运任务</h2>
                <span className="rounded bg-cloud px-2.5 py-1 text-xs font-medium text-ink/58">3 / 3</span>
              </div>
              <div className="grid gap-3">
                {dailyRituals.map((item) => (
                  <div key={item.title} className="flex gap-3 rounded border border-black/10 bg-cloud p-3">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-cinnabar" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold">{item.title}</p>
                        <span className="shrink-0 rounded bg-white px-2 py-1 text-xs text-cinnabar">{item.reward}</span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-ink/58">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded border border-black/10 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">最近洞察</h2>
                <span className="rounded bg-cloud px-2.5 py-1 text-xs font-medium text-ink/58">AI 总结</span>
              </div>
              <div className="grid gap-3">
                {recentInsights.map((item) => (
                  <div key={item.title} className="rounded border border-black/10 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{item.title}</p>
                      <span className="rounded bg-gold/15 px-2 py-1 text-xs text-ink">{item.tag}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-ink/58">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <FengshuiChat />

            <div className="rounded border border-black/10 bg-white p-5">
              <SectionHeader
                eyebrow="AI Report Center"
                title="报告中心"
                desc="用户可用点数生成财运、事业、感情、合盘、流年、择日与公司风水分析报告。"
              />
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {reportTypes.map((report) => (
                  <div key={report.title} className="rounded border border-black/10 bg-rice p-4">
                    <div className="flex items-center justify-between gap-3">
                      <FileText className="size-5 text-cinnabar" />
                      <span className="rounded bg-cloud px-2 py-1 text-xs text-ink/60">{report.tag}</span>
                    </div>
                    <p className="mt-4 font-semibold">{report.title}</p>
                    <p className="mt-2 text-sm text-ink/55">消耗 {report.points} 点</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-6">
            <div className="rounded border border-black/10 bg-white p-5">
              <div className="mb-5 flex items-center gap-2">
                <Coins className="size-5 text-gold" />
                <h2 className="text-xl font-semibold">点数钱包</h2>
              </div>
              {[
                ["购买 Pro 月费", "+1,500 点"],
                ["生成财运报告", "-120 点"],
                ["推荐奖励", "+300 点"],
                ["产品赠送", "+80 点"]
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-t border-black/10 py-3 text-sm">
                  <span className="text-ink/65">{label}</span>
                  <span className="font-semibold">{value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6 rounded border border-black/10 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="size-5 text-cinnabar" />
                <h2 className="text-xl font-semibold">产品商城</h2>
              </div>
              <p className="text-sm text-ink/55">5 个常用类别，购买可赠送点数</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {dashboardProducts.map((product) => (
                <Link
                  key={product.name}
                  href={`/dashboard/products/${product.slug}`}
                  className="group overflow-hidden rounded border border-black/10 bg-rice transition hover:-translate-y-0.5 hover:shadow-soft"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-32 w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="p-4">
                    <p className="text-xs font-medium text-cinnabar">{product.category}</p>
                    <h3 className="mt-2 min-h-10 font-semibold leading-5">{product.name}</h3>
                    <div className="mt-3 flex items-center justify-between gap-2 text-sm">
                      <span className="font-semibold text-cinnabar">{product.price}</span>
                      <span className="rounded bg-cloud px-2 py-1 text-xs text-ink/58">{product.points}</span>
                    </div>
                    <p className="mt-3 text-xs font-semibold text-ink/50 transition group-hover:text-cinnabar">
                      查看完整介绍
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-6 rounded border border-black/10 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BookOpenCheck className="size-5 text-cinnabar" />
                <h2 className="text-xl font-semibold">课程推荐</h2>
              </div>
              <p className="text-sm text-ink/55">5 个课程类别，从入门到导师认证</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {dashboardCourses.map((course) => (
                <Link
                  key={course.name}
                  href={`/dashboard/courses/${course.slug}`}
                  className="group overflow-hidden rounded border border-black/10 bg-rice transition hover:-translate-y-0.5 hover:shadow-soft"
                >
                  <img
                    src={course.image}
                    alt={course.name}
                    className="h-32 w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="p-4">
                    <p className="text-xs font-medium text-cinnabar">{course.category}</p>
                    <h3 className="mt-2 min-h-10 font-semibold leading-5">{course.name}</h3>
                    <div className="mt-3 flex items-center justify-between gap-2 text-sm">
                      <span className="font-semibold text-cinnabar">{course.price}</span>
                      <span className="rounded bg-cloud px-2 py-1 text-xs text-ink/58">{course.reward}</span>
                    </div>
                    <p className="mt-3 text-xs font-semibold text-ink/50 transition group-hover:text-cinnabar">
                      查看课程详情
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <HierarchyTree />
        </div>
      </main>
    </AppShell>
  );
}
