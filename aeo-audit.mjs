#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const COMMON_PATHS = ["/", "/about", "/about-us", "/faq", "/shipping", "/returns", "/contact", "/blog"];

const SIGNALS = {
  faq: /\b(faq|frequently asked|questions|how do|how long|what if|can i)\b/i,
  shipping: /\b(ship|shipping|delivery|warehouse|fulfill|fulfillment|returns?|refund)\b/i,
  trust: /\b(review|testimonial|case stud|guarantee|secure|support|contact|founded|team|press|media)\b/i,
  product: /\b(product|collection|shop|buy|price|size|material|feature|benefit|customer)\b/i,
  audience: /\b(for|designed for|made for|helps|owners|brands|seller|customer|business|family|pet|women|men)\b/i,
};

export function normalizeUrl(url) {
  const parsed = new URL(url);
  parsed.hash = "";
  return parsed.toString().replace(/\/$/, "");
}

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeBasicEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function matchContent(html, pattern) {
  const match = html.match(pattern);
  return match ? decodeBasicEntities(match[1].trim()) : "";
}

function wordCount(text) {
  const latinWords = text.match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)?/g) ?? [];
  const cjkChars = text.match(/[\u4e00-\u9fff]/g) ?? [];
  return latinWords.length + Math.ceil(cjkChars.length / 2);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function inferBrandName(title, url) {
  const host = new URL(url).hostname.replace(/^www\./, "");
  if (!title) return host.split(".")[0];
  return title.split(/\s+[|–—-]\s+/)[0].trim() || host.split(".")[0];
}

export function extractSiteSignals(html, url) {
  const title = matchContent(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const metaDescription = matchContent(
    html,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
  ) || matchContent(
    html,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["'][^>]*>/i,
  );
  const h1 = matchContent(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const text = stripTags(html);
  const lower = text.toLowerCase();
  const links = [...html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>/gi)].map((match) => match[1]);

  return {
    url,
    title,
    metaDescription,
    h1: stripTags(h1),
    text,
    wordCount: wordCount(text),
    hasMetaDescription: metaDescription.length >= 50,
    hasStructuredData: /<script[^>]+type=["']application\/ld\+json["']/i.test(html),
    hasFaqSignals: SIGNALS.faq.test(lower),
    hasShippingSignals: SIGNALS.shipping.test(lower),
    hasTrustSignals: SIGNALS.trust.test(lower),
    hasProductSignals: SIGNALS.product.test(lower),
    hasAudienceSignals: SIGNALS.audience.test(lower),
    internalLinks: links.filter((link) => link.startsWith("/") || link.includes(new URL(url).hostname)),
  };
}

function scoreCategory(name, score, max, finding, strength) {
  return { name, score, max, finding, strength };
}

export function scoreSignals(signals) {
  const categories = [
    scoreCategory(
      "品牌定位清晰度",
      (signals.title ? 10 : 0) + (signals.h1 ? 8 : 0) + (signals.hasAudienceSignals ? 7 : 0),
      25,
      "The homepage title, H1, or audience positioning is not clear enough for AI tools to quickly understand who the brand serves.",
      "The title, H1, and audience signals are clear enough for AI tools to summarize the brand positioning.",
    ),
    scoreCategory(
      "AEO 可读性",
      (signals.hasMetaDescription ? 8 : 0) + (signals.wordCount >= 120 ? 8 : 0) + (signals.hasFaqSignals ? 9 : 0),
      25,
      "The site needs stronger FAQ, question-based content, or summary information so AI answer engines can extract direct answers.",
      "The page includes summary and FAQ/question signals that are useful for AI answer extraction.",
    ),
    scoreCategory(
      "信任与转化信息",
      (signals.hasTrustSignals ? 8 : 0) + (signals.hasShippingSignals ? 7 : 0) + (signals.hasProductSignals ? 5 : 0),
      20,
      "Trust and conversion signals are thin: reviews, support, shipping, returns, contact details, or product specifics need to be clearer.",
      "The page includes product, shipping, support, or trust signals that help buyers and AI tools evaluate credibility.",
    ),
    scoreCategory(
      "技术结构",
      (signals.hasStructuredData ? 12 : 0) + (signals.internalLinks.length >= 4 ? 8 : 0),
      20,
      "Structured data or internal linking is limited, which weakens how search engines and AI tools understand page relationships.",
      "Structured data and internal links provide a useful technical foundation.",
    ),
    scoreCategory(
      "内容深度",
      Math.min(10, Math.floor(signals.wordCount / 40)),
      10,
      "The page content is thin, giving AI too little material to judge differentiation and use cases.",
      "The page has enough text for AI tools to extract and summarize useful answers.",
    ),
  ];

  const total = categories.reduce((sum, category) => sum + category.score, 0);
  const grade = total >= 85 ? "A" : total >= 70 ? "B" : total >= 50 ? "C" : total >= 35 ? "D" : "F";
  const findings = categories
    .filter((category) => category.score < category.max * 0.65)
    .map((category) => category.finding);
  const strengths = categories
    .filter((category) => category.score >= category.max * 0.65)
    .map((category) => category.strength);

  return { score: total, total, grade, categories, findings, strengths };
}

async function fetchPage(url, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0 AEO-Audit-MVP/1.0",
        accept: "text/html,application/xhtml+xml",
      },
    });
    const html = await response.text();
    return { url, status: response.status, ok: response.ok, html };
  } catch (error) {
    return { url, status: 0, ok: false, html: "", error: error.message };
  } finally {
    clearTimeout(timer);
  }
}

