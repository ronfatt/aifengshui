"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { navItems } from "@/lib/data";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      setIsLoggedIn(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(Boolean(data.session));
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    const supabase = createBrowserSupabaseClient();

    if (supabase) {
      await supabase.auth.signOut();
    }

    setIsLoggedIn(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-rice text-ink">
      <header className="sticky top-0 z-30 border-b border-[#064E3B]/10 bg-rice/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded bg-[#064E3B] text-lg font-semibold text-[#D4AF37]">
              风
            </span>
            <span>
              <span className="block text-sm font-semibold leading-tight text-[#064E3B]">AI Feng Shui Master</span>
              <span className="block text-xs text-ink/58">AI 命理决策系统</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1 rounded-full border border-[#064E3B]/10 bg-white/70 p-1">
            {navItems.filter((item) => item.href !== "/auth").map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-ink/72 transition hover:bg-[#ECFDF5] hover:text-[#064E3B]"
                >
                  <Icon className="size-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
            {isLoggedIn ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-ink/72 transition hover:bg-[#FEF2F2] hover:text-[#B91C1C]"
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">登出</span>
              </button>
            ) : (
              navItems
                .filter((item) => item.href === "/auth")
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-ink/72 transition hover:bg-[#ECFDF5] hover:text-[#064E3B]"
                    >
                      <Icon className="size-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </Link>
                  );
                })
            )}
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
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8A6D00]">{eyebrow}</p>
      <h2 className="mt-3 font-serif text-3xl font-semibold text-[#064E3B] md:text-5xl">{title}</h2>
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
        <span className="grid size-10 place-items-center rounded bg-[#ECFDF5] text-[#064E3B]">
          <Icon className="size-5" />
        </span>
      </div>
      {change ? <p className="mt-4 text-sm text-[#064E3B]">{change}</p> : null}
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
