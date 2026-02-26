# /run-audit -- AEO & SEO Audit Pipeline

Generate an AEO & SEO audit for a target business. Choose light mode (AEO snapshot + cold email for prospecting) or full mode (25-35 page report + executive summary + cover letter + follow-up emails).

## Input: $ARGUMENTS

If no arguments provided, ask the user for:
1. Business website URL
2. Competitor URLs (2-3, or "auto-find")
3. Target location (city/region)
4. **Mode**: Light or Full?
   - **Light**: Quick AEO snapshot + cold email (~5 min, fewer tokens). Good for initial prospecting.
   - **Full**: Complete 25-35 page report + executive summary + cover letter + emails (~15-20 min). Good for closing deals.
5. Prospect logo URL (optional, full mode only) -- used for branding the report cover page. If not provided, report will use text-only header.

## Context Rules (MANDATORY)

Follow the Context Engineering rules in CLAUDE.md:
- Do NOT read agent or skill files yourself
- Pass file PATHS to agents, not contents
- Agents write to disk directly
- You track status and file paths only

## Pipeline

### Phase 1: Input & Planning

1. Read `config/member-profile.md` for member branding/niche and optional PageSpeed API key
2. Collect from user: business URL, competitor URLs (or "auto-find"), target location (city/region)
3. Create client slug from business name (lowercase, hyphens, no special chars)
4. Create output directory: `output/<client-slug>/` with subdirs: `research/`, `strategy/`, `report/`, `design/`, `sales/`, `deliverables/`
5. Present audit plan to user:
   - Target business URL
   - Competitor strategy (provided URLs or auto-find)
   - Target location
   - What the audit will produce
   - Estimated pipeline (research > AEO analysis > strategy > report writing > design > build > outreach > quality gate)
6. Wait for user approval
7. Save plan to `output/<client-slug>/plan.md` including: business URL, competitor URLs, target location, audit date, member name, mode (light/full), PageSpeed API key (if provided), prospect logo URL (if provided, full mode only)

### Phase 2: Research (all 3 in parallel)

8. Spawn **Web Crawler** (max_turns: 18):
```
Task tool:
  description: "Crawl site via WebFetch"
  subagent_type: "general-purpose"
  max_turns: 18
  prompt: |
    You are the Web Crawler for the AEO & SEO Audit.
    Read your full instructions at: .claude/agents/web-crawler.md

    ## Your Task
    Crawl the target business URL and key pages via WebFetch to extract HTML analysis data (meta tags, headings, schema, images, crawlability).

    ## Input Files (read these yourself)
    - Plan: output/<client-slug>/plan.md

    ## Output Files (write these yourself)
    - output/<client-slug>/research/site-crawl.md

    ## Return Format
    Return ONLY:
    - Status: SUCCESS or FAILED
    - Files created: [list of paths]
    - Issues: [any problems encountered]
```

9. Spawn **API Caller** IN PARALLEL (max_turns: 15):
```
Task tool:
  description: "Call 5 free APIs"
  subagent_type: "general-purpose"
  max_turns: 15
  prompt: |
    You are the API Caller for the AEO & SEO Audit.
    Read your full instructions at: .claude/agents/api-caller.md

    ## Your Task
    Call 5 free APIs (PageSpeed, SSL Labs, W3C, Wayback, WHOIS) via Bash curl to extract real technical SEO metrics.

    ## Input Files (read these yourself)
    - Plan: output/<client-slug>/plan.md

    ## Output Files (write these yourself)
    - output/<client-slug>/research/tool-data.md

    ## Return Format
    Return ONLY:
    - Status: SUCCESS or FAILED
    - Files created: [list of paths]
    - Issues: [any problems encountered]
```

10. Spawn **Competitor Researcher** IN PARALLEL (max_turns: 12):
```
Task tool:
  description: "Research competitors"
  subagent_type: "general-purpose"
  max_turns: 12
  prompt: |
    You are the Competitor Researcher for the AEO & SEO Audit.
    Read your full instructions at: .claude/agents/competitor-researcher.md

    ## Your Task
    Find and analyze 2-3 competitors for the target business.

    ## Input Files (read these yourself)
    - Plan: output/<client-slug>/plan.md

    ## Output Files (write these yourself)
    - output/<client-slug>/research/competitor-analysis.md

    ## Return Format
    Return ONLY:
    - Status: SUCCESS or FAILED
    - Files created: [list of paths]
    - Issues: [any problems encountered]
```

