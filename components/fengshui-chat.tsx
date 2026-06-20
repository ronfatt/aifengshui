"use client";

import { FormEvent, useEffect, useState } from "react";
import { BookOpenCheck, Bot, CheckCircle2, FileText, Loader2, Send, ShieldCheck, ShoppingBag, Sparkles, UserRound } from "lucide-react";
import { emptyMemberProfile, type MemberProfile } from "@/lib/member-profile";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { MembershipTier } from "@/lib/types";

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

type OpenAIStatus = {
  configured: boolean;
  model: string;
  provider: string;
};

type ChatNextActionTarget = "report" | "shop" | "courses";
type InquiryTopic = "事业" | "财运" | "感情" | "合作" | "开业搬迁" | "健康";

type FengshuiChatProps = {
  tier?: MembershipTier;
  tierName?: string;
  aiMode?: string;
  initialPrompt?: string;
  profile?: MemberProfile;
  points?: number;
  onNextAction?: (target: ChatNextActionTarget) => void;
  onSpendPoints?: (amount: number, source?: string, description?: string) => boolean;
  onRefundPoints?: (amount: number, source?: string, description?: string) => void;
};

const initialMessages: Message[] = [
  {
    role: "assistant",
    content:
      "你好，我是 AI 风水命理师。你可以先选择问题类型，再直接问一个具体问题。系统会先判断问题性质，再拆现状、隐患、趋势、行动时机与化解建议。"
  }
];

const loadingSteps = ["读取命理资料", "拆解问题结构", "整理大师建议"];
const inquiryTopics: InquiryTopic[] = ["事业", "财运", "感情", "合作", "开业搬迁", "健康"];
const quickPrompts = [
  "我最近事业适合变动吗？",
  "今天适合谈合作吗？",
  "最近财运哪里要注意？",
  "感情关系该怎么处理？",
  "我现在适合创业吗？",
  "这个月适合签约收款吗？"
];

const topicFollowUps: Record<InquiryTopic, string[]> = {
  事业: ["那我现在应该先稳定还是主动变动？", "未来 30 天事业上最该避开什么？", "帮我整理成一份事业行动清单。"],
  财运: ["我最近现金流哪里最容易出问题？", "适合主动谈钱、收款或投资吗？", "帮我看一个更适合的守财行动。"],
  感情: ["这段关系现在最需要调整什么？", "我应该主动沟通还是先观察？", "帮我整理一段适合沟通的话。"],
  合作: ["这个合作最需要先谈清楚什么？", "对方是否适合长期合作？", "帮我列出签约前检查清单。"],
  开业搬迁: ["什么时候比较适合启动下一步？", "方位、颜色和布局有什么建议？", "帮我整理开业前 7 天准备清单。"],
  健康: ["我最近应该先调整哪一种生活习惯？", "情绪和睡眠上有什么提醒？", "帮我做一个 7 天稳定作息建议。"]
};

const nextStepActions = [
  {
    title: "生成深度报告",
    desc: "把这次分析保存成完整报告",
    icon: FileText,
    target: "report" as const,
    prompt: "请根据刚才的问题，用紫微十二宫、四化触发、梅花易数体用生克和评分权重，帮我整理成一份完整深度报告的大纲。"
  },
  {
    title: "推荐开运方案",
    desc: "查看适合的产品与布局建议",
    icon: ShoppingBag,
    target: "shop" as const,
    prompt: "请根据我的财帛宫、官禄宫、今日四化状态和梅花易数象意，推荐适合的开运产品、摆放方向和使用场景。"
  },
  {
    title: "学习相关课程",
    desc: "把建议变成可学习的方法",
    icon: BookOpenCheck,
    target: "courses" as const,
    prompt: "我想学习如何用紫微斗数、飞星四化和梅花易数判断类似问题，应该从哪类课程开始？"
  }
];

const mobileFollowUpChips = [
  "再具体一点",
  "给我行动清单",
  "哪里风险最大？",
  "适合什么时候做？"
];

const tierModeCopy: Record<MembershipTier, { title: string; desc: string; budget: string }> = {
  free: {
    title: "基础命理问答",
    desc: "适合快速确认方向，输出简短提醒与行动建议。",
    budget: "基础分析"
  },
  tactical: {
    title: "进阶命理指导",
    desc: "适合每日/每周行动判断，重点拆解问题、时机、风险与执行方法。",
    budget: "紫微趋势 + 梅花即时象意"
  },
  strategic: {
    title: "高阶战略顾问",
    desc: "适合创业、投资、合作和重大决策，会输出更完整的风险分层与行动路线。",
    budget: "双引擎 + 流月流年 + 商业五行策略"
  }
};

