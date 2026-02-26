# AEO & SEO Audit

A Claude Code rig that generates AEO (Answer Engine Optimization) and SEO audit reports for businesses. Runs in two modes: **light mode** (AEO snapshot + cold email for prospecting) and **full mode** (complete 25-35 page branded report with executive summary, cover letter, and follow-up emails). Give it a URL -- it crawls the site, calls free APIs for real metrics, analyzes AI search readiness, compares competitors, and produces the selected deliverable package.

**AEO is the lead, not a section.** Most SEO agencies still don't assess how businesses show up in AI search engines like ChatGPT, Perplexity, and Google AI Overviews. This audit does. The AEO assessment is what makes your outreach stand out.

Built for the "did the work first" sales motion: run the audit on a prospect without asking permission, send the executive summary cold, close the deal when they ask "can you fix this?"

## Requirements

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI installed and configured

## Setup

1. Clone this repo
2. Open the `aeo-audit/` directory in Claude Code
3. Run `/setup` to configure your branding, niche, pricing, and optional API key
4. You're ready to run audits

## Usage

### Run an audit

```
/run-audit
```

You'll be asked for:
- Business website URL
- Competitor URLs (or "auto-find")
- Target location (city/region)
- Prospect logo URL (optional, full mode only)
- Mode: light or full

The rig runs a 10-agent pipeline:

1. **Web Crawler** -- crawls the site via WebFetch for HTML analysis, meta tags, schema, headings
2. **API Caller** -- calls free APIs (PageSpeed, TLS/SSL via curl, W3C Validator, Wayback, WHOIS) for real metrics
3. **Competitor Researcher** -- finds and analyzes 2-3 competitors
4. **AEO Analyst** -- deep-dive AI search readiness assessment (the star analysis)
5. **SEO Strategist** -- synthesizes all research into scoring framework + action plan
6. **Report Writer** (x5) -- writes AEO assessment, technical audit, content analysis, local SEO, competitor comparison
7. **Report Designer** -- creates visual design brief for branded PDF
8. **Report Builder** -- builds report.html, executive-summary.html, follow-up emails
9. **Design Reviewer** -- validates HTML layout, typography, and design brief adherence
10. **Cover Letter Writer** -- personalized outreach letter (150-250 words, 3 subject lines, AEO-led)
11. **Quality Reviewer** -- validates everything before delivery

Output lands in `output/<client-slug>/`.

## What You Get

```
output/<client-slug>/
  README.md                          # Table of contents + delivery checklist
  plan.md                            # Approved audit plan
  research/
    site-crawl.md                    # Manual crawl analysis
    tool-data.md                     # Raw API data (PageSpeed, TLS/SSL, W3C, WHOIS, Wayback)
    competitor-analysis.md           # Competitor research
    aeo-analysis.md                  # AEO deep-dive (the centerpiece)
  strategy/
    audit-framework.md               # Scores, keyword gaps, priority matrix, action plan
  report/
    aeo-assessment.md                # Section 1: AEO Assessment (6-8 pages) -- THE LEAD
    technical-audit.md               # Section 2: Technical SEO (8-10 pages)
    content-analysis.md              # Section 3: On-Page Content (6-8 pages)
    local-seo-scorecard.md           # Section 4: Local SEO (4-6 pages)
    competitor-comparison.md         # Section 5: Competitor Comparison (3-5 pages)
  design/
    report-brief.md                  # Visual design brief
  sales/
    cover-letter.md                  # Outreach letter (leads with AEO findings)
    follow-up-emails.md              # 3-email follow-up sequence
  deliverables/
    report.html                      # Full branded report (open > print > PDF)
    executive-summary.html           # One-page summary (open > print > PDF)
```

### Light Mode Output

```
output/<client-slug>/
  plan.md                            # Audit plan (mode: light)
  research/
    site-crawl.md                    # Manual crawl analysis
    tool-data.md                     # Raw API data
    competitor-analysis.md           # Competitor research
    aeo-analysis.md                  # AEO deep-dive
  sales/
    aeo-snapshot.md                  # 800-word AEO summary for outreach
    cold-email.md                    # Cold outreach email + 3 subject lines
```

Light mode runs research + AEO analysis only, then produces a concise snapshot and cold email. Research data is saved so upgrading to full mode later reuses it.

### Real API Data

The audit uses real metrics from free APIs -- no fabricated data:

| Tool | What It Provides |
|------|-----------------|
| Google PageSpeed Insights | Core Web Vitals (LCP, CLS, INP), performance score, mobile + desktop |
| TLS/SSL (curl -v) | TLS version, certificate details, cipher info (SSL Labs used as cache-only bonus) |
| W3C HTML Validator | HTML validation errors/warnings |
| Wayback Machine | Site history, domain age indicator |
| WHOIS (RDAP -> Who-Dat -> whois) | Domain registration, age, expiration (multi-source fallback chain) |

### Creating PDFs

The HTML deliverables are print-optimized:
1. Open `deliverables/report.html` in a browser
2. Print (Cmd+P / Ctrl+P)
3. Save as PDF

Same for `executive-summary.html`.

## How the Sales Motion Works

1. **Pick a niche** -- dentists, plumbers, realtors, restaurants, coaches
2. **Run `/run-audit`** on 10-20 businesses in that niche. Use light mode for initial prospecting, full mode when a prospect responds.
3. **Send the executive summary cold**: "I checked how your business shows up when people ask AI assistants like ChatGPT and Perplexity for recommendations..."
4. **The audit sells itself.** When the prospect sees 25+ pages of specific findings with real data about their site, they ask: "Can you fix this?"
5. **That question is the close.**

The AEO angle is what gets the email opened. Every business owner has been pitched SEO. Almost none have been told how they show up in AI search.

## Revenue Model

| Service | Price Range |
|---------|-------------|
| Audit report (standalone) | $500 - $1,500 |
| Audit + implementation plan | $2,000 - $3,500 |
| Ongoing AEO/SEO management | $750 - $2,000/mo |
| Quarterly re-audit | $500 - $1,000 |

## Configuration

Your settings live in `config/member-profile.md`. Run `/setup` to configure, or edit directly.

## Commands

| Command | What it does |
|---------|-------------|
| `/setup` | Configure your branding, niche, pricing, and API key |
| `/run-audit` | Generate a complete AEO & SEO audit for a business |