11. Verify `research/site-crawl.md`, `research/tool-data.md`, and `research/competitor-analysis.md` exist

12. **Recovery**: For any missing research file:
    Re-spawn the responsible agent with max_turns: 10 and focused prompt:
    "Your previous run exhausted turns before writing output. Read your agent instructions at [path] and write output to [path] immediately. Prioritize completeness over polish."
    If still missing after retry: create a minimal placeholder noting the gap and proceed.

### Phase 2.5: AEO Analysis

11. Spawn **AEO Analyst** (max_turns: 15):
```
Task tool:
  description: "Deep-dive AEO analysis"
  subagent_type: "general-purpose"
  max_turns: 15
  prompt: |
    You are the AEO Analyst for the AEO & SEO Audit.
    Read your full instructions at: .claude/agents/aeo-analyst.md

    ## Your Task
    Produce the centerpiece AEO analysis -- a deep-dive assessment of AI search readiness.

    ## Input Files (read these yourself)
    - Plan: output/<client-slug>/plan.md
    - Site Crawl: output/<client-slug>/research/site-crawl.md
    - Tool Data: output/<client-slug>/research/tool-data.md
    - Competitor Analysis: output/<client-slug>/research/competitor-analysis.md

    ## Output Files (write these yourself)
    - output/<client-slug>/research/aeo-analysis.md

    ## Return Format
    Return ONLY:
    - Status: SUCCESS or FAILED
    - Files created: [list of paths]
    - Issues: [any problems encountered]
```

12. Verify `research/aeo-analysis.md` exists

### Mode Branch
- If `mode: light` → skip to **Phase L: Light Output** (below Phase 5.7)
- If `mode: full` → continue to Phase 3

### Phase 3: Strategy

13. Spawn **SEO Strategist** (max_turns: 15):
```
Task tool:
  description: "Synthesize audit framework"
  subagent_type: "general-purpose"
  max_turns: 15
  prompt: |
    You are the SEO Strategist for the AEO & SEO Audit.
    Read your full instructions at: .claude/agents/seo-strategist.md

    ## Your Task
    Synthesize all research into a unified audit framework with scores, keyword gaps, and prioritized action plan.

    ## Input Files (read these yourself)
    - Plan: output/<client-slug>/plan.md
    - Site Crawl: output/<client-slug>/research/site-crawl.md
    - Tool Data: output/<client-slug>/research/tool-data.md
    - Competitor Analysis: output/<client-slug>/research/competitor-analysis.md
    - AEO Analysis: output/<client-slug>/research/aeo-analysis.md

    ## Output Files (write these yourself)
    - output/<client-slug>/strategy/audit-framework.md

    ## Return Format
    Return ONLY:
    - Status: SUCCESS or FAILED
    - Files created: [list of paths]
    - Issues: [any problems encountered]
```

14. Verify `strategy/audit-framework.md` exists

### Phase 4: Report Writing

**Group A (parallel):**

15. Spawn **Report Writer** for technical-audit.md (max_turns: 20):
```
Task tool:
  description: "Write technical audit section"
  subagent_type: "general-purpose"
  max_turns: 20
  prompt: |
    You are the Report Writer for the AEO & SEO Audit.
    Read your full instructions at: .claude/agents/report-writer.md

    ## Your Assignment
    Write the Technical SEO Audit section (8-10 pages).

    ## Input Files (read these yourself)
    - Plan: output/<client-slug>/plan.md
    - Audit Framework: output/<client-slug>/strategy/audit-framework.md
    - Site Crawl: output/<client-slug>/research/site-crawl.md
    - Tool Data: output/<client-slug>/research/tool-data.md

    ## Output Files (write these yourself)
    - output/<client-slug>/report/technical-audit.md

    ## Return Format
    Return ONLY:
    - Status: SUCCESS or FAILED
    - Files created: [list of paths]
    - Issues: [any problems encountered]
```

