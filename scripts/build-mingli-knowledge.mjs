import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const root = process.cwd();
const kbRoot = path.join(root, "knowledge-base", "fengshui-mingli");
const rawDir = path.join(kbRoot, "raw");
const processedDir = path.join(kbRoot, "processed");
const extractedDir = path.join(processedDir, "extracted");
const ocrCacheDir = path.join(processedDir, "ocr-cache");
const notesDir = path.join(kbRoot, "notes");
const promptsDir = path.join(kbRoot, "prompts");
const indexesDir = path.join(kbRoot, "indexes");

for (const dir of [processedDir, extractedDir, ocrCacheDir, notesDir, promptsDir, indexesDir]) {
  mkdirSync(dir, { recursive: true });
}

for (const file of readdirSync(extractedDir)) {
  if (file.endsWith(".txt")) {
    unlinkSync(path.join(extractedDir, file));
  }
}

const skipNames = new Set([".DS_Store"]);
const skipPrefixes = ["~$", "~WRL"];
const textExtensions = new Set([".txt", ".md"]);
const officeExtensions = new Set([".doc", ".docx", ".pptx"]);
const pdfExtensions = new Set([".pdf"]);
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".bmp", ".jxr"]);
const ocrImageExtensions = new Set([".jpg", ".jpeg", ".png", ".bmp"]);

function commandExists(command) {
  try {
    execFileSync("which", [command], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return true;
  } catch {
    return false;
  }
}

const hasTesseract = commandExists("tesseract");
const hasPdfToPpm = commandExists("pdftoppm");
const hasPdfInfo = commandExists("pdfinfo");
const enableOcr = process.env.KNOWLEDGE_OCR === "1";
const ocrMaxPages = Number(process.env.KNOWLEDGE_OCR_MAX_PAGES || 0);

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return [fullPath];
  });
}

function fileHash(filePath) {
  const hash = createHash("sha256");
  hash.update(readFileSync(filePath));
  return hash.digest("hex");
}

function safeSlug(input) {
  return input
    .replace(rawDir, "")
    .replace(/^[/\\]+/, "")
    .replace(/[\\/]+/g, "__")
    .replace(/\.[^.]+$/, "")
    .replace(/[^\p{Script=Han}a-zA-Z0-9._-]+/gu, "_")
    .slice(0, 150);
}