function makeAbsolute(baseUrl, path) {
  return new URL(path, baseUrl).toString();
}

function discoverCandidatePaths(homeHtml) {
  const paths = [...homeHtml.matchAll(/<a[^>]+href=["']([^"'#?]+)["'][^>]*>/gi)]
    .map((match) => match[1])
    .filter((href) => /^\/(about|faq|shipping|returns|contact|blog|pages|policies)/i.test(href))
    .slice(0, 8);
  return unique([...COMMON_PATHS, ...paths]);
}

export async function auditSite(options) {
  const url = normalizeUrl(options.url);
  const home = await fetchPage(url);
  const candidatePaths = discoverCandidatePaths(home.html);
  const pageUrls = unique(candidatePaths.map((path) => makeAbsolute(url, path))).slice(0, 10);
  const pages = [];

  for (const pageUrl of pageUrls) {
    const page = pageUrl === url ? home : await fetchPage(pageUrl);
    if (page.ok || page.html) {
      const signals = extractSiteSignals(page.html, page.url);
      pages.push({
        url: page.url,
        status: page.status,
        title: signals.title,
        h1: signals.h1,
        wordCount: signals.wordCount,
        signals,
      });
    }
  }

  const combinedHtml = pages.map((page) => page.signals.text).join("\n");
  const combinedSignals = {
    ...extractSiteSignals(`<title>${pages[0]?.title ?? ""}</title><body>${combinedHtml}</body>`, url),
    hasStructuredData: pages.some((page) => page.signals.hasStructuredData),
    hasMetaDescription: pages.some((page) => page.signals.hasMetaDescription),
    internalLinks: pages.flatMap((page) => page.signals.internalLinks),
  };
  const score = scoreSignals(combinedSignals);
  const brandName = inferBrandName(pages[0]?.title ?? "", url);

  const audit = {
    url,
    brandName,
    generatedAt: new Date().toISOString(),
    customerType: options.customerType || "ecommerce brand",
    serviceOffer: options.serviceOffer || "AEO audit and implementation support",
    pages: pages.map(({ signals, ...page }) => page),
    score,
    personas: buildPersonas(combinedSignals, options.customerType),
    competitors: await discoverCompetitorPrompts(brandName, combinedSignals),
    priorities: buildPriorities(score.findings, combinedSignals),
    implementationPlan: buildImplementationPlan(score.findings, combinedSignals),
  };
  audit.coldEmail = buildColdEmail(audit, options);
  return audit;
}

function buildPersonas(signals, customerType) {
  const base = customerType || "ecommerce buyer";
  const personas = [
    `${base} who wants a quick answer before comparing vendors`,
    `Buyer asking AI whether this brand is trustworthy and easy to buy from`,
  ];
  if (signals.hasShippingSignals) personas.push("Customer checking delivery time, returns, and post-purchase risk");
  if (signals.hasProductSignals) personas.push("Product-aware shopper comparing features, materials, and use cases");
  return personas;
}

async function discoverCompetitorPrompts(brandName, signals) {
  return [
    `What are the best alternatives to ${brandName}?`,
    `Is ${brandName} trustworthy?`,
    `Which brands are best for ${signals.hasProductSignals ? "this product category" : "this service category"}?`,
  ];
}

