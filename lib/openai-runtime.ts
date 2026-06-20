import type OpenAI from "openai";

type ResponseReasoningOptions = {
  reasoning?: {
    effort: "minimal" | "low" | "medium" | "high";
  };
};

type OpenAITextResponse = {
  output_text?: string;
};

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const DEFAULT_OPENAI_FALLBACK_MODEL = "gpt-5";

export function getOpenAIModel() {
  return (process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL).trim();
}

export function getOpenAIFallbackModel(primaryModel = getOpenAIModel()) {
  const fallback = (process.env.OPENAI_FALLBACK_MODEL || DEFAULT_OPENAI_FALLBACK_MODEL).trim();

  if (!fallback || fallback === primaryModel) {
    return DEFAULT_OPENAI_MODEL;
  }

  return fallback;
}

export function getResponseReasoningOptions(model: string): ResponseReasoningOptions {
  const normalized = model.toLowerCase();

  if (normalized === "gpt-5" || normalized.startsWith("gpt-5") || normalized.startsWith("o")) {
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

function shouldRetryWithFallback(error: unknown) {
  const message = getOpenAIErrorMessage(error).toLowerCase();

  return (
    message.includes("model") ||
    message.includes("unsupported") ||
    message.includes("invalid") ||
    message.includes("not found") ||
    message.includes("does not exist")
  );
}

export async function createOpenAIResponseWithFallback(
  client: OpenAI,
  params: Parameters<OpenAI["responses"]["create"]>[0]
) {
  const primaryModel = String(params.model || getOpenAIModel());

  try {
    return {
      response: (await client.responses.create(params)) as OpenAITextResponse,
      model: primaryModel,
      fallbackUsed: false
    };
  } catch (error) {
    if (!shouldRetryWithFallback(error)) {
      throw error;
    }

    const fallbackModel = getOpenAIFallbackModel(primaryModel);
    const { reasoning: _reasoning, ...baseParams } = params as Record<string, unknown>;
    const fallbackParams = {
      ...baseParams,
      model: fallbackModel,
      ...getResponseReasoningOptions(fallbackModel)
    } as Parameters<OpenAI["responses"]["create"]>[0];

    return {
      response: (await client.responses.create(fallbackParams)) as OpenAITextResponse,
      model: fallbackModel,
      fallbackUsed: true
    };
  }
}
