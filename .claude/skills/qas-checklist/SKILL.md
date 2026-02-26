---
name: QAS Checklist (SEO Audit)
version: 1.0.0
description: Consolidated validation criteria for the Quality Reviewer agent. Extracts only the scoring thresholds, structural requirements, and validation checks from the 6 domain skills. This is the ONLY skill file the QAS needs to read.
---

# QAS Checklist -- SEO Audit

This file contains everything you need to validate an SEO audit. You do NOT need to read the individual domain skill files (technical-seo, aeo-optimization, content-seo, local-seo, seo-report-structure, audit-outreach). All validation criteria are consolidated here.

## Reading Strategy (CRITICAL)

Read output files in this priority order to manage your turn budget:
1. **Score sources first**: `strategy/audit-framework.md` (all scores and action plan)
2. **Deliverables second**: `deliverables/report.html`, `deliverables/executive-summary.html` (the shipped files)
3. **Report sections third**: `report/*.md` (content that feeds into deliverables)
4. **Research files for reference only**: `research/tool-data.md`, `research/site-crawl.md` (cross-reference specific claims)
5. **Sales files**: `sales/cover-letter.md`, `sales/follow-up-emails.md`

Use Grep before deep reading:
- `Grep for "{{" in deliverables/` -- catches placeholder values
- `Grep for score values` across files -- catches mismatches quickly

---

## Scoring Thresholds and Grade Mappings

### Overall Score (out of 100)
Weighted average: AEO (25%) + Technical (25%) + Content (25%) + Local (25%)
Formula: (AEO score + Technical score + Content score + Local score) / 4 * 10

### Section Scores (1-10 scale)

| Score | Grade | Label | HTML Color |
|-------|-------|-------|------------|
| 9.0-10.0 | A+ | Excellent | #16a34a |
| 8.0-8.9 | A | Very Good | #22c55e |
| 7.0-7.9 | B+ | Above Average | #84cc16 |
| 6.0-6.9 | B | Average | #eab308 |
| 5.0-5.9 | C+ | Below Average | #f97316 |
| 4.0-4.9 | C | Needs Work | #ef4444 |
| 3.0-3.9 | D | Major Gaps | #dc2626 |
| 1.0-2.9 | F | Critical | #991b1b |

### AEO Sub-Criteria Weights
- Structured Data for AI: 15%
- Answer-Ready Content: 20%
- Entity Authority: 20%
- Topical Authority: 20%
- Citation-Worthiness: 15%
- AI Search Visibility: 10%

### Technical SEO Sub-Criteria Weights
- Site Speed (PageSpeed API): 20%
- Core Web Vitals: 15%
- TLS/SSL Security: 10%
- Meta Tags: 15%
- Heading Structure: 10%
- Schema Markup: 10%
- HTML Validity: 5%
- Crawlability: 5%
- Mobile Usability: 5%
- Image Optimization: 5%

### Content SEO Sub-Criteria Weights
- Content Depth: 20%
- Keyword Targeting: 25%
- E-E-A-T Signals: 25%
- Content Freshness: 10%
- URL Structure: 10%
- Blog/Content Marketing: 10%

### Local SEO Sub-Criteria Weights
- Google Business Profile: 25%
- NAP Consistency: 20%
- Reviews: 20%
- Citations: 15%
- Local Content: 10%
- Local Keywords: 10%

### PageSpeed Thresholds (from API data)

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| Performance Score | 90-100 | 50-89 | 0-49 |
| LCP | < 2500ms | 2500-4000ms | > 4000ms |
| CLS | < 0.1 | 0.1-0.25 | > 0.25 |
| INP | < 200ms | 200-500ms | > 500ms |
| FCP | < 1800ms | 1800-3000ms | > 3000ms |

### TLS/SSL Rating
Based on curl -v findings: TLSv1.3 + valid cert = Excellent, TLSv1.2 + valid cert = Good, TLSv1.1 or older = Needs Work, expired/self-signed = Poor, no HTTPS = Critical. SSL Labs grade included as bonus if available from cache.

### W3C Validation Scale
0 errors = Excellent, 1-5 = Good, 6-15 = Needs improvement, 16+ = Poor

---

## Required Report Structure

The report must contain these sections in this order:
1. Cover Page (built by Report Builder)
2. Executive Summary (built by Report Builder)
3. AEO Assessment (6-8 pages) -- `report/aeo-assessment.md`
4. Technical SEO Audit (8-10 pages) -- `report/technical-audit.md`
5. On-Page Content Analysis (6-8 pages) -- `report/content-analysis.md`
6. Local SEO Scorecard (4-6 pages) -- `report/local-seo-scorecard.md`
7. Competitor Comparison (3-5 pages) -- `report/competitor-comparison.md`
8. Prioritized Action Plan (2-3 pages) -- from audit-framework.md
9. Appendix (1-2 pages) -- methodology, scoring, tools, glossary

**Executive summary must lead with AEO score prominently.**

---

## Validation Checks

### 1. AEO Assessment Quality (PRIORITY)
- [ ] AI search readiness score present and justified with evidence
- [ ] Structured data assessment matches actual schema in site-crawl.md
- [ ] Answer-ready content evaluation references actual page content
- [ ] Entity authority assessment is evidence-based (checked actual directories)
- [ ] Topical authority evaluation references actual content depth
- [ ] Citation-worthiness factors specific to this business
- [ ] AEO recommendations specific, actionable, and prioritized
- [ ] AEO section is substantial (6-8 pages, not perfunctory)
- [ ] AEO scores in report match scores in audit-framework.md

