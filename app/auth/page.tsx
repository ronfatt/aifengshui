"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { BadgeCheck, CalendarDays, Compass, Loader2, LogIn, Sparkles, SunMedium } from "lucide-react";
import { AppShell } from "@/components/shell";
import { demoMemberProfile } from "@/lib/member-profile";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function AuthPage() {
  const router = useRouter();
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

        setMessage("登录成功，正在进入会员中心。");
        router.push("/dashboard");
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

      setMessage("注册成功，会员基础资料已保存，正在进入会员中心。");
      router.push("/dashboard");
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
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#D4AF37]">PUBLIC ALMANAC</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight">大众每日通胜</h1>
            <p className="mt-5 text-sm leading-7 text-white/65">
              这是公开版今日参考，结合通胜宜忌、五行节气与方位能量，提供大众可用的吉时、吉方与行动提醒。
            </p>

            <div className="mt-8 rounded-3xl border border-[#D4AF37]/25 bg-white/8 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">大众今日总览</p>
                  <p className="mt-2 text-2xl font-semibold">稳中有进，宜先定后动</p>
                </div>
                <span className="grid size-14 place-items-center rounded-2xl bg-[#D4AF37]/15 text-[#D4AF37]">
                  <SunMedium className="size-7" />
                </span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  { label: "吉时", value: "辰时 7-9｜申时 15-17", icon: CalendarDays },
                  { label: "吉方", value: "东南纳财｜西北利贵人", icon: Compass },
                  { label: "今日宜", value: "签约、整理账目、拜访客户", icon: BadgeCheck },
                  { label: "今日忌", value: "冲动投资、口舌争辩、夜间决策", icon: Sparkles }
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/8 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#D4AF37]">
                      <Icon className="size-4" />
                      {label}
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-6 text-white/86">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="rounded border border-[#D4AF37]/25 bg-[#D4AF37]/10 p-3 text-sm font-semibold leading-6 text-[#F8E7A7]">
                登录后可生成个人专属运程：会结合生日、出生时辰、性别与会员命理档案。
              </div>
              {[
                "事业：先复盘资源，再推进新合作。",
                "财运：偏财勿急，正财适合稳步跟进。",
                "感情：少判断，多倾听，关系更容易回温。"
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 rounded border border-white/10 bg-white/8 p-3 text-sm leading-6 text-white/78">
                  <BadgeCheck className="mt-0.5 size-4 shrink-0 text-[#D4AF37]" />
                  {item}
                </div>
              ))}
            </div>
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
