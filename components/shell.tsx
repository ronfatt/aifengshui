"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { navItems } from "@/lib/data";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "ronfatt@gmail.com,charles.leongch@gmail.com,calven1313@gmail.com")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin = Boolean(userEmail && adminEmails.includes(userEmail.toLowerCase()));

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery") && pathname !== "/reset-password") {
      router.replace(`/reset-password${window.location.hash}`);
      return;
    }

    if (!supabase) {
      setIsLoggedIn(false);
      setAuthChecked(true);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(Boolean(data.session));
      setUserEmail(data.session?.user.email || "");
      setAuthChecked(true);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session));
      setUserEmail(session?.user.email || "");
      setAuthChecked(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authChecked && !isLoggedIn && pathname.startsWith("/dashboard")) {
      router.replace("/auth");
    }

    if (authChecked && pathname.startsWith("/admin") && (!isLoggedIn || !isAdmin)) {
      router.replace(isLoggedIn ? "/dashboard" : "/auth");
    }
  }, [authChecked, isAdmin, isLoggedIn, pathname, router]);

  async function handleSignOut() {
    const supabase = createBrowserSupabaseClient();

    if (supabase) {
      await supabase.auth.signOut();
    }

    setIsLoggedIn(false);
    setUserEmail("");
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen metaphysics-bg text-[#E1E8EC] selection:bg-[#C79A54]/30 selection:text-[#FFF0D0]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050607]/85 backdrop-blur-2xl transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/" className="group flex items-center gap-3">
            <span className="relative grid size-11 place-items-center rounded-2xl border border-[#C79A54]/45 bg-gradient-to-br from-[#13171A] to-[#080A0C] text-lg font-bold text-[#E8D4A8] shadow-[0_0_20px_rgba(199,154,84,0.2)] transition group-hover:border-[#C79A54] group-hover:shadow-[0_0_25px_rgba(199,154,84,0.35)]">
              风
              <span className="absolute -bottom-1 -right-1 size-2 rounded-full bg-[#04c9db] shadow-[0_0_10px_#04c9db]" />
            </span>
            <span>
              <span className="block text-sm font-semibold leading-tight gold-gradient-text tracking-wide">
                AI Feng Shui Master
              </span>
              <span className="block text-[11px] font-medium text-white/50 tracking-wider">
                AI 命理决策系统
              </span>
            </span>
          </Link>

          {/* Desktop & Tablet Navigation */}
          <nav className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-[#0D1012]/80 p-1.5 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.5)] sm:flex">
            {navItems.filter((item) => item.href !== "/auth").map((item) => {
              const Icon = item.icon;
              const href = !isLoggedIn && item.href.startsWith("/dashboard") ? "/auth" : item.href;
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={href}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-[#C79A54]/20 text-[#FFF0D0] border border-[#C79A54]/30 shadow-[0_0_12px_rgba(199,154,84,0.15)]"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className={`size-4 ${isActive ? "text-[#C79A54]" : "text-white/60"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            {isLoggedIn ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white/70 transition hover:bg-[#C79A54]/15 hover:text-[#E8D4A8]"
              >
                <LogOut className="size-4 text-[#C79A54]" />
                <span>登出</span>
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
                      className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#E8D4A8] via-[#C79A54] to-[#997233] px-4 py-2 text-sm font-semibold text-[#050607] shadow-[0_4px_16px_rgba(199,154,84,0.3)] transition hover:brightness-110"
                    >
                      <Icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })
            )}
          </nav>
        </div>
      </header>

      <main className="relative pb-28 sm:pb-0">{children}</main>

      {/* Responsive Mobile Bottom Navigation Bar (<640px Viewports) - Safe Area Aware 5-Item Layout */}
      <div className="fixed bottom-0 inset-x-0 z-50 border-t border-white/10 bg-[#080A0C]/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-2xl sm:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
        <div className="grid grid-cols-5 items-end justify-items-center">
          {(() => {
            const HomeIcon = navItems[0].icon;
            const MasterIcon = navItems[1].icon;
            const BusinessIcon = navItems[2].icon;
            const DashboardIcon = navItems[3].icon;
            const AuthIcon = navItems[4].icon;

            return (
              <>
                {/* 1. 首页 */}
                <Link
                  href="/"
                  className={`flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 transition active:scale-95 ${
                    pathname === "/" ? "text-[#E8D4A8]" : "text-white/55 active:text-white"
                  }`}
                >
                  <HomeIcon className={`size-5 ${pathname === "/" ? "text-[#C79A54]" : ""}`} />
                  <span className="text-[10px] font-medium">首页</span>
                </Link>

                {/* 2. 大师咨询 */}
                <Link
                  href="/#master"
                  className={`flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 transition active:scale-95 ${
                    pathname.includes("master") ? "text-[#E8D4A8]" : "text-white/55 active:text-white"
                  }`}
                >
                  <MasterIcon className={`size-5 ${pathname.includes("master") ? "text-[#C79A54]" : ""}`} />
                  <span className="text-[10px] font-medium">大师咨询</span>
                </Link>

                {/* 3. CENTER HIGHLIGHTED ROUND BUTTON - 会员中心 / AI 测算 */}
                <div className="relative -top-6 flex flex-col items-center justify-center">
                  <Link
                    href={!isLoggedIn ? "/auth" : "/dashboard"}
                    className="group relative flex size-14 items-center justify-center rounded-full border-2 border-[#050607] bg-gradient-to-tr from-[#E8D4A8] via-[#C79A54] to-[#04c9db] shadow-[0_0_28px_rgba(4,201,219,0.65)] transition active:scale-90"
                    title="AI 命理测算"
                  >
                    <DashboardIcon className="size-6 text-[#050607] transition group-hover:scale-110" />
                    <span className="absolute -right-0.5 -top-0.5 size-3.5 rounded-full border-2 border-[#050607] bg-[#04c9db] shadow-[0_0_10px_#04c9db] animate-pulse" />
                  </Link>
                  <span className="mt-0.5 text-[10px] font-bold text-[#04c9db] tracking-wider">AI 测算</span>
                </div>

                {/* 4. 创业平台 */}
                <Link
                  href="/#business"
                  className={`flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 transition active:scale-95 ${
                    pathname.includes("business") ? "text-[#E8D4A8]" : "text-white/55 active:text-white"
                  }`}
                >
                  <BusinessIcon className={`size-5 ${pathname.includes("business") ? "text-[#C79A54]" : ""}`} />
                  <span className="text-[10px] font-medium">创业平台</span>
                </Link>

                {/* 5. 登录 / 登出 */}
                {isLoggedIn ? (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-white/55 transition active:scale-95 active:text-[#E8D4A8]"
                  >
                    <LogOut className="size-5 text-[#C79A54]" />
                    <span className="text-[10px] font-medium">登出</span>
                  </button>
                ) : (
                  <Link
                    href="/auth"
                    className={`flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 transition active:scale-95 ${
                      pathname === "/auth" ? "text-[#E8D4A8]" : "text-white/55 active:text-white"
                    }`}
                  >
                    <AuthIcon className={`size-5 ${pathname === "/auth" ? "text-[#C79A54]" : ""}`} />
                    <span className="text-[10px] font-medium">登录</span>
                  </Link>
                )}
              </>
            );
          })()}
        </div>
      </div>
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
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C79A54] sm:text-sm">{eyebrow}</p>
      <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-white md:text-5xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-white/65 md:text-lg">{desc}</p>
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
    <div className="glass-panel p-5 transition hover:border-[#C79A54]/40">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-white/50">{label}</p>
          <p className="mt-2 text-2xl font-bold gold-gradient-text">{value}</p>
        </div>
        <span className="grid size-11 place-items-center rounded-xl border border-[#C79A54]/30 bg-[#C79A54]/10 text-[#C79A54]">
          <Icon className="size-5" />
        </span>
      </div>
      {change ? <p className="mt-4 text-xs font-medium text-[#E8D4A8]">{change}</p> : null}
    </div>
  );
}

export function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C79A54]/30 bg-[#C79A54]/10 px-3 py-1 text-xs font-semibold text-[#E8D4A8]">
      <span className="size-1.5 rounded-full bg-[#C79A54] animate-pulse" />
      {children}
    </span>
  );
}

