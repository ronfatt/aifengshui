"use client";

import { FormEvent, useEffect, useState } from "react";
import { BookOpenCheck, Bot, FileText, Loader2, Send, ShoppingBag, Sparkles } from "lucide-react";
import { demoMemberProfile, type MemberProfile } from "@/lib/member-profile";

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

type OpenAIStatus = {
  configured: boolean;
  model: string;
  provider: string;
};

type ChatTier = "free" | "tactical" | "strategic";

type FengshuiChatProps = {
  tier?: ChatTier;
  tierName?: string;
  aiMode?: string;
  profile?: MemberProfile;
};

const initialMessages: Message[] = [
  {
    role: "user",
    content: "我下个月适合开新店吗？"
  },
  {
    role: "assistant",
    content:
      "从紫微斗数看，下个月适合先做选址与预算确认；若以梅花易数看当下一问，重点在“先定体用、再看变动”，不宜仓促签长期合约。若要做完整开业择日，可消耗点数生成深度报告。"
  },
  {
    role: "system",
    content: "推荐下一步：生成开业择日报告，预计消耗 260 点，可附带产品与课程建议。"
  }
];

const loadingSteps = ["读取八字资料", "判断今日趋势", "整理行动建议"];
const quickPrompts = [
  "用紫微矩阵看我今天适合谈合作吗？",
  "用梅花易数看我现在该不该主动联系客户？",
  "结合紫微和梅花看这笔合作能不能推进？",
  "从四化看我这个月适合换工作吗？",
  "我的财帛宫今天有什么风险？",
  "今天适合签约或收款吗？"
];

const nextStepActions = [
  {
    title: "生成深度报告",
    desc: "把这次分析保存成完整报告",
    icon: FileText,
    prompt: "请根据刚才的问题，用紫微十二宫、四化触发、梅花易数体用生克和评分权重，帮我整理成一份完整深度报告的大纲。"
  },
  {
    title: "推荐开运方案",
    desc: "查看适合的产品与布局建议",
    icon: ShoppingBag,
    prompt: "请根据我的财帛宫、官禄宫、今日四化状态和梅花易数象意，推荐适合的开运产品、摆放方向和使用场景。"
  },
  {
    title: "学习相关课程",
    desc: "把建议变成可学习的方法",
    icon: BookOpenCheck,
    prompt: "我想学习如何用紫微斗数、飞星四化和梅花易数判断类似问题，应该从哪类课程开始？"
  }
];

const tierModeCopy: Record<ChatTier, { title: string; desc: string; budget: string }> = {
  free: {
    title: "Free 基础问答",
    desc: "适合快速确认方向。系统会优先输出星级、宜忌和一句话提醒，深度分析需要升级。",
    budget: "低算力 · 静态短句库 + 简短 AI 辅助"
  },
  tactical: {
    title: "RM39.90 紫微 + 梅花战术指导",
    desc: "适合每日/每周行动判断。紫微看宫位与周期，梅花看当下一问一事的体用、生克和变化。",
    budget: "中算力 · 紫微矩阵 + 梅花象意 + OpenAI 标准解析"
  },
  strategic: {
    title: "RM69.90 紫微 + 梅花战略顾问",
    desc: "适合创业、投资、合作和重大决策。AI 会用紫微看格局周期，用梅花看当前决策的变动方向。",
    budget: "高算力 · 紫微/梅花双引擎 + 流月流年 + 商业五行策略"
  }
};

