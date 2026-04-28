"use client";

import { FormEvent, useEffect, useState } from "react";
import { Bot, Loader2, Send } from "lucide-react";

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

const initialMessages: Message[] = [
  {
    role: "user",
    content: "我下个月适合开新店吗？"
  },
  {
    role: "assistant",
    content:
      "从你的八字五行和当前时间趋势看，下个月适合先做选址与预算确认。若要做开业择日和奇门推演，可以消耗点数生成深度报告。"
  },
  {
    role: "system",
    content: "推荐下一步：生成开业择日报告，预计消耗 260 点，可附带产品与课程建议。"
  }
];

const loadingSteps = ["读取八字资料", "判断今日趋势", "整理行动建议"];
const quickPrompts = [
  "我今天适合谈合作吗？",
  "我适合这个月换工作吗？",
  "最近财运要注意什么？",
  "这个人适合我吗？"
];

export function FengshuiChat() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

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
          memberLevel: "Plus",
          points: 2680,
          profile: {
            birthDate: "1990-08-18",
            birthTime: "09:30",
            gender: "女",
            region: "Kuala Lumpur"
          }
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
        </div>
        <Bot className="size-8 text-cinnabar" />
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-soft">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => setInput(prompt)}
            className="shrink-0 rounded border border-black/10 bg-cloud px-3 py-2 text-xs font-medium text-ink/68 transition hover:border-cinnabar hover:text-cinnabar"
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
                  ? "ml-auto max-w-[88%] rounded bg-ink p-4 text-white"
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
          <div className="ml-auto max-w-[88%] rounded bg-ink p-4 text-sm text-white">
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

      <form onSubmit={handleSubmit} className="mt-5 flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          className="min-w-0 flex-1 rounded border border-black/10 bg-rice px-4 py-3 text-sm outline-none focus:border-cinnabar"
          placeholder="输入你的问题，例如：我适合换工作吗？"
        />
        <button
          className="grid size-11 shrink-0 place-items-center rounded bg-ink text-white disabled:cursor-not-allowed disabled:opacity-55"
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