function buildPriorities(findings, signals) {
  const priorities = [...findings];
  if (!signals.hasFaqSignals) priorities.push("Add a buyer-focused FAQ section that directly answers the questions prospects would ask AI tools.");
  if (!signals.hasStructuredData) priorities.push("Add Organization, Product/Service, and FAQ schema so search engines and AI tools can understand the entity relationships.");
  if (!signals.hasShippingSignals) priorities.push("Clarify shipping, delivery time, returns, and support to reduce buying risk.");
  if (!signals.hasTrustSignals) priorities.push("Add reviews, case studies, contact details, media mentions, or social proof to strengthen trust.");
  priorities.push("Create a clear comparison page so AI tools can answer why buyers should choose this brand.");
  priorities.push("Rewrite core buying objections as Q&A blocks that match real customer search questions.");
  priorities.push("Regularly test ChatGPT, Perplexity, and Google AI-style results to see whether the brand is understood correctly.");
  return unique(priorities).slice(0, 6);
}

function buildImplementationPlan(findings, signals) {
  const plan = [
    "Day 1: Clarify the homepage one-line positioning, target audience, and core differentiation.",
    "Day 2: Expand core product/service pages with use cases, specifications, fit, and buying objections.",
    "Day 3: Add an FAQ section covering 8-12 questions prospects would ask AI tools.",
    "Day 4: Strengthen trust signals: shipping, returns, support, reviews, examples, and contact details.",
    "Day 5: Add basic schema and review titles, meta descriptions, internal links, and sitemap coverage.",
  ];
  if (findings.length === 0 && signals.hasStructuredData) {
    plan.push("Week 2: Build competitor comparison and buying-guide content to expand AI-citable coverage.");
  }
  return plan;
}

export function buildColdEmail(audit, options = {}) {
  const senderName = options.senderName || "JST Fulfill";
  const offer = options.serviceOffer || audit.serviceOffer || "AEO audit and fulfillment support";
  const firstPriority = audit.priorities?.[0] || "AI 不容易快速理解网站定位";
  const subject = `AEO notes for ${audit.brandName}`;
  const body = [
    `Hi ${audit.brandName} team,`,
    "",
    `I ran a quick AI search visibility check for ${audit.url}. The site scored ${audit.score.total}/100 (${audit.score.grade}) in this first-pass AEO audit.`,
    "",
    `The biggest issue I noticed: ${firstPriority}`,
    "",
    `This matters because buyers are starting to ask ChatGPT, Perplexity, and Google AI-style search tools for product and vendor recommendations. If the site is hard for AI to summarize, it can get skipped even when the product is solid.`,
    "",
    `I put together a short report with the score, key fixes, and a practical implementation plan. If useful, ${senderName} can help with ${offer}.`,
    "",
    "Want me to send the report over?",
    "",
    senderName,
  ].join("\n");
  return { subject, body };
}

function renderMarkdown(audit) {
  const categoryRows = audit.score.categories
    .map((category) => `| ${category.name} | ${category.score}/${category.max} |`)
    .join("\n");
  return `# AEO Audit Report: ${audit.brandName}

Generated: ${audit.generatedAt}

URL: ${audit.url}

Customer type: ${audit.customerType}

## Score

**${audit.score.total}/100 (${audit.score.grade})**

| Category | Score |
| --- | ---: |
${categoryRows}

## Strengths

${list(audit.score.strengths)}

## Findings

${list(audit.score.findings)}

## Lead Personas / AI Search Angles

${list(audit.personas)}

## Competitor Research Prompts

${list(audit.competitors)}

## Priority Fixes

${list(audit.priorities)}

## Implementation Plan

${list(audit.implementationPlan)}
`;
}

