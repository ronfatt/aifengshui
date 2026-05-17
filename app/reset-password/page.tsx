"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";
import { AppShell } from "@/components/shell";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("正在验证重设密码链接...");
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      setMessage("会员系统暂时维护中，请稍后再试。");
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setIsReady(true);
        setMessage("链接已验证，请输入新密码。");
      } else {
        setMessage("重设链接无效或已过期，请回到登录页重新发送。");
      }
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setIsReady(true);
        setMessage("链接已验证，请输入新密码。");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (password.length < 6) {
      setMessage("新密码至少需要 6 位。");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("两次输入的新密码不一致。");
      return;
    }

    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      setMessage("会员系统暂时维护中，请稍后再试。");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      setMessage("密码已更新，正在进入会员中心。");
      router.push("/dashboard");
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : "";
      setMessage(rawMessage || "密码更新失败，请重新发送重设链接。");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AppShell>
      <main className="bg-[#DDEFF2] px-5 py-14">
        <section className="mx-auto max-w-xl rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
          <div className="grid size-14 place-items-center rounded-2xl bg-[#DDEFF2] text-[#063F4A]">
            <KeyRound className="size-7" />
          </div>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-[#C79A54]">RESET PASSWORD</p>
          <h1 className="mt-3 text-3xl font-semibold text-[#063F4A]">设置新密码</h1>
          <p className="mt-3 text-sm leading-6 text-ink/60">请输入新的会员密码。更新成功后，系统会自动进入会员中心。</p>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold">
              新密码
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded border border-black/10 bg-rice px-4 py-3 font-normal outline-none focus:border-[#063F4A]"
                minLength={6}
                required
                disabled={!isReady}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              确认新密码
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="rounded border border-black/10 bg-rice px-4 py-3 font-normal outline-none focus:border-[#063F4A]"
                minLength={6}
                required
                disabled={!isReady}
              />
            </label>

            {message ? <p className="rounded bg-[#F5FAFA] p-3 text-sm leading-6 text-ink/65">{message}</p> : null}

            <button
              type="submit"
              disabled={!isReady || isLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded bg-[#1495A0] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0F7F88] disabled:opacity-60"
            >
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
              更新密码
            </button>
          </form>

          <Link href="/auth" className="mt-4 inline-flex text-sm font-semibold text-[#063F4A] hover:text-[#1495A0]">
            回到登录页
          </Link>
        </section>
      </main>
    </AppShell>
  );
}
