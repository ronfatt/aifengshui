export type AiReportPayload = {
  summary?: string;
  sections?: { title: string; content: string }[];
};

type FallbackReport = {
  summary: string;
  sections: { title: string; content: string }[];
};

function stripJsonFence(text: string) {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export function normalizeAiReportPayload(rawText: string, fallback: FallbackReport, maxSections = 8): Required<AiReportPayload> {
  const candidates = [
    stripJsonFence(rawText),
    stripJsonFence(rawText).match(/\{[\s\S]*\}/)?.[0] || ""
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      let parsed = JSON.parse(candidate) as unknown;

      if (typeof parsed === "string") {
        parsed = JSON.parse(stripJsonFence(parsed)) as unknown;
      }

      if (parsed && typeof parsed === "object") {
        const payload = parsed as { summary?: unknown; sections?: unknown };
        const sections = Array.isArray(payload.sections)
          ? payload.sections
              .map((section) => {
                if (!section || typeof section !== "object") {
                  return null;
                }

                const item = section as { title?: unknown; content?: unknown };
                const title = typeof item.title === "string" ? item.title.trim() : "";
                const content = typeof item.content === "string" ? item.content.trim() : "";

                return title && content ? { title, content } : null;
              })
              .filter((section): section is { title: string; content: string } => Boolean(section))
          : [];

        return {
          summary: typeof payload.summary === "string" && payload.summary.trim() ? payload.summary.trim() : fallback.summary,
          sections: sections.length ? sections.slice(0, maxSections) : fallback.sections.slice(0, maxSections)
        };
      }
    } catch {
      // Continue trying other candidate forms. Model output can be fenced or double-encoded.
    }
  }

  const plainText = rawText.replace(/```(?:json)?|```/gi, "").trim();
  const looksLikeBrokenJson = plainText.startsWith("{") || plainText.includes('"summary"') || plainText.includes('"sections"');

  return {
    summary: looksLikeBrokenJson ? fallback.summary : plainText.slice(0, 320) || fallback.summary,
    sections: looksLikeBrokenJson
      ? fallback.sections.slice(0, maxSections)
      : [{ title: "AI 综合解析", content: plainText.slice(0, 1800) || fallback.sections[0]?.content || fallback.summary }]
  };
}