function renderHtml(audit) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AEO Audit Report - ${escapeHtml(audit.brandName)}</title>
  <style>
    body { margin: 0; background: #f6f3ec; color: #24211d; font-family: Arial, sans-serif; line-height: 1.6; }
    main { max-width: 880px; margin: 0 auto; padding: 32px 20px 56px; }
    .hero { background: #151515; color: #fff; padding: 28px; border-radius: 12px; }
    .score { font-size: 42px; font-weight: 800; margin: 12px 0; color: #d6a84d; }
    section { background: #fff; border: 1px solid #e7dece; border-radius: 10px; padding: 22px; margin-top: 18px; }
    h1, h2 { line-height: 1.25; }
    li { margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; }
    td, th { padding: 10px; border-bottom: 1px solid #eee4d5; text-align: left; }
  </style>
</head>
<body>
<main>
  <div class="hero">
    <p>AEO Audit</p>
    <h1>${escapeHtml(audit.brandName)}</h1>
    <div class="score">${audit.score.total}/100 (${audit.score.grade})</div>
    <p>${escapeHtml(audit.url)}</p>
  </div>
  ${section("Strengths", audit.score.strengths)}
  ${section("Findings", audit.score.findings)}
  ${section("Priority Fixes", audit.priorities)}
  ${section("Implementation Plan", audit.implementationPlan)}
</main>
</body>
</html>`;
}

function renderPlan(audit) {
  return `# Implementation Plan

${audit.implementationPlan.map((item) => `- ${item}`).join("\n")}
`;
}

function renderAuditPlan(audit, mode) {
  return `# Audit Plan

- Business URL: ${audit.url}
- Business name: ${audit.brandName}
- Customer type: ${audit.customerType}
- Mode: ${mode}
- Generated: ${audit.generatedAt}
- Service offer: ${audit.serviceOffer}

## Pipeline

1. Site crawl
2. Free/heuristic tool data
3. Competitor research prompts
4. AEO analysis
5. Strategy and priority fixes
6. Sales snapshot and cold email
`;
}

function renderSiteCrawl(audit) {
  return `# Site Crawl: ${audit.brandName}

${audit.pages.map((page) => `## ${page.title || page.url}

- URL: ${page.url}
- Status: ${page.status}
- H1: ${page.h1 || "not detected"}
- Word count: ${page.wordCount}
`).join("\n")}
`;
}

function renderToolData(audit) {
  return `# Tool Data

This free MVP uses direct crawl heuristics and does not require paid API access.

## Detected Signals

- Pages crawled: ${audit.pages.length}
- Structured data: ${audit.score.categories.find((category) => category.name === "技术结构")?.score ?? "n/a"}
- Overall score: ${audit.score.total}/100 (${audit.score.grade})

## Suggested Free API Upgrades

- Google PageSpeed Insights API
- W3C Markup Validator
- Wayback Machine CDX API
- RDAP/WHOIS lookup
`;
}

function renderCompetitorAnalysis(audit) {
  return `# Competitor Research

The MVP does not scrape search engines automatically. Use these prompts in ChatGPT, Perplexity, Google AI Mode, or manual search to identify comparison targets:

${list(audit.competitors)}
`;
}

function renderAeoAnalysis(audit) {
  return `# AEO Analysis: ${audit.brandName}

## AI Search Readiness

Score: **${audit.score.total}/100 (${audit.score.grade})**

## Why This Matters

If buyers ask AI tools for product or vendor recommendations, the site needs clear, extractable answers about who the brand is, what it sells, who it serves, why it is trustworthy, and how buying/logistics work.

## Strengths

${list(audit.score.strengths)}

## Gaps

${list(audit.score.findings)}

## Buyer / AI Query Personas

${list(audit.personas)}
`;
}

function renderFramework(audit) {
  const rows = audit.score.categories
    .map((category) => `| ${category.name} | ${category.score}/${category.max} | ${category.score >= category.max * 0.65 ? "Pass" : "Needs work"} |`)
    .join("\n");
  return `# Audit Framework

| Category | Score | Status |
| --- | ---: | --- |
${rows}

## Priority Matrix

${list(audit.priorities)}
`;
}

function renderAeoSnapshot(audit) {
  return `# AEO Snapshot: ${audit.brandName}

## AI Search Readiness: ${audit.score.total}/100 (${audit.score.grade})

${audit.brandName} has enough public information for a first-pass review, but the main opportunity is making the site easier for AI answer engines to understand, summarize, and trust.

## Top Findings

${list(audit.score.findings.slice(0, 3))}

## Quick Wins

${list(audit.priorities.slice(0, 4))}

## Suggested AI Search Test

Ask ChatGPT, Perplexity, and Google AI-style search:

${list(audit.competitors)}
`;
}

function renderColdEmailMarkdown(audit) {
  return `# Cold Email

## Subject Options

1. ${audit.coldEmail.subject}
2. Quick AI search notes for ${audit.brandName}
3. ${audit.brandName}: 3 AEO fixes I noticed

## Email

${audit.coldEmail.body}
`;
}

function renderReadme(audit, mode) {
  if (mode === "light") {
    return `# Light Mode Audit: ${audit.brandName}

## Files

| File | Description |
| --- | --- |
| \`sales/aeo-snapshot.md\` | AEO summary with score, top findings, quick wins |
| \`sales/cold-email.md\` | Cold outreach email with 3 subject line options |

## Research Data

| File | Description |
| --- | --- |
| \`research/site-crawl.md\` | Site crawl analysis |
| \`research/tool-data.md\` | Free/heuristic tool data |
| \`research/competitor-analysis.md\` | Competitor research prompts |
| \`research/aeo-analysis.md\` | AEO deep-dive analysis |

## Next Steps

1. Review the cold email and AEO snapshot.
2. Send the cold email to the prospect.
3. If they respond, run full mode or manually expand the report.
`;
  }
  return `# Full Mode Audit: ${audit.brandName}

Open \`deliverables/report.html\` in a browser and print to PDF.
`;
}

function list(items) {
  if (!items?.length) return "- No major items detected in this first pass.";
  return items.map((item) => `- ${item}`).join("\n");
}

function section(title, items) {
  return `<section><h2>${escapeHtml(title)}</h2><ul>${(items?.length ? items : ["No major items detected in this first pass."]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function writeDeliverables(audit, outDir) {
  await mkdir(outDir, { recursive: true });
  const files = [
    ["site-audit-report.md", renderMarkdown(audit)],
    ["site-audit-report.html", renderHtml(audit)],
    ["implementation-plan.md", renderPlan(audit)],
    ["cold-email.txt", `Subject: ${audit.coldEmail.subject}\n\n${audit.coldEmail.body}\n`],
    ["raw-scrape.json", `${JSON.stringify(audit, null, 2)}\n`],
  ];
  for (const [name, content] of files) {
    await writeFile(join(outDir, name), content, "utf8");
  }
  return files.map(([name]) => join(outDir, name));
}

export async function writeRigDeliverables(audit, outDir, mode = "light") {
  const dirs = ["research", "strategy", "report", "design", "sales", "deliverables"];
  await mkdir(outDir, { recursive: true });
  for (const dir of dirs) await mkdir(join(outDir, dir), { recursive: true });

  const files = [
    ["README.md", renderReadme(audit, mode)],
    ["plan.md", renderAuditPlan(audit, mode)],
    ["research/site-crawl.md", renderSiteCrawl(audit)],
    ["research/tool-data.md", renderToolData(audit)],
    ["research/competitor-analysis.md", renderCompetitorAnalysis(audit)],
    ["research/aeo-analysis.md", renderAeoAnalysis(audit)],
    ["strategy/audit-framework.md", renderFramework(audit)],
    ["sales/aeo-snapshot.md", renderAeoSnapshot(audit)],
    ["sales/cold-email.md", renderColdEmailMarkdown(audit)],
    ["raw-scrape.json", `${JSON.stringify(audit, null, 2)}\n`],
  ];

  if (mode === "full") {
    files.push(
      ["report/aeo-assessment.md", renderAeoAnalysis(audit)],
      ["report/technical-audit.md", renderToolData(audit)],
      ["report/content-analysis.md", renderMarkdown(audit)],
      ["report/competitor-comparison.md", renderCompetitorAnalysis(audit)],
      ["design/report-brief.md", "# Report Design Brief\n\nUse a clean business report layout with AEO score first.\n"],
      ["deliverables/report.html", renderHtml(audit)],
      ["deliverables/executive-summary.html", renderHtml(audit)],
      ["sales/follow-up-emails.md", "# Follow-up Emails\n\nFollow up after 3, 7, and 14 days with one concrete AEO finding each time.\n"],
    );
  }

  for (const [name, content] of files) {
    const path = join(outDir, name);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content, "utf8");
  }
  return files.map(([name]) => join(outDir, name));
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg.startsWith("--")) {
      args[arg.slice(2)] = argv[index + 1] && !argv[index + 1].startsWith("--") ? argv[++index] : true;
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.url) {
    console.error("Usage: node tools/aeo-audit.mjs --url https://example.com --out output/aeo/example --customer-type \"Shopify brand\" --service-offer \"AEO audit and US warehouse fulfillment\"");
    process.exitCode = 1;
    return;
  }
  const audit = await auditSite({
    url: args.url,
    customerType: args["customer-type"],
    serviceOffer: args["service-offer"],
    senderName: args["sender-name"],
  });
  const outDir = args.out || join(process.cwd(), "output", "aeo", audit.brandName.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase());
  const mode = args.mode === "full" ? "full" : "light";
  const files = await writeRigDeliverables(audit, outDir, mode);
  console.log(`AEO audit complete: ${audit.brandName} ${audit.score.total}/100 (${audit.score.grade})`);
  for (const file of files) console.log(file);
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isCli) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