### 2. Technical Accuracy (API Data Cross-Reference)
- [ ] PageSpeed scores in report match values in tool-data.md
- [ ] SSL grade in report matches SSL Labs response in tool-data.md
- [ ] W3C results reference actual errors from tool-data.md
- [ ] WHOIS/domain age data matches tool-data.md
- [ ] Meta tag findings cite actual title/description from site-crawl.md
- [ ] Schema findings accurately reflect what site-crawl.md found
- [ ] tool-data.md contains raw API data supporting report claims
- [ ] If an API failed, the report notes missing data (no fabricated numbers)

### 3. Content & Local SEO
- [ ] Keyword gap analysis specific to this business and location
- [ ] Content quality observations reference actual site pages
- [ ] E-E-A-T assessment cites specific evidence
- [ ] Local SEO observations based on actual directory/review data
- [ ] NAP consistency references specific directories checked
- [ ] Review counts and ratings reference actual platforms

### 4. Completeness
- [ ] All sections present: AEO, technical, content, local, competitor, action plan
- [ ] Executive summary leads with AEO score and findings
- [ ] Overall score + all 4 category scores present and consistent
- [ ] Action plan has 10+ recommendations with AEO actions highlighted
- [ ] Appendix includes methodology, scoring definitions, tool sources

### 5. Specificity (No Generic Content)
- [ ] Every finding references the specific client website or competitor
- [ ] No section could be copy-pasted unchanged to a different business
- [ ] Recommendations mention specific pages, elements, or content
- [ ] Follow-up emails reference specific data from this audit
- [ ] Cover letter references specific AEO findings

### 5b. Research Accuracy (No False Negatives)
- [ ] No definitive negative claims about business presence (e.g., "not listed on G2" -- should be "not found in our search of G2")
- [ ] Confidence levels used where appropriate (Confirmed / Likely / Preliminary)
- [ ] Research limitations noted in competitor analysis and AEO analysis
- [ ] Directory/platform presence claims based on direct verification, not just web search results

### 6. Score Consistency
- [ ] Scores in audit-framework.md, report sections, executive summary, and report.html all match
- [ ] Letter grades correctly mapped per scoring scale above
- [ ] Overall score calculation correct (weighted average of 4 categories)
- [ ] Score colors in HTML match the color table above

### 7. Deliverables Quality
Note: HTML design quality (layout, brief adherence, print rendering, typography) is handled by the Design Reviewer in Phase 5.7. The checks below focus on content accuracy in the HTML, not visual design.
- [ ] report.html is valid HTML with no markdown syntax remaining
- [ ] report.html has print styles (@media print, page-break rules)
- [ ] report.html uses member branding (header, footer, colors from profile)
- [ ] executive-summary.html fits one printed page
- [ ] executive-summary.html leads with AEO score prominently
- [ ] executive-summary.html includes member contact info
- [ ] No `{{PLACEHOLDER}}` values or `{{` markers in any HTML file

### 8. Cover Letter
- [ ] Written from member's perspective (first person)
- [ ] Leads with AEO finding (not traditional SEO)
- [ ] References specific data from the audit (AEO score, PageSpeed score, etc.)
- [ ] 150-250 words, no pricing
- [ ] 3 subject line options provided (AEO hook, data hook, curiosity hook)
- [ ] Focuses on a single key finding (not a summary of everything)
- [ ] Includes member contact info
- [ ] No corporate filler phrases
- [ ] Standalone file (not inside report.html)

### 9. Follow-Up Emails
- [ ] 3 emails with distinct angles (AI search, data, competitor)
- [ ] Each references specific findings from THIS audit
- [ ] 100-150 words each
- [ ] Subject lines use specific data (not generic)
- [ ] Soft CTA in each

### 10. Cross-File Consistency
- [ ] Client business name spelled consistently across all files
- [ ] Audit date consistent across all files
- [ ] Scores consistent across framework, report sections, and HTML deliverables
- [ ] Recommendations in action plan align with section recommendations
- [ ] Member branding consistent (name, email, business name)

---

## Common Failure Patterns (Grep for These)

| Pattern | What It Means | Grep Command |
|---------|--------------|--------------|
| `{{` in deliverables | Unreplaced placeholder | `Grep for "{{" in deliverables/` |
| Score mismatch | Framework says 5.4, report says 7.2 | Compare audit-framework.md scores to report sections |
| Fabricated API data | Report cites PageSpeed 85 but tool-data.md shows 67 | Cross-reference tool-data.md |
| Generic content | "Your website could benefit from..." | Look for sentences with no specific client reference |
| Missing AEO lead | Executive summary doesn't feature AEO | Check executive-summary.html opening |
| Definitive negative claim | "Not listed on [platform]" without hedging | Look for "not listed", "is not on", "doesn't appear on" in research/ and report/ |

---

## Severity Levels

- **CRITICAL**: Must fix. Fabricated data, mismatched scores, broken HTML, missing required sections, placeholder values in deliverables, AEO score not featured in executive summary.
- **IMPORTANT**: Should fix. Generic content, weak AEO analysis, inconsistent voice, missing trust signals.

Do NOT flag minor stylistic preferences. Focus on the top 5-10 most impactful issues.

---

## Outreach Tone Rules (Quick Reference)

- Cover letter: 150-250 words, first person, single finding focus, 3 subject lines, no pricing, no corporate filler
- Follow-up emails: 100-150 words each, 3 distinct angles, specific audit data in each
- Subject lines: Must reference specific data points, not generic
- Tone by niche: Professional services = formal; Home services = direct; Health = warm; Restaurants = casual
