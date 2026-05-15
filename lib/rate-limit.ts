import { NextResponse } from "next/server";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

function clientKey(request: Request, scope: string) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const userAgent = request.headers.get("user-agent")?.slice(0, 80) || "unknown";

  return `${scope}:${forwardedFor || realIp || userAgent}`;
}

export function rateLimitRequest(
  request: Request,
  {
    scope,
    limit,
    windowMs
  }: {
    scope: string;
    limit: number;
    windowMs: number;
  }
) {
  const now = Date.now();
  const key = clientKey(request, scope);
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (current.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return NextResponse.json(
      { error: "请求太频繁，请稍后再试。", retryAfter },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  current.count += 1;
  buckets.set(key, current);
  return null;
}
