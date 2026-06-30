import assert from "node:assert/strict";
import { mkdir, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { join } from "node:path";
import { test } from "node:test";
import {
  auditSite,
  buildColdEmail,
  extractSiteSignals,
  scoreSignals,
  writeDeliverables,
  writeRigDeliverables,
} from "../tools/aeo-audit.mjs";

const richHtml = `<!doctype html>
<html>
<head>
  <title>Acme Pet Supply | Durable dog travel gear</title>
  <meta name="description" content="Acme Pet Supply makes durable dog travel gear for US pet owners with fast shipping and easy returns.">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Acme Pet Supply"}</script>
</head>
<body>
  <header><nav><a href="/about">About</a><a href="/faq">FAQ</a><a href="/shipping">Shipping</a><a href="/reviews">Reviews</a></nav></header>
  <h1>Dog travel gear for weekend road trips</h1>
  <p>We help US pet owners keep dogs calm, safe, and organized during car travel.</p>
  <section>
    <h2>Frequently asked questions</h2>
    <p>Shipping takes 3-5 days. Returns are accepted within 30 days.</p>
    <p>Contact support at hello@example.test.</p>
  </section>
</body>
</html>`;

const weakHtml = `<!doctype html>
<html><head><title>Home</title></head><body><h1>Welcome</h1><p>Best products online.</p></body></html>`;

async function withServer(routes, fn) {
  const server = createServer((req, res) => {
    const body = routes[req.url] ?? routes["/"] ?? "";
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(body);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("extractSiteSignals detects AEO-relevant content from HTML", () => {
  const signals = extractSiteSignals(richHtml, "https://example.test/");

  assert.equal(signals.title, "Acme Pet Supply | Durable dog travel gear");
  assert.equal(signals.hasMetaDescription, true);
  assert.equal(signals.hasStructuredData, true);
  assert.equal(signals.hasFaqSignals, true);
  assert.equal(signals.hasShippingSignals, true);
  assert.equal(signals.hasTrustSignals, true);
  assert.equal(signals.wordCount > 40, true);
});

test("scoreSignals gives richer sites higher scores and clear findings", () => {
  const richScore = scoreSignals(extractSiteSignals(richHtml, "https://example.test/"));
  const weakScore = scoreSignals(extractSiteSignals(weakHtml, "https://example.test/"));

  assert.equal(richScore.score > weakScore.score, true);
  assert.equal(richScore.grade === "A" || richScore.grade === "B", true);
  assert.equal(weakScore.findings.some((finding) => finding.includes("FAQ")), true);
});

test("auditSite crawls common pages and creates a report model", async () => {
  await withServer({
    "/": richHtml,
    "/about": "<h1>About Acme</h1><p>Founded by pet owners for US dog travel.</p>",
    "/faq": "<h1>FAQ</h1><p>How long is shipping? 3-5 days.</p>",
    "/shipping": "<h1>Shipping</h1><p>US warehouse shipping and returns.</p>",
  }, async (baseUrl) => {
    const audit = await auditSite({
      url: baseUrl,
      customerType: "Shopify pet brand",
      serviceOffer: "AEO audit and fulfillment support",
    });

    assert.equal(audit.url, baseUrl);
    assert.equal(audit.pages.length >= 3, true);
    assert.equal(audit.score.total > 60, true);
    assert.equal(audit.personas.length >= 2, true);
    assert.equal(audit.priorities.length >= 3, true);
  });
});

test("buildColdEmail turns an audit into a concrete outreach message", () => {
  const audit = {
    url: "https://example.test",
    brandName: "Acme Pet Supply",
    score: { total: 47, grade: "C" },
    priorities: ["Add buyer-focused FAQ content", "Clarify shipping and returns"],
  };

  const email = buildColdEmail(audit, {
    senderName: "JST Fulfill",
    serviceOffer: "AEO audit and US warehouse fulfillment",
  });

  assert.match(email.subject, /Acme Pet Supply/);
  assert.match(email.body, /47\/100/);
  assert.match(email.body, /FAQ/);
  assert.match(email.body, /JST Fulfill/);
});

test("writeDeliverables saves report, raw scrape, plan, and cold email files", async () => {
  const outDir = join(process.cwd(), ".tmp-aeo-test-output");
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const audit = {
    url: "https://example.test",
    brandName: "Acme Pet Supply",
    generatedAt: "2026-06-30T00:00:00.000Z",
    customerType: "Shopify brand",
    serviceOffer: "AEO audit",
    pages: [{ url: "https://example.test", title: "Acme", status: 200 }],
    score: { total: 72, grade: "B", categories: [], findings: [], strengths: [] },
    personas: ["Busy US pet owner"],
    competitors: [],
    priorities: ["Add FAQ"],
    implementationPlan: ["Week 1: fix FAQ"],
    coldEmail: { subject: "AEO notes for Acme", body: "Hi Acme" },
  };

  const files = await writeDeliverables(audit, outDir);

  assert.equal(files.length, 5);
  assert.match(await readFile(join(outDir, "site-audit-report.md"), "utf8"), /Acme Pet Supply/);
  assert.match(await readFile(join(outDir, "cold-email.txt"), "utf8"), /AEO notes/);

  await rm(outDir, { recursive: true, force: true });
});

test("writeRigDeliverables saves a light-mode pipeline folder like the public rig", async () => {
  const outDir = join(process.cwd(), ".tmp-aeo-rig-test-output");
  await rm(outDir, { recursive: true, force: true });

  const audit = {
    url: "https://example.test",
    brandName: "Acme Pet Supply",
    generatedAt: "2026-06-30T00:00:00.000Z",
    customerType: "Shopify brand",
    serviceOffer: "AEO audit",
    pages: [{ url: "https://example.test", title: "Acme", status: 200, wordCount: 120 }],
    score: { total: 72, grade: "B", categories: [], findings: ["Missing FAQ"], strengths: ["Clear title"] },
    personas: ["Busy US pet owner"],
    competitors: ["What are the best alternatives to Acme Pet Supply?"],
    priorities: ["Add FAQ"],
    implementationPlan: ["Week 1: fix FAQ"],
    coldEmail: { subject: "AEO notes for Acme", body: "Hi Acme" },
  };

  const files = await writeRigDeliverables(audit, outDir, "light");

  assert.equal(files.some((file) => file.endsWith("research\\site-crawl.md") || file.endsWith("research/site-crawl.md")), true);
  assert.equal(files.some((file) => file.endsWith("sales\\aeo-snapshot.md") || file.endsWith("sales/aeo-snapshot.md")), true);
  assert.match(await readFile(join(outDir, "README.md"), "utf8"), /Light Mode Audit/);
  assert.match(await readFile(join(outDir, "sales", "cold-email.md"), "utf8"), /AEO notes/);

  await rm(outDir, { recursive: true, force: true });
});