function cleanText(text) {
  return text
    .replace(/\r/g, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function unzipText(filePath, patterns) {
  const list = execFileSync("unzip", ["-Z1", filePath], { encoding: "utf8", maxBuffer: 1024 * 1024 * 20 })
    .split("\n")
    .filter(Boolean)
    .filter((name) => patterns.some((pattern) => pattern.test(name)))
    .sort();

  const chunks = [];
  for (const item of list) {
    try {
      const xml = execFileSync("unzip", ["-p", filePath, item], { encoding: "utf8", maxBuffer: 1024 * 1024 * 50 });
      chunks.push(xml);
    } catch {
      // Keep going; some office files contain odd binary entries.
    }
  }

  return cleanText(chunks.join("\n"));
}

function extractDocx(filePath) {
  return unzipText(filePath, [/^word\/document\.xml$/, /^word\/footnotes\.xml$/, /^word\/endnotes\.xml$/]);
}

function extractPptx(filePath) {
  return unzipText(filePath, [/^ppt\/slides\/slide\d+\.xml$/, /^ppt\/notesSlides\/notesSlide\d+\.xml$/]);
}

function extractLegacyOffice(filePath) {
  try {
    return cleanText(execFileSync("textutil", ["-convert", "txt", "-stdout", filePath], { encoding: "utf8", maxBuffer: 1024 * 1024 * 50 }));
  } catch {
    return "";
  }
}

function extractPdfFallback(filePath) {
  try {
    const text = execFileSync("strings", ["-n", "4", filePath], { encoding: "utf8", maxBuffer: 1024 * 1024 * 80 });
    const usefulLines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => /[\p{Script=Han}]/u.test(line))
      .filter((line) => line.length >= 4);
    return cleanText(usefulLines.join("\n"));
  } catch {
    return "";
  }
}

function extractPdfWithPython(filePath) {
  const code = String.raw`
import sys

path = sys.argv[1]
text = ""

try:
    import fitz
    doc = fitz.open(path)
    parts = []
    for page in doc:
        parts.append(page.get_text("text"))
    text = "\n".join(parts)
except Exception:
    text = ""

if len(text.strip()) < 120:
    try:
        from pypdf import PdfReader
        reader = PdfReader(path)
        parts = []
        for page in reader.pages:
            parts.append(page.extract_text() or "")
        text = "\n".join(parts)
    except Exception:
        pass

print(text)
`;

  try {
    return cleanText(execFileSync("python3", ["-c", code, filePath], { encoding: "utf8", maxBuffer: 1024 * 1024 * 180 }));
  } catch {
    return "";
  }
}

function getPdfPageCount(filePath) {
  if (!hasPdfInfo) return 0;
  try {
    const info = execFileSync("pdfinfo", [filePath], { encoding: "utf8", maxBuffer: 1024 * 1024 * 2 });
    return Number(info.match(/^Pages:\s+(\d+)/m)?.[1] || 0);
  } catch {
    return 0;
  }
}

function runTesseract(imagePath) {
  if (!hasTesseract) return "";
  try {
    return cleanText(
      execFileSync("tesseract", [imagePath, "stdout", "-l", "chi_sim+chi_tra+eng", "--psm", "6"], {
        encoding: "utf8",
        maxBuffer: 1024 * 1024 * 40,
        stdio: ["ignore", "pipe", "ignore"]
      })
    );
  } catch {
    try {
      return cleanText(
        execFileSync("tesseract", [imagePath, "stdout", "-l", "chi_sim+chi_tra+eng"], {
          encoding: "utf8",
          maxBuffer: 1024 * 1024 * 40,
          stdio: ["ignore", "pipe", "ignore"]
        })
      );
    } catch {
      return "";
    }
  }
}

function extractImageOcr(filePath) {
  return runTesseract(filePath);
}

function extractPdfOcr(filePath, recordId) {
  if (!enableOcr || !hasTesseract || !hasPdfToPpm) return "";

  const pages = getPdfPageCount(filePath);
  if (!pages) return "";

  const chunks = [];
  const pageLimit = ocrMaxPages > 0 ? Math.min(pages, ocrMaxPages) : pages;
  const pageCacheDir = path.join(ocrCacheDir, recordId);
  mkdirSync(pageCacheDir, { recursive: true });
  const dir = mkdtempSync(path.join(tmpdir(), "mingli-ocr-"));

  try {
    for (let page = 1; page <= pageLimit; page += 1) {
      const pageCachePath = path.join(pageCacheDir, `page-${page}.txt`);
      if (existsSync(pageCachePath)) {
        const cachedPage = cleanText(readFileSync(pageCachePath, "utf8"));
        if (cachedPage) chunks.push(`\n\n[Page ${page}]\n${cachedPage}`);
        continue;
      }

      if (page === 1 || page % 10 === 0) {
        console.log(`  page ${page}/${pageLimit}`);
      }

      const prefix = path.join(dir, `page-${page}`);
      try {
        execFileSync("pdftoppm", ["-r", "170", "-f", String(page), "-l", String(page), "-png", filePath, prefix], {
          encoding: "utf8",
          maxBuffer: 1024 * 1024 * 20,
          stdio: ["ignore", "ignore", "ignore"]
        });
      } catch {
        continue;
      }

      const imagePath = `${prefix}-${page}.png`;
      const fallbackImagePath = `${prefix}-1.png`;
      const actualImagePath = existsSync(imagePath) ? imagePath : fallbackImagePath;
      if (!existsSync(actualImagePath)) continue;

      const text = runTesseract(actualImagePath);
      if (text) {
        writeFileSync(pageCachePath, `${text}\n`);
        chunks.push(`\n\n[Page ${page}]\n${text}`);
      } else {
        writeFileSync(pageCachePath, "");
      }
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }

  return cleanText(chunks.join("\n"));
}

function extractOcrCached(filePath, ext, recordId) {
  if (!pdfExtensions.has(ext) && !ocrImageExtensions.has(ext)) return "";

  const cachePath = path.join(ocrCacheDir, `${recordId}.txt`);
  if (existsSync(cachePath)) {
    return cleanText(readFileSync(cachePath, "utf8"));
  }

  if (pdfExtensions.has(ext)) {
    const pageCacheDir = path.join(ocrCacheDir, recordId);
    if (existsSync(pageCacheDir)) {
      const cachedPages = readdirSync(pageCacheDir)
        .filter((file) => /^page-\d+\.txt$/.test(file))
        .sort((a, b) => Number(a.match(/\d+/)?.[0] || 0) - Number(b.match(/\d+/)?.[0] || 0))
        .map((file) => {
          const page = file.match(/\d+/)?.[0] || "";
          const text = cleanText(readFileSync(path.join(pageCacheDir, file), "utf8"));
          return text ? `\n\n[Page ${page}]\n${text}` : "";
        })
        .join("\n");

      if (cachedPages.length > 80) return cleanText(cachedPages);
    }
  }

  if (!enableOcr) return "";

  console.log(`OCR ${path.relative(rawDir, filePath)}`);
  const text = pdfExtensions.has(ext) ? extractPdfOcr(filePath, recordId) : extractImageOcr(filePath);
  if (text.length > 80) {
    writeFileSync(cachePath, `${text}\n`);
  }

  return text;
}

function extractText(filePath, ext, recordId) {
  if (textExtensions.has(ext)) return cleanText(readFileSync(filePath, "utf8"));
  if (ext === ".docx") return extractDocx(filePath);
  if (ext === ".pptx") return extractPptx(filePath);
  if (ext === ".doc") return extractLegacyOffice(filePath);
  if (pdfExtensions.has(ext)) {
    const pdfText = extractPdfWithPython(filePath);
    if (pdfText.length > 80) return pdfText;
    const fallbackText = extractPdfFallback(filePath);
    if (fallbackText.length > 80) return fallbackText;
    return extractOcrCached(filePath, ext, recordId);
  }
  if (ocrImageExtensions.has(ext)) return extractOcrCached(filePath, ext, recordId);
  return "";
}

function classify(filePath) {
  const relative = path.relative(rawDir, filePath);
  if (relative.includes("紫微斗数")) return "ziwei";
  if (relative.includes("梅花易数")) return "meihua";
  if (relative.includes("六爻")) return "liuyao";
  if (relative.includes("八字")) return "bazi";
  if (relative.includes("风水")) return "fengshui";
  return "general";
}

function inferTopics(text, relativePath) {
  const source = `${relativePath}\n${text.slice(0, 12000)}`;
  const topicMap = [
    ["六十四卦", ["64卦", "六十四卦", "卦辞", "爻"]],
    ["八卦类象", ["八卦", "万物类象", "类象", "乾", "坤", "震", "巽", "坎", "离", "艮", "兑"]],
    ["体用生克", ["体用", "用卦", "体卦", "生克"]],
    ["起卦断卦", ["起卦", "动爻", "互卦", "变卦", "本卦"]],
    ["六爻断卦", ["六爻", "世爻", "应爻", "用神", "六亲", "六神", "卦身"]],
    ["旺衰应期", ["旺衰", "应期", "月建", "日辰", "空亡", "冲合", "生克冲合"]],
    ["十二宫", ["命宫", "财帛宫", "官禄宫", "夫妻宫", "福德宫", "迁移宫"]],
    ["四化飞星", ["化禄", "化权", "化科", "化忌", "飞星", "四化"]],
    ["事业财运", ["事业", "工商", "钱财", "财运", "营商"]],
    ["婚姻关系", ["婚姻", "夫妻", "感情", "关系"]],
    ["趋吉避凶", ["趋吉避凶", "化解", "吉凶", "开运"]],
    ["九运", ["九运", "离火", "时代红利"]]
  ];

  return topicMap.filter(([, keys]) => keys.some((key) => source.includes(key))).map(([topic]) => topic);
}

const files = walk(rawDir);
const manifest = [];
const taxonomy = {};
let extractedCount = 0;
let skippedCount = 0;

for (const filePath of files) {
  const name = path.basename(filePath);
  const ext = path.extname(name).toLowerCase();
  const relativePath = path.relative(rawDir, filePath);
  const stat = statSync(filePath);
  const skip = skipNames.has(name) || skipPrefixes.some((prefix) => name.startsWith(prefix)) || stat.size === 0;
  const type = pdfExtensions.has(ext)
    ? "pdf"
    : officeExtensions.has(ext)
      ? "office"
      : imageExtensions.has(ext)
        ? "image"
        : textExtensions.has(ext)
          ? "text"
          : "unknown";
  const category = classify(filePath);
  const record = {
    id: createHash("sha1").update(relativePath).digest("hex").slice(0, 12),
    relativePath,
    category,
    type,
    extension: ext || "none",
    sizeBytes: stat.size,
    sha256: stat.size ? fileHash(filePath) : "",
    status: skip ? "skipped" : "pending",
    extractedPath: "",
    charCount: 0,
    quality: "none",
    topics: []
  };

  if (skip) {
    skippedCount += 1;
    manifest.push(record);
    continue;
  }

  const text = extractText(filePath, ext, record.id);
  record.charCount = text.length;
  record.topics = inferTopics(text, relativePath);
  record.quality = text.length > 2000 ? "good" : text.length > 300 ? "partial" : type === "image" ? "needs_ocr" : "low";

  if (text.length > 80) {
    const extractedName = `${record.id}__${safeSlug(relativePath)}.txt`;
    const outputPath = path.join(extractedDir, extractedName);
    const header = [
      `# Source: ${relativePath}`,
      `Category: ${category}`,
      `Type: ${type}`,
      `Topics: ${record.topics.join(", ") || "uncategorized"}`,
      "",
      "---",
      ""
    ].join("\n");
    writeFileSync(outputPath, `${header}${text}\n`);
    record.extractedPath = path.relative(kbRoot, outputPath);
    record.status = "extracted";
    extractedCount += 1;
  } else {
    record.status = type === "image" ? "image_indexed" : "needs_manual_ocr_or_pdf_parser";
  }

  taxonomy[category] ||= {};
  for (const topic of record.topics) {
    taxonomy[category][topic] ||= [];
    taxonomy[category][topic].push(record.id);
  }

  manifest.push(record);
}

const categorySummary = manifest.reduce((acc, item) => {
  acc[item.category] ||= { total: 0, extracted: 0, needsOcr: 0, skipped: 0 };
  acc[item.category].total += 1;
  if (item.status === "extracted") acc[item.category].extracted += 1;
  if (item.status === "image_indexed" || item.status === "needs_manual_ocr_or_pdf_parser") acc[item.category].needsOcr += 1;
  if (item.status === "skipped") acc[item.category].skipped += 1;
  return acc;
}, {});

writeFileSync(path.join(processedDir, "manifest.json"), JSON.stringify({ generatedAt: new Date().toISOString(), files: manifest }, null, 2));
writeFileSync(path.join(indexesDir, "knowledge-map.json"), JSON.stringify({ generatedAt: new Date().toISOString(), taxonomy, categorySummary }, null, 2));

const needsOcr = manifest.filter((item) => item.status === "image_indexed" || item.status === "needs_manual_ocr_or_pdf_parser");
writeFileSync(
  path.join(indexesDir, "ocr-needed.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), total: needsOcr.length, files: needsOcr }, null, 2)
);

const report = `# 命理知识库处理报告

生成时间：${new Date().toLocaleString("zh-MY")}

## 总览

- 原始文件：${manifest.length}
- 已抽取文字：${extractedCount}
- 已跳过临时/空文件：${skippedCount}
- 需要 OCR 或更强 PDF 解析：${manifest.filter((item) => item.status === "image_indexed" || item.status === "needs_manual_ocr_or_pdf_parser").length}

## 分类统计

${Object.entries(categorySummary)
  .map(([category, data]) => `- ${category}: ${data.total} 个文件，已抽取 ${data.extracted}，待 OCR/解析 ${data.needsOcr}，跳过 ${data.skipped}`)
  .join("\n")}

## 下一步建议

1. 先把 extracted 里的文字资料整理成「判断规则」而不是整本书全文塞进 prompt。
2. PDF 扫描书和图片资料需要 OCR 后再纳入知识库。
3. 每条知识都应标注：适用场景、输入条件、判断逻辑、输出建议、禁用/免责声明。
4. 接入 AI 时建议走 RAG：按问题类型检索相关知识片段，再喂给 AI 风水命理师。
`;

writeFileSync(path.join(notesDir, "knowledge-processing-report.md"), report);

const ocrReport = `# 待 OCR / 待解析资料清单

生成时间：${new Date().toLocaleString("zh-MY")}

这些资料已经进入知识库清单，但还没有可供 AI 读取的文字内容。要让 AI 真正学习这些内容，需要先做 OCR 或取得带文字层的 PDF。

${needsOcr.map((item, index) => `${index + 1}. [${item.category}] ${item.relativePath}（${item.type}，${Math.round(item.sizeBytes / 1024)} KB）`).join("\n")}
`;

writeFileSync(path.join(notesDir, "ocr-needed.md"), ocrReport);

const promptGuide = `# AI 风水命理师知识库使用准则

你是 AI 风水命理师。回答用户时可以参考知识库，但必须遵守：

1. 不要逐字背诵书本内容，也不要声称结果绝对准确。
2. 先判断用户问题类型：事业、财运、感情、健康、合作、开业搬迁、问卦。
3. 从知识库抽取相关规则后，输出为用户能理解的现实建议。
4. 输出结构优先使用：
   - 问题定性
   - 当前局势
   - 关键风险
   - 时机判断
   - 行动建议
   - 化解/通关建议
   - 必要免责声明
5. 对金融、医疗、法律等高风险事项，必须提醒用户咨询专业人士。
6. 产品/课程建议必须自然克制，只在与问题相关时提出。

后续 RAG 接入时，将把 indexes/knowledge-map.json 与 processed/extracted 文本切片作为检索来源。
`;

writeFileSync(path.join(promptsDir, "mingli-knowledge-system.md"), promptGuide);

console.log(`Processed ${manifest.length} files. Extracted ${extractedCount}. Skipped ${skippedCount}.`);
