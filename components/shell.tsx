import Link from "next/link";
import { navItems } from "@/lib/data";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-rice text-ink">
      <header className="sticky top-0 z-30 border-b border-black/10 bg-rice shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded bg-ink text-lg font-semibold text-rice">
              风
            </span>
            <span>
              <span className="block text-sm font-semibold leading-tight">AI Feng Shui Master</span>
              <span className="block text-xs text-ink/58">AI 命理决策系统</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1 rounded border border-black/10 bg-white/70 p-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded px-3 py-2 text-sm font-medium text-ink/72 transition hover:bg-cloud hover:text-ink"
                >
                  <Icon className="size-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  desc
}: {
  eyebrow: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cinnabar">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold text-ink md:text-5xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-ink/68 md:text-lg">{desc}</p>
    </div>
  );
}

export function MetricCard({
  label,
  value,
  change,
  icon: Icon
}: {
  label: string;
  value: string;
  change?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-ink/58">{label}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
        </div>
        <span className="grid size-10 place-items-center rounded bg-cloud text-cinnabar">
          <Icon className="size-5" />
        </span>
      </div>
      {change ? <p className="mt-4 text-sm text-cinnabar">{change}</p> : null}
    </div>
  );
}

export function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded border border-black/10 bg-cloud px-2.5 py-1 text-xs font-medium text-ink/70">
      {children}
    </span>
  );
}