16. Spawn **Report Writer** for content-analysis.md IN PARALLEL (max_turns: 20):
```
Task tool:
  description: "Write content analysis section"
  subagent_type: "general-purpose"
  max_turns: 20
  prompt: |
    You are the Report Writer for the AEO & SEO Audit.
    Read your full instructions at: .claude/agents/report-writer.md

    ## Your Assignment
    Write the On-Page Content Analysis section (6-8 pages).

    ## Input Files (read these yourself)
    - Plan: output/<client-slug>/plan.md
    - Audit Framework: output/<client-slug>/strategy/audit-framework.md
    - Site Crawl: output/<client-slug>/research/site-crawl.md

    ## Output Files (write these yourself)
    - output/<client-slug>/report/content-analysis.md

    ## Return Format
    Return ONLY:
    - Status: SUCCESS or FAILED
    - Files created: [list of paths]
    - Issues: [any problems encountered]
```

17. Verify Group A files exist

**Group B (parallel, after A):**

18. Spawn **Report Writer** for aeo-assessment.md (max_turns: 20):
```
Task tool:
  description: "Write AEO assessment section"
  subagent_type: "general-purpose"
  max_turns: 20
  prompt: |
    You are the Report Writer for the AEO & SEO Audit.
    Read your full instructions at: .claude/agents/report-writer.md

    ## Your Assignment
    Write the AEO Assessment section (6-8 pages). THIS IS THE LEAD SECTION -- the most important part of the report.

    ## Input Files (read these yourself)
    - Plan: output/<client-slug>/plan.md
    - Audit Framework: output/<client-slug>/strategy/audit-framework.md
    - AEO Analysis: output/<client-slug>/research/aeo-analysis.md
    - Site Crawl: output/<client-slug>/research/site-crawl.md

    ## Output Files (write these yourself)
    - output/<client-slug>/report/aeo-assessment.md

    ## Return Format
    Return ONLY:
    - Status: SUCCESS or FAILED
    - Files created: [list of paths]
    - Issues: [any problems encountered]
```

19. Spawn **Report Writer** for local-seo-scorecard.md IN PARALLEL (max_turns: 20):
```
Task tool:
  description: "Write local SEO scorecard"
  subagent_type: "general-purpose"
  max_turns: 20
  prompt: |
    You are the Report Writer for the AEO & SEO Audit.
    Read your full instructions at: .claude/agents/report-writer.md

    ## Your Assignment
    Write the Local SEO Scorecard section (4-6 pages).

    ## Input Files (read these yourself)
    - Plan: output/<client-slug>/plan.md
    - Audit Framework: output/<client-slug>/strategy/audit-framework.md
    - Competitor Analysis: output/<client-slug>/research/competitor-analysis.md
    - Site Crawl: output/<client-slug>/research/site-crawl.md

    ## Output Files (write these yourself)
    - output/<client-slug>/report/local-seo-scorecard.md

    ## Return Format
    Return ONLY:
    - Status: SUCCESS or FAILED
    - Files created: [list of paths]
    - Issues: [any problems encountered]
```

20. Verify Group B files exist

**Group C (after A+B):**

21. Spawn **Report Writer** for competitor-comparison.md (max_turns: 20):
```
Task tool:
  description: "Write competitor comparison"
  subagent_type: "general-purpose"
  max_turns: 20
  prompt: |
    You are the Report Writer for the AEO & SEO Audit.
    Read your full instructions at: .claude/agents/report-writer.md

    ## Your Assignment
    Write the Competitor Comparison section (3-5 pages). This section needs all other analysis for side-by-side comparison.

    ## Input Files (read these yourself)
    - Plan: output/<client-slug>/plan.md
    - Audit Framework: output/<client-slug>/strategy/audit-framework.md
    - Competitor Analysis: output/<client-slug>/research/competitor-analysis.md
    - AEO Analysis: output/<client-slug>/research/aeo-analysis.md
    - All other report sections: output/<client-slug>/report/technical-audit.md, content-analysis.md, aeo-assessment.md, local-seo-scorecard.md

    ## Output Files (write these yourself)
    - output/<client-slug>/report/competitor-comparison.md

    ## Return Format
    Return ONLY:
    - Status: SUCCESS or FAILED
    - Files created: [list of paths]
    - Issues: [any problems encountered]
```

