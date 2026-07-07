import type OpenAI from "openai";

type ResponseReasoningOptions = {
  reasoning?: {
    effort: "none" | "low" | "medium" | "high" | "xhigh";
  };
};

type OpenAITextResponse = {
  output_text?: string;
};

const DEFAULT_OPENAI_MODEL = "gpt-5.5-2026-04-23";
const DEFAULT_OPENAI_FALLBACK_MODEL = "gpt-5.5";
const OPENAI_MIN_OUTPUT_TOKENS = 16;
const BUILT_IN_FALLBACK_MODELS = ["gpt-5.5", "gpt-5", "gpt-4.1", "gpt-4o-mini"];

export function getOpenAIModel() {
  return (process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL).trim();
}

export function getOpenAIFallbackModel(primaryModel = getOpenAIModel()) {
  return getOpenAIFallbackCandidates(primaryModel)[0] || DEFAULT_OPENAI_FALLBACK_MODEL;
}

export function getOpenAIFallbackCandidates(primaryModel = getOpenAIModel()) {
  return [
    process.env.OPENAI_FALLBACK_MODEL,
    DEFAULT_OPENAI_FALLBACK_MODEL,
    ...BUILT_IN_FALLBACK_MODELS
  ]
    .map((model) => model?.trim())
    .filter((model): model is string => Boolean(model))
    .filter((model, index, models) => model !== primaryModel && models.indexOf(model) === index);
}

export function getResponseReasoningOptions(model: string): ResponseReasoningOptions {
  const normalized = model.toLowerCase();

  if (normalized === "gpt-5" || normalized.startsWith("gpt-5") || normalized.startsWith("o")) {
    return {
      reasoning: {
        effort: "low"
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

function getOpenAIErrorField(error: unknown, field: "code" | "type" | "status") {
  if (error && typeof error === "object" && field in error) {
    const value = (error as Record<string, unknown>)[field];

    if (typeof value === "string" || typeof value === "number") {
      return String(value).toLowerCase();
    }
  }

  return "";
}

export type OpenAIErrorCode =
  | "OPENAI_AUTH"
  | "OPENAI_QUOTA"
  | "OPENAI_MODEL"
  | "OPENAI_RATE_LIMIT"
  | "OPENAI_TIMEOUT"
  | "OPENAI_REQUEST_FAILED";

export function getOpenAIErrorCode(error: unknown): OpenAIErrorCode {
  const message = getOpenAIErrorMessage(error).toLowerCase();
  const status = getOpenAIErrorField(error, "status");
  const codeValue = getOpenAIErrorField(error, "code");
  const typeValue = getOpenAIErrorField(error, "type");

  if (
    status === "401" ||
    message.includes("api key") ||
    message.includes("authentication") ||
    message.includes("unauthorized") ||
    message.includes("401")
  ) {
    return "OPENAI_AUTH";
  }

  if (
    message.includes("insufficient_quota") ||
    message.includes("quota") ||
    message.includes("billing") ||
    message.includes("credit")
  ) {
    return "OPENAI_QUOTA";
  }

  if (message.includes("rate limit") || message.includes("429")) {
    return "OPENAI_RATE_LIMIT";
  }

  if (message.includes("timeout") || message.includes("timed out") || message.includes("aborted")) {
    return "OPENAI_TIMEOUT";
  }

  if (
    codeValue.includes("model_not_found") ||
    typeValue.includes("model_not_found") ||
    message.includes("you do not have access to the model") ||
    message.includes("you do not have access to model") ||
    (message.includes("model") && (message.includes("not found") || message.includes("does not exist")))
  ) {
    return "OPENAI_MODEL";
  }

  return "OPENAI_REQUEST_FAILED";
}

export function getOpenAIUserMessage(error: unknown) {
  const code = getOpenAIErrorCode(error);
  const primaryModel = getOpenAIModel();
  const fallbackModel = getOpenAIFallbackModel(primaryModel);

  switch (code) {
    case "OPENAI_AUTH":
      return "OpenAI API Key 无效或权限不足，请检查 Vercel 的 OPENAI_API_KEY。";
    case "OPENAI_QUOTA":
      return "OpenAI 额度或账单状态不足，请检查 OpenAI Billing / Project Limits。";
    case "OPENAI_MODEL":
      return `OpenAI 模型暂时不可用。当前主模型：${primaryModel}，备用模型：${fallbackModel}。请确认 Vercel 的 OPENAI_CHAT_MODEL / OPENAI_FALLBACK_MODEL 是否为账号可用模型。`;
    case "OPENAI_RATE_LIMIT":
      return "OpenAI 请求被限流，请稍后再试，或提高项目限额。";
    case "OPENAI_TIMEOUT":
      return "OpenAI 回应超时，请稍后再试。系统已配置备用模型，但当前请求仍未完成。";
    default:
      return "OpenAI 请求参数或模型配置暂时不兼容，请稍后再试。系统已记录错误。";
  }
}

function shouldRetryWithFallback(error: unknown) {
  const code = getOpenAIErrorCode(error);
  const message = getOpenAIErrorMessage(error).toLowerCase();

  return (
    code === "OPENAI_MODEL" ||
    code === "OPENAI_TIMEOUT" ||
    code === "OPENAI_RATE_LIMIT" ||
    message.includes("unsupported value") ||
    message.includes("unsupported_parameter")
  );
}

function normalizeResponseParams(
  params: Parameters<OpenAI["responses"]["create"]>[0],
  model: string
) {
  const { reasoning: _reasoning, ...baseParams } = params as Record<string, unknown>;
  const normalizedParams = {
    ...baseParams,
    model,
    ...getResponseReasoningOptions(model)
  } as Parameters<OpenAI["responses"]["create"]>[0];

  const mutableParams = normalizedParams as Record<string, unknown>;

  if (typeof mutableParams.max_output_tokens === "number" && mutableParams.max_output_tokens < OPENAI_MIN_OUTPUT_TOKENS) {
    mutableParams.max_output_tokens = OPENAI_MIN_OUTPUT_TOKENS;
  }

  return normalizedParams;
}

export async function createOpenAIResponseWithFallback(
  client: OpenAI,
  params: Parameters<OpenAI["responses"]["create"]>[0]
) {
  const primaryModel = String(params.model || getOpenAIModel());

  try {
    const primaryParams = normalizeResponseParams(params, primaryModel);

    return {
      response: (await client.responses.create(primaryParams)) as OpenAITextResponse,
      model: primaryModel,
      fallbackUsed: false
    };
  } catch (error) {
    if (!shouldRetryWithFallback(error)) {
      throw error;
    }

    let lastError = error;

    for (const fallbackModel of getOpenAIFallbackCandidates(primaryModel)) {
      try {
        const fallbackParams = normalizeResponseParams(params, fallbackModel);

        return {
          response: (await client.responses.create(fallbackParams)) as OpenAITextResponse,
          model: fallbackModel,
          fallbackUsed: true
        };
      } catch (fallbackError) {
        lastError = fallbackError;

        if (!shouldRetryWithFallback(fallbackError)) {
          break;
        }
      }
    }

    throw lastError;
  }
}
