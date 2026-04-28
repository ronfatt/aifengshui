import { AlertTriangle, Banknote, Search, Settings2 } from "lucide-react";
import { adminModules, adminStats, orders } from "@/lib/data";
import { AppShell, MetricCard, StatusPill } from "@/components/shell";

export default function AdminPage() {
  return (
    <AppShell>
      <main className="px-5 py-8">
        <div className="mx-auto max-w-7xl">
          <section className="rounded border border-black/10 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <StatusPill>老板后台 · Admin Console</StatusPill>
                <h1 className="mt-4 text-3xl font-semibold md:text-5xl">平台运营总览</h1>
                <p className="mt-3 max-w-3xl text-ink/65">
                  管理用户、点数、AI Prompt、产品、课程、订单、三层分润、代理配套与支付审核。
                </p>
              </div>
              <div className="flex gap-2">
                <button className="grid size-11 place-items-center rounded border border-black/10" aria-label="搜索">
                  <Search className="size-5" />
                </button>
                <button className="grid size-11 place-items-center rounded bg-ink text-white" aria-label="设置">
                  <Settings2 className="size-5" />
                </button>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {adminStats.map((stat) => (
                <MetricCard key={stat.label} {...stat} />
              ))}
            </div>
          </section>

          <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded border border-black/10 bg-white p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cinnabar">Modules</p>
                  <h2 className="mt-2 text-2xl font-semibold">后台功能地图</h2>
                </div>
                <StatusPill>MVP 管理范围</StatusPill>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {adminModules.map((module) => {
                  const Icon = module.icon;
                  return (
                    <article key={module.title} className="rounded border border-black/10 bg-rice p-4">
                      <Icon className="size-5 text-cinnabar" />
                      <h3 className="mt-3 font-semibold">{module.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-ink/58">{module.desc}</p>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded border border-black/10 bg-white p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">订单管理</h2>
                  <StatusPill>Pending / Paid / Processing / Completed</StatusPill>
                </div>
                <div className="mt-5 overflow-hidden rounded border border-black/10">
                  {orders.map((order) => (
                    <div key={order.id} className="grid grid-cols-[1fr_0.8fr_0.7fr] gap-3 border-t border-black/10 p-4 first:border-t-0">
                      <div>
                        <p className="font-semibold">{order.id}</p>
                        <p className="text-sm text-ink/55">{order.customer}</p>
                      </div>
                      <div>
                        <p className="text-sm text-ink/55">{order.type}</p>
                        <p className="font-semibold">{order.amount}</p>
                      </div>
                      <div className="text-right">
                        <span className="rounded bg-cloud px-2 py-1 text-xs font-medium text-ink/70">
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded border border-black/10 bg-ink p-5 text-white">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-1 size-5 shrink-0 text-gold" />
                  <div>
                    <h2 className="text-xl font-semibold">AI 与合规控制</h2>
                    <p className="mt-2 text-sm leading-6 text-white/68">
                      每个 AI 功能独立配置点数、等级权限、Prompt 模板、敏感词、免责声明和报告模板。所有命理建议都需要保留风险提醒与行动建议。
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded border border-black/10 bg-white p-5">
                <div className="flex items-start gap-3">
                  <Banknote className="mt-1 size-5 shrink-0 text-cinnabar" />
                  <div>
                    <h2 className="text-xl font-semibold">三层分润规则</h2>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                      {[
                        ["第一代", "20%"],
                        ["第二代", "10%"],
                        ["第三代", "5%"]
                      ].map(([level, pct]) => (
                        <div key={level} className="rounded bg-cloud p-4">
                          <p className="text-sm text-ink/55">{level}</p>
                          <p className="mt-2 text-2xl font-semibold text-cinnabar">{pct}</p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-sm leading-6 text-ink/58">
                      订阅、点数、报告、产品、课程和真人服务可分别设置佣金比例，后台记录收益，不开放点数提现。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
