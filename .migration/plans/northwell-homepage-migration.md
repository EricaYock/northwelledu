# Northwell.edu Migration Plan

Migrate https://www.northwell.edu to this AEM Edge Delivery Services project — starting with the homepage, then discovering and covering other page templates. Reuse and adapt the existing WKND block library where possible, creating new variants only when the Northwell content genuinely needs them.

**Status: Approved and execution-ready.** Switching modes is a control you toggle in the UI — I can't flip it from here. Once you're in Execute mode, send a message (e.g. "start") and I'll begin Phase 1 immediately.

## Scope & Approach

- **Target site:** https://www.northwell.edu (healthcare site)
- **Pages:** Homepage first, then template discovery across the site for broader coverage
- **Block strategy:** Map Northwell content onto existing blocks (`hero`, `cards`, `columns`, `featured-article`, `editorial-index`, `gallery`, `faq-list`, `ticker`, `team-profile`, `header`, `footer`, `fragment`), adding new variants only where content demands it
- **Design tokens:** Adapt `styles/styles.css` `:root` tokens to Northwell's palette/typography where reuse would look wrong; keep the token-based system intact
- **Git:** No git operations at any point (per project rules — handled via Console UI)

## Execution Order

Start with **Phase 1** (scrape + analyze the homepage), then pause to confirm the block-to-content mapping before building anything in Phase 2+.

## Checklist

### Phase 1 — Discovery & Analysis
- [ ] Scrape the Northwell homepage (content, images, metadata, cleaned HTML)
- [ ] Run site scope / template discovery to identify distinct page types (URLs grouped into templates)
- [ ] Analyze homepage structure: sections, section styles, content sequences, and block candidates
- [ ] Survey the existing 12-block inventory and map each Northwell section to a reusable block or flag it as needing a new variant
- [ ] Capture Northwell design tokens (colors, fonts, spacing) and compare against current `styles.css` tokens

### Phase 2 — Block & Design Adaptation
- [ ] Confirm block-to-content mapping with findings (which blocks reused as-is, which need new variants)
- [ ] Create/adjust any required block variants following existing patterns (variant CSS selectors, semantic region classes per AGENTS.md conventions)
- [ ] Adapt design tokens in `styles/styles.css` `:root` for Northwell branding (only where reuse is visually incorrect)
- [ ] Run `npm run lint` and fix any issues (remember: unquoted font-family names)

### Phase 3 — Import Infrastructure
- [ ] Add/adjust block parsers in `tools/importer/parsers/` for Northwell block variants
- [ ] Update `BLOCK_REGISTRY` and section-style detection in `tools/importer/import.js` / `wknd-sections.js` (content-driven detection — no URL/positional assumptions)
- [ ] Update `tools/importer/urls.txt` with the homepage URL (with explicit `.html` path where required) and any template representative URLs
- [ ] Bundle the import script: `npx esbuild tools/importer/import.js --bundle --format=iife --global-name=CustomImportScript --platform=browser --outfile=tools/importer/import.bundle.js`

### Phase 4 — Content Import
- [ ] Run the bulk importer for the homepage via `run-bulk-import.js`
- [ ] Verify generated `content/*.plain.html` structure (sections, blocks, images folder)
- [ ] Import nav and footer content if migrating header/footer for Northwell

### Phase 5 — Preview & Visual Verification
- [ ] Preview the imported homepage in the local dev server and inspect DOM structure via snapshot/evaluate
- [ ] Visually compare rendered result against the original Northwell homepage; iterate on CSS/parsers to close gaps
- [ ] Verify responsive behavior (mobile/tablet/desktop breakpoints at 600/900/1200px)
- [ ] Confirm no console errors and images render correctly (EDS `<picture>` gotcha for imgs in `<p>`)

### Phase 6 — Additional Templates (after homepage is solid)
- [ ] For each discovered template, repeat analysis → mapping → parser → import → verify
- [ ] Ensure import infrastructure handles all templates without page-specific hardcoding

## Open Questions / Notes
- Northwell is a healthcare site with likely different components (find-a-doctor search, service line cards, location finder). Some may not map cleanly to WKND blocks and will need new variants — this will surface during Phase 1 analysis.
- Final decision on how far to adapt design tokens vs. keep WKND styling will be confirmed once the design comparison in Phase 1 is complete.

---
*Plan is ready. I'm still in Plan mode on my side — toggle Execute mode in the UI, then send any message to kick off Phase 1. I'll pause after the block-mapping step for your confirmation before building anything.*