22. Verify all 5 report files exist in `report/`

### Phase 4.5: Design

23. Spawn **Report Designer** (max_turns: 15):
```
Task tool:
  description: "Create report design brief"
  subagent_type: "general-purpose"
  max_turns: 15
  prompt: |
    You are the Report Designer for the AEO & SEO Audit.
    Read your full instructions at: .claude/agents/report-designer.md

    ## Your Task
    Create a visual design brief for the branded PDF audit report.

    ## Input Files (read these yourself)
    - Audit Framework: output/<client-slug>/strategy/audit-framework.md
    - Site Crawl: output/<client-slug>/research/site-crawl.md
    - Member Profile: config/member-profile.md

    ## Output Files (write these yourself)
    - output/<client-slug>/design/report-brief.md

    ## Return Format
    Return ONLY:
    - Status: SUCCESS or FAILED
    - Files created: [list of paths]
    - Issues: [any problems encountered]
```

24. Verify `design/report-brief.md` exists

### Phase 5: Report Build

25. Spawn **Report Builder** (max_turns: 30):
```
Task tool:
  description: "Build HTML report and emails"
  subagent_type: "general-purpose"
  max_turns: 30
  prompt: |
    You are the Report Builder for the AEO & SEO Audit.
    Read your full instructions at: .claude/agents/report-builder.md

    ## Your Task
    Build the full HTML report, one-page executive summary, and follow-up email sequence.

    ## Input Files (read these yourself)
    - Design Brief: output/<client-slug>/design/report-brief.md
    - Audit Framework: output/<client-slug>/strategy/audit-framework.md
    - All report sections: output/<client-slug>/report/ (all 5 .md files)
    - Member Profile: config/member-profile.md
    - Plan: output/<client-slug>/plan.md

    ## Output Files (write these yourself)
    - output/<client-slug>/deliverables/report.html
    - output/<client-slug>/deliverables/executive-summary.html
    - output/<client-slug>/sales/follow-up-emails.md

    ## Return Format
    Return ONLY:
    - Status: SUCCESS or FAILED
    - Files created: [list of paths]
    - Issues: [any problems encountered]
```

26. Verify all deliverable files exist

### Phase 5.5: Cover Letter

27. Spawn **Cover Letter Writer** (max_turns: 10):
```
Task tool:
  description: "Write cover letter"
  subagent_type: "general-purpose"
  max_turns: 10
  prompt: |
    You are the Cover Letter Writer for the AEO & SEO Audit.
    Read your full instructions at: .claude/agents/cover-letter-writer.md

    ## Your Task
    Write a personalized outreach letter leading with AEO findings.

    ## Input Files (read these yourself)
    - Member Profile: config/member-profile.md
    - Plan: output/<client-slug>/plan.md
    - Audit Framework: output/<client-slug>/strategy/audit-framework.md
    - AEO Analysis: output/<client-slug>/research/aeo-analysis.md

    ## Output Files (write these yourself)
    - output/<client-slug>/sales/cover-letter.md

    ## Return Format
    Return ONLY:
    - Status: SUCCESS or FAILED
    - Files created: [list of paths]
    - Issues: [any problems encountered]
```

28. Verify `sales/cover-letter.md` exists

### Phase 5.7: Design Review

29. Spawn **Design Reviewer** (max_turns: 15):
```
Task tool:
  description: "Review HTML deliverable design quality"
  subagent_type: "general-purpose"
  max_turns: 15
  prompt: |
    You are the Design Reviewer for the AEO & SEO Audit.
    Read your full instructions at: .claude/agents/design-reviewer.md

    ## Your Task
    Review all HTML deliverables for visual quality, layout correctness, design brief adherence, and print rendering.

    ## Input Files (read these yourself)
    - Design Brief: output/<client-slug>/design/report-brief.md
    - Report HTML: output/<client-slug>/deliverables/report.html
    - Executive Summary HTML: output/<client-slug>/deliverables/executive-summary.html
    - Member Profile: config/member-profile.md

    ## Return Format
    Return:
    ## DESIGN REVIEW: APPROVED (or NEEDS FIXES)
    [If NEEDS FIXES: list specific issues with file paths and CSS/HTML fixes needed]
    [If APPROVED: one-line summary per file]
```