export function FengshuiChat({
  tier = "tactical",
  tierName = "进阶会员版",
  aiMode = "战术行动指南",
  profile = demoMemberProfile
}: FengshuiChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [openAIStatus, setOpenAIStatus] = useState<OpenAIStatus | null>(null);
  const tierCopy = tierModeCopy[tier];
  const isFree = tier === "free";

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

    setMessages((current) => [...current, { role: "user", content: message }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/fengshui-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message,
          memberLevel: tierName,
          points: 2680,
          profile
        })
      });

      const data = (await response.json()) as { answer?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "AI 风水师暂时无法回应。");
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.answer || "暂时无法生成回复，请稍后再试。" }
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI 风水师暂时无法回应。";
      setMessages((current) => [...current, { role: "system", content: message }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded border border-black/10 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-ink/55">AI 风水师聊天</p>
          <h2 className="mt-1 text-2xl font-semibold">决策前先问 AI</h2>
          <p className="mt-1 text-sm text-ink/55">
            当前读取：{profile.name} · {profile.birthDate} · {profile.birthTimeLabel} · {profile.gender}
          </p>
          <p className="mt-1 text-sm text-ink/55">已植入紫微矩阵、飞星四化、梅花易数体用生克与评分权重逻辑。</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`rounded px-2 py-1 font-semibold ${
                openAIStatus?.configured ? "bg-[#DDEFF2] text-[#063F4A]" : "bg-[#E8D4A8] text-[#1495A0]"
              }`}
            >
              {openAIStatus?.configured ? "OpenAI 已连接" : "OpenAI 未连接"}
            </span>
            <span className="rounded bg-[#F5FAFA] px-2 py-1 text-ink/55">
              Model: {openAIStatus?.model || "检查中"}
            </span>
            <span className="rounded bg-[#C79A54]/15 px-2 py-1 font-semibold text-[#063F4A]">
              {tierName}
            </span>
          </div>
        </div>
        <Bot className="size-8 text-[#063F4A]" />
      </div>

      <div className={`mt-4 rounded border p-4 ${tier === "strategic" ? "border-[#C79A54]/45 bg-[#063F4A] text-white" : "border-[#C79A54]/35 bg-[#C79A54]/10"}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className={`text-sm font-semibold ${tier === "strategic" ? "text-[#C79A54]" : "text-[#063F4A]"}`}>{tierCopy.title}</p>
            <p className={`mt-2 text-sm leading-6 ${tier === "strategic" ? "text-white/70" : "text-ink/62"}`}>{tierCopy.desc}</p>
          </div>
          <span className={`rounded px-2.5 py-1 text-xs font-semibold ${tier === "strategic" ? "bg-[#C79A54] text-[#063F4A]" : "bg-white text-[#063F4A]"}`}>
            {aiMode}
          </span>
        </div>
        <p className={`mt-3 text-xs ${tier === "strategic" ? "text-white/48" : "text-ink/48"}`}>{tierCopy.budget}</p>
        {isFree ? (
          <p className="mt-3 rounded bg-white p-3 text-xs leading-5 text-ink/55">
            Free 版会限制深度推演，不展开梅花卦象。若问题涉及开业、投资、合作、感情重大选择，建议升级到进阶或高阶版本启用紫微 + 梅花双引擎。
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-soft">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => setInput(prompt)}
            className="shrink-0 rounded border border-black/10 bg-cloud px-3 py-2 text-xs font-medium text-ink/68 transition hover:border-[#C79A54] hover:text-[#063F4A]"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="mt-5 max-h-[430px] space-y-3 overflow-y-auto pr-1 scrollbar-soft">
        {messages.map((message, index) => {
          if (message.role === "system") {
            return (
              <div key={`${message.role}-${index}`} className="rounded border border-gold/40 bg-gold/10 p-4">
                <p className="whitespace-pre-wrap text-sm font-medium leading-6 text-ink">{message.content}</p>
              </div>
            );
          }

          const isAssistant = message.role === "assistant";

          return (
            <div
              key={`${message.role}-${index}`}
              className={
                isAssistant
                  ? "ml-auto max-w-[88%] rounded bg-[#063F4A] p-4 text-white"
                  : "max-w-[82%] rounded border border-black/10 bg-cloud p-4"
              }
            >
              <p className={isAssistant ? "whitespace-pre-wrap text-sm leading-6" : "text-sm text-ink/70"}>
                {message.content}
              </p>
            </div>
          );
        })}
        {isLoading ? (
          <div className="ml-auto max-w-[88%] rounded bg-[#063F4A] p-4 text-sm text-white">
            <div className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              {loadingSteps[loadingStep]}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1">
              {loadingSteps.map((step, index) => (
                <span
                  key={step}
                  className={`h-1 rounded-full ${index <= loadingStep ? "bg-white" : "bg-white/25"}`}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-5 rounded border border-[#C79A54]/35 bg-[#C79A54]/10 p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-[#C79A54]" />
          <p className="text-sm font-semibold text-[#063F4A]">AI 回答后的下一步</p>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {nextStepActions.map((action) => {
            const Icon = action.icon;

            return (
              <button
                key={action.title}
                type="button"
                onClick={() => setInput(action.prompt)}
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

      <form onSubmit={handleSubmit} className="mt-5 flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          className="min-w-0 flex-1 rounded border border-black/10 bg-rice px-4 py-3 text-sm outline-none focus:border-[#063F4A]"
          placeholder={isFree ? "Free 模式：问一个简短问题，例如今天适合谈合作吗？" : "输入你的问题，例如：我适合换工作吗？"}
        />
        <button
          className="grid size-11 shrink-0 place-items-center rounded bg-[#063F4A] text-white disabled:cursor-not-allowed disabled:opacity-55"
          type="submit"
          aria-label="发送"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </button>
      </form>
    </div>
  );
}