const depthModes: Record<MembershipTier, { label: string; detail: string }> = {
  free: {
    label: "快速判断",
    detail: "方向 + 风险 + 3 个行动"
  },
  tactical: {
    label: "深度拆解",
    detail: "现状 + 隐患 + 趋势 + 通关"
  },
  strategic: {
    label: "高阶策略",
    detail: "周期 + 风险分层 + 决策路线"
  }
};

export function FengshuiChat({
  tier = "tactical",
  tierName = "进阶会员版",
  aiMode = "战术行动指南",
  initialPrompt = "",
  profile = emptyMemberProfile,
  points = 0,
  onNextAction,
  onSpendPoints,
  onRefundPoints
}: FengshuiChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [openAIStatus, setOpenAIStatus] = useState<OpenAIStatus | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<InquiryTopic>("事业");
  const tierCopy = tierModeCopy[tier];
  const depthMode = depthModes[tier];
  const isFree = tier === "free";
  const chatCost = tier === "strategic" ? 8 : tier === "tactical" ? 5 : 1;
  const displayName = profile.name && profile.name !== "未填写" ? profile.name : "会员";
  const displayBirthDate = profile.birthDate && profile.birthDate !== "2000-01-01" ? profile.birthDate : "未填写";
  const displayBirthTime = profile.birthTimeLabel && profile.birthTimeLabel !== "未填写" ? profile.birthTimeLabel : profile.birthTime || "未填写";
  const displayGender = profile.gender && profile.gender !== "未填写" ? profile.gender : "未填写";
  const hasRealAssistantReply = messages.some((message, index) => message.role === "assistant" && index > 0);
  const advisorChecks = tier === "strategic"
    ? ["命盘趋势", "梅花问事", "风险分层", "行动路线"]
    : tier === "tactical"
      ? ["命盘趋势", "梅花问事", "行动建议"]
      : ["今日方向", "基础建议"];

  useEffect(() => {
    if (initialPrompt) {
      setInput(initialPrompt);
    }
  }, [initialPrompt]);

  async function getMemberAccessToken() {
    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      return "";
    }

    const {
      data: { session }
    } = await supabase.auth.getSession();

    return session?.access_token || "";
  }

  useEffect(() => {
    if (!isLoading) {
      setLoadingStep(0);
      return;
    }

    const interval = window.setInterval(() => {
      setLoadingStep((current) => Math.min(current + 1, loadingSteps.length - 1));
    }, 1200);

    return () => window.clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    let mounted = true;

    async function loadStatus() {
      try {
        const response = await fetch("/api/fengshui-chat", {
          method: "GET",
          cache: "no-store"
        });
        const data = (await response.json()) as OpenAIStatus;

        if (mounted) {
          setOpenAIStatus(data);
        }
      } catch {
        if (mounted) {
          setOpenAIStatus({
            configured: false,
            model: "未连接",
            provider: "openai"
          });
        }
      }
    }

    loadStatus();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = input.trim();

    if (!message || isLoading) {
      return;
    }

    const accessToken = await getMemberAccessToken();

    if (!accessToken) {
      setMessages((current) => [...current, { role: "system", content: "登录状态已过期，请重新登录后再使用 AI 风水命理师。" }]);
      return;
    }

    if (onSpendPoints && !onSpendPoints(chatCost, "ai_chat", `AI 风水命理师聊天：${message.slice(0, 36)}`)) {
      setMessages((current) => [...current, { role: "system", content: `点数不足，本次 AI 问答需要 ${chatCost} 点。请先充值或邀请好友获得奖励点数。` }]);
      return;
    }

    setMessages((current) => [...current, { role: "user", content: message }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/fengshui-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          message: `问题类型：${selectedTopic}\n用户问题：${message}`,
          memberLevel: tierName,
          points: Math.max(0, points - chatCost),
          profile
        })
      });

      const raw = await response.text();
      let data: { answer?: string; error?: string } = {};

      try {
        data = raw ? (JSON.parse(raw) as { answer?: string; error?: string }) : {};
      } catch {
        data = {
          error: response.ok
            ? "AI 风水命理师返回格式异常，请稍后再试。"
            : `AI 服务请求失败（${response.status}），请稍后再试。`
        };
      }

      if (!response.ok) {
        throw new Error(data.error || "AI 风水命理师暂时无法回应。");
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.answer || "暂时无法生成回复，请稍后再试。" }
      ]);
    } catch (error) {
      onRefundPoints?.(chatCost, "ai_chat_refund", "AI 风水命理师回应失败自动退点");
      const message = error instanceof Error ? error.message : "AI 风水命理师暂时无法回应。";
      const friendlyMessage =
        message === "Load failed" || message.includes("Failed to fetch")
          ? "连接 AI 服务失败，请检查网络后重试。若持续出现，请管理员检查 Vercel 的 OPENAI_API_KEY、OPENAI_MODEL 与 Functions 日志。"
          : message;
      setMessages((current) => [...current, { role: "system", content: friendlyMessage }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="overflow-hidden rounded border border-[#DDEEF2] bg-white shadow-sm">
      <div className="border-b border-[#DDEEF2] bg-gradient-to-br from-[#F5FAFA] via-white to-[#E8D4A8]/20 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C79A54]">AI Feng Shui Master</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#063F4A]">AI 风水命理师</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/58">
              事业、财运、感情、合作与重大决策前，先做一次命理判断。系统会给你趋势、风险、时机和下一步行动。
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["命理趋势", "当下时机", "风险提醒", "行动建议"].map((item) => (
                <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#063F4A] shadow-sm">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded px-2.5 py-1 font-semibold ${openAIStatus?.configured ? "bg-[#DDEFF2] text-[#063F4A]" : "bg-[#E8D4A8] text-[#1495A0]"}`}>
              {openAIStatus?.configured ? "AI 已连接" : "AI 未连接"}
            </span>
            <span className="rounded bg-white px-2.5 py-1 text-ink/55">Model: {openAIStatus?.model || "检查中"}</span>
            <span className="rounded bg-[#C79A54]/15 px-2.5 py-1 font-semibold text-[#063F4A]">{tierName}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[340px_1fr]">
        <aside className="border-b border-[#DDEEF2] bg-[#F5FAFA] p-5 lg:border-b-0 lg:border-r">
          <div className={`rounded border p-4 ${tier === "strategic" ? "border-[#C79A54]/50 bg-[#063F4A] text-white" : "border-[#C79A54]/30 bg-white"}`}>
            <div className="flex items-center gap-3">
              <div className={`grid size-11 place-items-center rounded ${tier === "strategic" ? "bg-[#C79A54]/20 text-[#C79A54]" : "bg-[#DDEFF2] text-[#063F4A]"}`}>
                <Bot className="size-5" />
              </div>
              <div>
                <p className={`text-sm font-semibold ${tier === "strategic" ? "text-[#C79A54]" : "text-[#063F4A]"}`}>{tierCopy.title}</p>
                <p className={`mt-1 text-xs ${tier === "strategic" ? "text-white/58" : "text-ink/48"}`}>{aiMode}</p>
              </div>
            </div>
            <p className={`mt-4 text-sm leading-6 ${tier === "strategic" ? "text-white/72" : "text-ink/62"}`}>{tierCopy.desc}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {advisorChecks.map((item) => (
                <span key={item} className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold ${tier === "strategic" ? "bg-white/10 text-white" : "bg-[#F5FAFA] text-[#063F4A]"}`}>
                  <CheckCircle2 className="size-3" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded border border-black/10 bg-white p-4">
            <div className="flex items-center gap-2">
              <UserRound className="size-4 text-[#063F4A]" />
              <p className="text-sm font-semibold text-[#063F4A]">当前读取资料</p>
            </div>
            <div className="mt-3 space-y-2 text-sm text-ink/62">
              <p>姓名：<span className="font-semibold text-ink">{displayName}</span></p>
              <p>生日：<span className="font-semibold text-ink">{displayBirthDate}</span></p>
              <p>时辰：<span className="font-semibold text-ink">{displayBirthTime}</span></p>
              <p>性别：<span className="font-semibold text-ink">{displayGender}</span></p>
            </div>
          </div>

          <div className="mt-4 rounded border border-black/10 bg-white p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-[#C79A54]" />
              <p className="text-sm font-semibold text-[#063F4A]">本次咨询</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded bg-[#F5FAFA] p-3">
                <p className="text-xs text-ink/45">消耗点数</p>
                <p className="mt-1 font-semibold text-[#063F4A]">{chatCost} 点</p>
              </div>
              <div className="rounded bg-[#F5FAFA] p-3">
                <p className="text-xs text-ink/45">当前余额</p>
                <p className="mt-1 font-semibold text-[#063F4A]">{points.toLocaleString("en-US")} 点</p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-ink/45">{tierCopy.budget}</p>
            <div className="mt-3 rounded border border-[#DDEEF2] bg-[#F5FAFA] p-3">
              <p className="text-xs text-ink/45">回答深度</p>
              <p className="mt-1 text-sm font-semibold text-[#063F4A]">{depthMode.label}</p>
              <p className="mt-1 text-xs leading-5 text-ink/50">{depthMode.detail}</p>
            </div>
            {isFree ? (
              <p className="mt-3 rounded bg-[#E8D4A8]/25 p-3 text-xs leading-5 text-ink/55">
                Free 版只提供基础方向。开业、投资、合作、感情重大选择，建议升级后使用深度拆解。
              </p>
            ) : null}
          </div>
        </aside>

        <main className="p-5 pb-36 md:pb-5">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-[#C79A54]" />
                <p className="text-sm font-semibold text-[#063F4A]">先选择问题类型</p>
              </div>
              <p className="text-xs text-ink/45">当前：{selectedTopic} · {depthMode.label}</p>
            </div>
            <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1 scrollbar-soft md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0">
              {inquiryTopics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setSelectedTopic(topic)}
                  className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                    selectedTopic === topic
                      ? "border-[#063F4A] bg-[#063F4A] text-white"
                      : "border-[#DDEEF2] bg-white text-ink/60 hover:border-[#C79A54] hover:text-[#063F4A]"
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-2">
              <Sparkles className="size-4 text-[#C79A54]" />
              <p className="text-sm font-semibold text-[#063F4A]">不知道怎么问？从这里开始</p>
            </div>
            <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1 scrollbar-soft md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-3">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setInput(prompt)}
                  className="min-w-[220px] rounded-2xl border border-[#DDEEF2] bg-[#F5FAFA] px-3 py-2.5 text-left text-sm font-medium text-ink/70 transition active:scale-[0.98] hover:border-[#C79A54] hover:bg-white hover:text-[#063F4A] md:min-w-0 md:rounded"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-2 rounded border border-[#DDEEF2] bg-white p-3 sm:grid-cols-4">
            {[
              ["判断", "适合 / 谨慎 / 暂缓"],
              ["风险", "低 / 中 / 高"],
              ["时机", "今天 / 本周 / 本月"],
              ["行动", "先整理，再推进"]
            ].map(([label, value]) => (
              <div key={label} className="rounded bg-[#F5FAFA] p-3">
                <p className="text-xs font-semibold text-[#C79A54]">{label}</p>
                <p className="mt-1 text-sm font-semibold text-[#063F4A]">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 max-h-[520px] space-y-4 overflow-y-auto rounded border border-[#DDEEF2] bg-[#F5FAFA] p-4 scrollbar-soft">
            {messages.map((message, index) => {
              if (message.role === "system") {
                return (
                  <div key={`${message.role}-${index}`} className="rounded border border-[#C79A54]/35 bg-[#E8D4A8]/20 p-4">
                    <p className="whitespace-pre-wrap text-sm font-medium leading-6 text-ink">{message.content}</p>
                  </div>
                );
              }

              const isAssistant = message.role === "assistant";

              return (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={
                      isAssistant
                        ? "max-w-[92%] rounded border border-[#DDEEF2] bg-white p-4 shadow-sm"
                        : "max-w-[82%] rounded bg-[#063F4A] p-4 text-white"
                    }
                  >
                    <div className="mb-2 flex items-center gap-2">
                      {isAssistant ? <Bot className="size-4 text-[#C79A54]" /> : null}
                      <p className={isAssistant ? "text-xs font-semibold text-[#063F4A]" : "text-xs font-semibold text-white/70"}>
                        {isAssistant ? "AI 风水命理师" : "我的问题"}
                      </p>
                    </div>
                    <p className={isAssistant ? "whitespace-pre-wrap text-sm leading-7 text-ink/78" : "whitespace-pre-wrap text-sm leading-6"}>
                      {message.content}
                    </p>
                  </div>
                </div>
              );
            })}
            {isLoading ? (
              <div className="max-w-[92%] rounded border border-[#DDEEF2] bg-white p-4 text-sm shadow-sm">
                <div className="flex items-center gap-2 font-semibold text-[#063F4A]">
                  <Loader2 className="size-4 animate-spin text-[#C79A54]" />
                  {loadingSteps[loadingStep]}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-1">
                  {loadingSteps.map((step, index) => (
                    <span
                      key={step}
                      className={`h-1 rounded-full ${index <= loadingStep ? "bg-[#C79A54]" : "bg-[#DDEEF2]"}`}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {hasRealAssistantReply ? (
            <div className="mt-4 rounded border border-[#C79A54]/30 bg-[#FFF9EC] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[#063F4A]">AI 回答后的下一步</p>
                <span className="rounded bg-white px-2.5 py-1 text-xs font-semibold text-ink/45">继续追问 / 生成报告 / 转成方案</span>
              </div>
              <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-soft md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0">
                {topicFollowUps[selectedTopic].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setInput(prompt)}
                    className="min-w-[210px] rounded-2xl border border-[#DDEEF2] bg-white px-3 py-2.5 text-left text-sm font-medium text-ink/70 transition active:scale-[0.98] hover:border-[#C79A54] hover:text-[#063F4A] md:min-w-0 md:rounded"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {nextStepActions.map((action) => {
                  const Icon = action.icon;

                  return (
                    <button
                      key={action.title}
                      type="button"
                      onClick={() => {
                        setInput(action.prompt);
                        onNextAction?.(action.target);
                      }}
                      className="rounded border border-black/10 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-[#C79A54]/60 hover:shadow-sm"
                    >
                      <Icon className="size-4 text-[#063F4A]" />
                      <p className="mt-2 text-sm font-semibold">{action.title}</p>
                      <p className="mt-1 text-xs leading-5 text-ink/55">{action.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {hasRealAssistantReply ? (
            <div className="fixed inset-x-3 bottom-40 z-40 flex gap-2 overflow-x-auto rounded-full border border-[#CFE2E5] bg-white/92 p-2 shadow-[0_14px_42px_rgba(6,63,74,0.18)] backdrop-blur-xl scrollbar-soft md:hidden">
              {mobileFollowUpChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setInput(chip)}
                  className="shrink-0 rounded-full bg-[#F5FAFA] px-3 py-2 text-xs font-semibold text-[#063F4A] active:scale-[0.98]"
                >
                  {chip}
                </button>
              ))}
            </div>
          ) : null}

          <form
            onSubmit={handleSubmit}
            className="fixed inset-x-3 bottom-24 z-40 rounded-[1.35rem] border-2 border-[#C79A54]/65 bg-[#F8F1DF] p-2 shadow-[0_18px_55px_rgba(6,63,74,0.22)] backdrop-blur-xl md:static md:mt-5 md:rounded-xl md:border-[#C79A54]/55 md:bg-[#F8F1DF] md:p-4 md:shadow-[0_18px_45px_rgba(6,63,74,0.12)]"
          >
            <div className="mb-2 hidden items-center justify-between gap-3 md:flex">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C79A54]">Ask AI Master</p>
                <p className="text-sm font-semibold text-[#063F4A]">在这里输入你的问题，AI 风水命理师会直接分析</p>
              </div>
              <span className="rounded-full border border-[#C79A54]/35 bg-white px-3 py-1 text-xs font-semibold text-ink/60">Enter 发送</span>
            </div>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                className="min-w-0 flex-1 rounded-2xl border-2 border-[#063F4A]/35 bg-white px-4 py-3 text-sm font-medium text-[#063F4A] shadow-inner outline-none placeholder:text-ink/40 focus:border-[#1495A0] focus:ring-4 focus:ring-[#1495A0]/12 md:rounded-lg md:py-4 md:text-base"
                placeholder={isFree ? "直接输入：今天适合谈合作吗？" : "直接输入你的问题，例如：我适合换工作吗？"}
              />
              <button
                className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#063F4A] text-white shadow-[0_10px_24px_rgba(6,63,74,0.28)] transition hover:bg-[#1495A0] disabled:cursor-not-allowed disabled:opacity-55 md:h-auto md:w-16 md:rounded-lg"
                type="submit"
                aria-label="发送"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
