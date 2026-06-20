type ResponseReasoningOptions = {
  reasoning?: {
    effort: "minimal" | "low" | "medium" | "high";
  };
};

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

export function getOpenAIModel() {
  return process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;
}

export function getResponseReasoningOptions(model: string): ResponseReasoningOptions {
  const normalized = model.toLowerCase();

  if (normalized === "gpt-5" || normalized.startsWith("gpt-5-") || normalized.startsWith("o")) {
    return {
      reasoning: {
        effort: "minimal"
      }
    };
  }

  return {};
}

export function getOpenAIErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  return "OpenAI request failed";
}
