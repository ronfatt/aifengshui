"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, BadgeCheck, Loader2, LogIn } from "lucide-react";
import { AppShell } from "@/components/shell";
import { demoMemberProfile } from "@/lib/member-profile";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState(demoMemberProfile.email);
  const [password, setPassword] = useState("testing12345");
  const [name, setName] = useState(demoMemberProfile.name);
  const [birthDate, setBirthDate] = useState(demoMemberProfile.birthDate);
  const [birthTime, setBirthTime] = useState(demoMemberProfile.birthTime);
  const [gender, setGender] = useState(demoMemberProfile.gender);
  const [phone, setPhone] = useState(demoMemberProfile.phone);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      setMessage("Supabase 尚未配置。请在部署平台加入 NEXT_PUBLIC_SUPABASE_URL 与 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY，或 NEXT_PUBLIC_SUPABASE_ANON_KEY，然后重新部署。");
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          throw error;
        }

        setMessage("登录成功，可以进入会员中心。");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name
          }
        }
      });

      if (error) {
        throw error;
      }

      const userId = data.user?.id;

      if (userId) {
        const profileResponse = await fetch("/api/auth/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            userId,
            name,
            birthDate,
            birthTime,
            gender,
            email,
            phone,
            region: demoMemberProfile.region
          })
        });
        const profileData = (await profileResponse.json()) as { error?: string };

        if (!profileResponse.ok) {
          throw new Error(profileData.error || "会员资料保存失败。");
        }
      }

      setMessage("注册成功，会员基础资料已保存。若 Supabase 开启邮箱验证，请先验证邮箱。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "操作失败，请稍后再试。");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AppShell>
      <main className="bg-[#ECFDF5] px-5 py-12">
        <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] bg-[#102019] p-8 text-white shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#D4AF37]">Supabase Auth</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight">会员注册必须先建立命理档案</h1>
            <p className="mt-5 text-sm leading-7 text-white/65">
              姓名、生日、出生时辰、性别与 Email 会成为 AI 风水师、每日运势和报告中心的基础分析资料。
            </p>
            <div className="mt-8 grid gap-3">
              {["Auth 登录状态", "profiles 会员资料表", "后续点数扣减与报告保存"].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded border border-white/10 bg-white/8 p-3 text-sm">
                  <BadgeCheck className="size-4 text-[#D4AF37]" />
                  {item}
                </div>
              ))}
            </div>
            <Link href="/dashboard" className="mt-8 inline-flex items-center gap-2 rounded bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-[#062F25]">
              先看会员中心 <ArrowRight className="size-4" />
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
            <div className="flex rounded-full bg-[#F7F7F7] p-1">
              {[
                ["register", "注册"],
                ["login", "登录"]
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value as "login" | "register")}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${mode === value ? "bg-[#064E3B] text-white" : "text-ink/58"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {!isSupabaseConfigured ? (
              <div className="mt-5 rounded border border-[#D4AF37]/40 bg-[#D4AF37]/10 p-4 text-sm leading-6 text-ink/70">
                Supabase 线上环境变量还没填。请在部署平台加入 NEXT_PUBLIC_SUPABASE_URL 与 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY，然后重新部署。
              </div>
            ) : null}

            <div className="mt-6 grid gap-4">
              {mode === "register" ? (
                <>
                  <label className="grid gap-2 text-sm font-semibold">
                    名字
                    <input value={name} onChange={(event) => setName(event.target.value)} className="rounded border border-black/10 bg-rice px-4 py-3 font-normal outline-none focus:border-[#064E3B]" required />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2 text-sm font-semibold">
                      生日日期
                      <input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} className="rounded border border-black/10 bg-rice px-4 py-3 font-normal outline-none focus:border-[#064E3B]" required />
                    </label>
                    <label className="grid gap-2 text-sm font-semibold">
                      出生时辰
                      <input type="time" value={birthTime} onChange={(event) => setBirthTime(event.target.value)} className="rounded border border-black/10 bg-rice px-4 py-3 font-normal outline-none focus:border-[#064E3B]" />
                    </label>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2 text-sm font-semibold">
                      性别
                      <select value={gender} onChange={(event) => setGender(event.target.value)} className="rounded border border-black/10 bg-rice px-4 py-3 font-normal outline-none focus:border-[#064E3B]" required>
                        <option>男</option>
                        <option>女</option>
                        <option>其他</option>
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm font-semibold">
                      手机号（选填）
                      <input value={phone} onChange={(event) => setPhone(event.target.value)} className="rounded border border-black/10 bg-rice px-4 py-3 font-normal outline-none focus:border-[#064E3B]" />
                    </label>
                  </div>
                </>
              ) : null}

              <label className="grid gap-2 text-sm font-semibold">
                Email
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded border border-black/10 bg-rice px-4 py-3 font-normal outline-none focus:border-[#064E3B]" required />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                密码
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="rounded border border-black/10 bg-rice px-4 py-3 font-normal outline-none focus:border-[#064E3B]" required minLength={8} />
              </label>
            </div>

            {message ? <p className="mt-5 rounded bg-[#F7F7F7] p-3 text-sm leading-6 text-ink/65">{message}</p> : null}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded bg-[#B91C1C] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#991B1B] disabled:opacity-60"
            >
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
              {mode === "register" ? "注册并保存资料" : "登录"}
            </button>
          </form>
        </section>
      </main>
    </AppShell>
  );
}