30. If **APPROVED**: proceed to Phase 6 (Quality Gate).
31. If **NEEDS FIXES**: Re-spawn **Report Builder** with the Design Reviewer's specific feedback. Include the issues in the re-spawn prompt so the builder knows what CSS/HTML to fix. Max 1 design iteration. Then re-run Design Review once more. If still failing, note remaining design issues and proceed to Quality Gate.

### Phase L: Light Output (light mode only)

Reached via Mode Branch after Phase 2.5. Produces quick cold-outreach assets.

L1. Spawn a **general-purpose** agent (max_turns: 15) to write AEO snapshot:
```
Task tool:
  description: "Write AEO snapshot for light mode"
  subagent_type: "general-purpose"
  max_turns: 15
  prompt: |
    You are writing a concise AEO snapshot for cold outreach.

    ## Your Task
    Read the research files and produce a punchy 800-word-max AEO snapshot.

    ## Structure
    # AEO Snapshot: [Business Name]
    ## AI Search Readiness: [Score]/10
    [2-3 sentence summary]
    ## Top Findings
    1. [Finding with specific evidence from research]
    2. [Finding with specific evidence]
    3. [Finding with specific evidence]
    ## Quick Wins
    1. [Actionable recommendation with specifics]
    2. [Actionable recommendation]
    3. [Actionable recommendation]
    ## vs. Competitors
    [One key competitive insight from competitor-analysis.md]

    ## Input Files (read these yourself)
    - Plan: output/<client-slug>/plan.md
    - Site Crawl: output/<client-slug>/research/site-crawl.md
    - Tool Data: output/<client-slug>/research/tool-data.md
    - Competitor Analysis: output/<client-slug>/research/competitor-analysis.md
    - AEO Analysis: output/<client-slug>/research/aeo-analysis.md

    ## Output Files (write these yourself)
    - output/<client-slug>/sales/aeo-snapshot.md

    ## Return Format
    Return ONLY:
    - Status: SUCCESS or FAILED
    - Files created: [list of paths]
    - Issues: [any problems encountered]
```

L2. Spawn **Cover Letter Writer** (max_turns: 10) for cold email:
```
Task tool:
  description: "Write cold outreach email"
  subagent_type: "general-purpose"
  max_turns: 10
  prompt: |
    You are the Cover Letter Writer for the AEO & SEO Audit (light mode).
    Read your full instructions at: .claude/agents/cover-letter-writer.md

    ## Your Task
    Write a cold outreach email (150-250 words) with 3 subject lines.
    Lead with the single strongest AEO finding.

    ## IMPORTANT: LIGHT MODE DIFFERENCES
    - Say "I ran a quick AEO check" NOT "I put together a complete audit"
    - Reference the AEO snapshot, not a 25-page report
    - CTA: "I can put together a full analysis if you're interested"

    ## Input Files (read these yourself)
    - Member Profile: config/member-profile.md
    - Plan: output/<client-slug>/plan.md
    - AEO Analysis: output/<client-slug>/research/aeo-analysis.md

    ## Output Files (write these yourself)
    - output/<client-slug>/sales/cold-email.md

    ## Return Format
    Return ONLY:
    - Status: SUCCESS or FAILED
    - Files created: [list of paths]
    - Issues: [any problems encountered]
```

L3. Verify `sales/aeo-snapshot.md` and `sales/cold-email.md` exist.

