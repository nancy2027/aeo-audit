# /setup -- Member Customization Wizard

Walk the member through configuring their AEO & SEO Audit instance. Fills out `config/member-profile.md` with their business details, branding, service packaging, and optional API keys.

## Input: $ARGUMENTS

No arguments expected. This is an interactive wizard.

## Context Rules (MANDATORY)

Follow the Context Engineering rules in CLAUDE.md:
- This command runs directly (no agent spawning needed)
- Write the completed profile to `config/member-profile.md`

## Pipeline

### Step 1: Welcome

Tell the member:

```
Welcome to AEO & SEO Audit setup.

I'll ask you a few questions to configure your branding and preferences.
This only needs to be done once -- your settings will be used for every
audit you run.
```

### Step 2: Collect Information

Ask the member for the following information. Use AskUserQuestion where appropriate for choices. Collect in this order:

**Your Business**
1. What's your business or agency name?
2. What's your name?
3. What's your website URL?
4. What's your contact email?

**Your Niche**
5. What industry do you primarily serve? (e.g., dentists, plumbers, realtors, restaurants, general)
6. What terms do your prospects use? (niche-specific language)
7. What are the common pain points in this niche?

**Your Service Packaging**
8. What do you charge for a standalone audit report? (e.g., $500-$1,500)
9. What do you charge for audit + implementation plan? (e.g., $2,000-$3,500)
10. What do you charge for monthly AEO/SEO management? (e.g., $750-$2,000/mo)
11. What do you charge for quarterly re-audits? (e.g., $500-$1,000)

**Deliverable Branding**
12. What should the report header say? (e.g., "AEO & SEO Audit | Prepared by [Name] | [Business]")
13. What should the report footer say? (e.g., "Questions? Email [email] or schedule a call at [link]")
14. What's your primary brand color? (hex code, e.g., #2563eb)
15. What's your accent color? (hex code, e.g., #f59e0b)
16. What's your highlight color? (hex code, e.g., #10b981)

**API Keys (Optional)**
17. Do you have a Google PageSpeed API key? (Free -- get one at https://developers.google.com/speed/docs/insights/v5/get-started)
    - If yes: collect the key
    - If no: explain it's optional -- "PageSpeed works without a key at lower rate limits, which is fine for running one audit at a time. You can always add a key later by editing config/member-profile.md."

**Preferences**
18. Auto-discover competitors? (yes / no -- if no, you'll provide competitor URLs each time)
19. Include local SEO in audits? (yes / no -- some businesses are purely online)
20. Report length preference? (standard 25-35 pages / condensed 15-20 pages)

Note: AEO assessment is always included -- it's the differentiator. Not optional.

### Step 3: Write Profile

Write the completed profile to `config/member-profile.md`:

```markdown
# Member Profile

## Your Business
- Business name: [answer]
- Your name: [answer]
- Website: [answer]
- Email: [answer]

## Your Niche
- Target industry: [answer]
- Niche-specific language: [answer]
- Common pain points in this niche: [answer]

## Your Service Packaging
- Audit report (standalone) price: [answer]
- Audit + implementation plan price: [answer]
- Monthly AEO/SEO management retainer: [answer]
- Quarterly re-audit price: [answer]

## Deliverable Branding
- Report header: [answer]
- Footer: [answer]
- Primary color: [answer]
- Accent color: [answer]
- Highlight color: [answer]

## API Keys (optional)
- Google PageSpeed API key: [answer or "not provided"]

## Preferences
- Auto-discover competitors: [answer]
- Include local SEO: [answer]
- Report length preference: [answer]
```

### Step 4: Confirm

Tell the member:

```
Setup complete. Your profile is saved at config/member-profile.md.

You can edit it anytime. Run /run-audit to generate your first audit.

Note: Tool permissions are pre-configured in .claude/settings.local.json.
You won't need to approve individual tool calls during audit runs.

Tip: AEO (Answer Engine Optimization) is what makes your audits stand out.
When you reach out to prospects, lead with "I checked how your business
shows up in AI search engines like ChatGPT and Perplexity..." -- it's a
hook no one else is using.
```
