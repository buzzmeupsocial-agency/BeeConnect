---
name: buzzconnect-design
description: MANDATORY design system for any BuzzConnect work — dashboards, client-facing product screens, KPIs, charts, tabs, status indicators. Load and follow this on EVERY task that touches BuzzConnect UI, without being asked. For marketing assets (posts, ads, carousels) use the sibling buzzmeup-design skill instead — never mix the two.
user-invocable: true
---

## Always apply this, unmentioned
Whenever you build, edit, or extend any BuzzConnect screen — a new tab, a new card, a bug fix, a redesign — apply the rules below by default, even if the request doesn't mention "design system" or "BuzzConnect". Do not ask whether to follow it; it is the only approved visual language for this product. If a request conflicts with a rule here, flag the conflict instead of silently breaking the rule.

## Before writing any code
1. Read `readme.md` in this folder (product context + rationale).
2. Read `../Moodboard BuzzConnect.dc.html` (visual reference).
3. Reuse `tokens/index.css` — never hardcode a hex color, font-family, spacing value, or border-radius that already has a token. If a new value is genuinely needed, add it as a token here first, don't inline it.
4. Reuse the components in `components/` (KpiCard, TabBar, BarChart, StatusDot) instead of rebuilding the same pattern inline. Extend a component (add a prop) rather than forking it into a one-off.

## Hard rules (do not deviate without asking)
- Orange (`--bc-action-primary`) = action/highlight only (CTAs, active projection value). Never an active-nav-state color, never a large fill.
- Active tab/nav state = solid black (`--bc-text-primary`), not orange.
- Stinger = page/tab titles only. Never on KPI values, table cells, or small labels.
- All numeric values (KPIs, tables, chart labels) = Basic Sans 700, not Poppins (Poppins is marketing-only, for social post stats).
- Chart series colors: series 1 = orange, series 2 = purple, in that order, consistently across the product.
- Status color meaning is fixed: green = positive/on-track, orange = warning, red = negative — never reuse these for anything else.
- Page background `#F1F0ED`, cards white on `#D8D3CC` border. No photography, no marketing motifs (arrow/rings/dot-grid) in product UI.
- Icons: simple single-color stroke icon set (e.g. Lucide/Phosphor) only — no emoji, no multi-color icons.

## When something isn't covered
If a screen needs a pattern not in `components/` (e.g. a table, a modal, a form), design it using the tokens and hard rules above, then add it to `components/` with a `.jsx` + `.d.ts` + `.prompt.md` following the existing files' format, so the next task reuses it instead of re-solving it.

## Scope boundary
This skill governs BuzzConnect (client dashboard) only. Marketing deliverables (Instagram posts, ads, carousels) belong to the sibling `buzzmeup-design` skill and use different rules (orange can fill backgrounds, Poppins for stat numbers, marketing motifs allowed). Never apply BuzzConnect rules to marketing work or vice versa.