L4. Generate `output/<client-slug>/README.md`:
```markdown
# Light Mode Audit: [Business Name]

## Files
| File | Description |
|------|-------------|
| `sales/aeo-snapshot.md` | AEO summary with score, top findings, quick wins |
| `sales/cold-email.md` | Cold outreach email with 3 subject line options |

## Research Data (saved for full mode upgrade)
| File | Description |
|------|-------------|
| `research/site-crawl.md` | Site crawl analysis |
| `research/tool-data.md` | API data (PageSpeed, TLS, W3C, WHOIS, Wayback) |
| `research/competitor-analysis.md` | Competitor research |
| `research/aeo-analysis.md` | AEO deep-dive analysis |

## Next Steps
1. Review the cold email and AEO snapshot
2. Send the cold email to the prospect
3. If they respond: run `/run-audit` in full mode -- research data is already here and can be referenced
```

L5. Report results:
```
Light mode audit complete for [Business Name].

Files: output/<client-slug>/
- Cold email: sales/cold-email.md (copy into your email client)
- AEO snapshot: sales/aeo-snapshot.md (attach to email or reference in conversation)

Next steps:
1. Review and send the cold email
2. If the prospect responds, run /run-audit in full mode for the complete package
```

L6. STOP -- do NOT continue to Phase 3 or beyond.

### Phase 6: Quality Gate (MANDATORY)

32. Spawn **Quality Reviewer** (model: opus, max_turns: 25):
```
Task tool:
  description: "Quality gate review"
  subagent_type: "general-purpose"
  model: "opus"
  max_turns: 25
  prompt: |
    You are the Quality Reviewer (QAS) for the AEO & SEO Audit.
    Read your full instructions at: .claude/agents/quality-reviewer.md

    ## Your Task
    Review ALL output files for quality, accuracy, completeness, and AEO depth.

    ## Files to Review (read these yourself)
    - All research files: output/<client-slug>/research/
    - Audit framework: output/<client-slug>/strategy/audit-framework.md
    - All report sections: output/<client-slug>/report/
    - Design brief: output/<client-slug>/design/report-brief.md
    - All deliverables: output/<client-slug>/deliverables/
    - All sales files: output/<client-slug>/sales/
    - Member profile: config/member-profile.md
    - Plan: output/<client-slug>/plan.md

    ## Return Format
    Return ONLY:
    ## QAS REVIEW: APPROVED (or BLOCKED)
    [If BLOCKED: list specific issues with file paths]
    [If APPROVED: one-line summary per file]
```

33. If APPROVED: proceed to Phase 7
34. If BLOCKED: re-spawn relevant agent(s) with QAS feedback. Include the specific issues in the re-spawn prompt. Max 2 iterations.

### Phase 7: Output

35. Verify all files exist:
    - `output/<client-slug>/plan.md`
    - `output/<client-slug>/research/site-crawl.md`
    - `output/<client-slug>/research/tool-data.md`
    - `output/<client-slug>/research/competitor-analysis.md`
    - `output/<client-slug>/research/aeo-analysis.md`
    - `output/<client-slug>/strategy/audit-framework.md`
    - `output/<client-slug>/report/aeo-assessment.md`
    - `output/<client-slug>/report/technical-audit.md`
    - `output/<client-slug>/report/content-analysis.md`
    - `output/<client-slug>/report/local-seo-scorecard.md`
    - `output/<client-slug>/report/competitor-comparison.md`
    - `output/<client-slug>/design/report-brief.md`
    - `output/<client-slug>/deliverables/report.html`
    - `output/<client-slug>/deliverables/executive-summary.html`
    - `output/<client-slug>/sales/cover-letter.md`
    - `output/<client-slug>/sales/follow-up-emails.md`

36. Generate `output/<client-slug>/README.md` with table of contents and delivery checklist

37. Report results to user:
```
Audit complete for [Business Name].

Files: output/<client-slug>/

Deliverables:
- Full report (25-35 pages): deliverables/report.html (open in browser > Print > Save as PDF)
- Executive summary (1 page): deliverables/executive-summary.html (open > Print > PDF)
- Cover letter: sales/cover-letter.md
- Follow-up emails: sales/follow-up-emails.md

Next steps:
1. Open report.html in a browser and print to PDF
2. Open executive-summary.html and print to PDF
3. Copy cover-letter.md into your email client
4. Send the cover letter + executive summary PDF to the prospect
5. Use the follow-up emails at 3, 7, and 14 days
6. When they reply, send the full report PDF
```
