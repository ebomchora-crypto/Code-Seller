# Code Sellers Total App Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the exact Code Makers-derived purple visual language to every Code Sellers screen without changing business logic, data hooks, services, database access, or public route paths.

**Architecture:** Normalize design tokens and motion primitives first, then update shared UI and the persistent application shell, followed by each product domain. Preserve component props and callbacks; route composition may move to a shared authenticated layout solely so Sidebar/Header persist and route content can use `AnimatePresence`.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS 3, Motion 13, Lenis 1.3, React Router 7, Recharts, dnd-kit.

**Spec:** User-provided “PROMPT 13 (v2) — CODE SELLERS: REDESIGN TOTAL DO APLICATIVO”.

## Global Constraints

- Exact brand colors: `#0b0014`, `#2c0052`, `#5f00b2`, `#b35cff`, `#ecd6ff`.
- Sora is the display font; Inter is the body/UI font.
- Entry easing is `[0.16, 1, 0.3, 1]`.
- Every viewport reveal uses `once: true` and margin `-60px`.
- Entry animations use only transform and opacity.
- Mobile entry duration is 30% shorter and stagger is at most `0.03s`.
- Reduced motion disables Lenis and every non-status continuous animation.
- No business logic, service, database, or route URL changes.
- Keep the current `lenis` package because `@studio-freight/lenis` is its deprecated former name.
- Semantic success, warning, danger, and pipeline-stage colors remain semantic; brand purple must use the exact accent scale.

---

### Task 1: Tokens, typography, and animation foundation

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/styles/globals.css`
- Modify: `src/utils/animations.ts`
- Modify: `src/hooks/useReducedMotion.ts`
- Modify: `src/hooks/useScrollAnimation.ts`
- Modify: `src/hooks/useLenis.ts`
- Modify: `src/components/providers/SmoothScrollProvider.tsx`
- Modify: `src/components/ui/floating-paths.tsx`

**Interfaces:**
- Produces: `EASE_PREMIUM`, responsive entry variants, `useRevealOnScroll()`, `useStaggerChildren()`, and a reduced-motion-aware Lenis lifecycle.

- [ ] Normalize theme tokens to paper/ink/accent values and add global reduced-motion overrides.
- [ ] Make animation variants responsive while retaining the exact desktop timings.
- [ ] Fix Lenis lifecycle/dependencies and disable smooth touch interference on small screens.
- [ ] Replace random path timing with deterministic timing and disable path motion when reduced motion is active.
- [ ] Run `npm run lint` and `npx tsc --noEmit -p tsconfig.app.json --pretty false`.

### Task 2: Decorative components and shared UI primitives

**Files:**
- Modify: `src/components/ui/animated-counter.tsx`
- Modify: `src/components/ui/eyebrow.tsx`
- Modify: `src/components/ui/step-number.tsx`
- Modify: `src/components/ui/section-curve.tsx`
- Modify: `src/components/ui/split-panel.tsx`
- Modify: `src/components/ui/section-label.tsx`
- Modify: `src/components/ui/PageWrapper.tsx`
- Modify shared primitives in `src/components/ui/` as required for theme-safe cards, forms, overlays, states, and typography.

**Interfaces:**
- Produces: theme-safe primitives with unchanged external props, plus `AnimatedCounter` driven by Motion's `animate()`.

- [ ] Correct the five decorative components to the approved accent palette and specified behavior.
- [ ] Rebuild Modal and Drawer entry/exit with Motion, `accent-ink/40`, `AnimatePresence`, and reduced-motion support.
- [ ] Normalize Button, Card, fields, feedback states, skeletons, and tooltip surfaces.
- [ ] Run lint and typecheck.

### Task 3: Persistent shell and route transitions

**Files:**
- Modify: `src/router/index.tsx`
- Modify: `src/layouts/AppLayout.tsx`
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/Header.tsx`
- Modify: every authenticated page currently wrapping itself in `AppLayout`.

**Interfaces:**
- Produces: one persistent authenticated shell using `<Outlet />`; route URLs and guards remain unchanged.

- [ ] Move authenticated routes beneath the shared layout without changing paths.
- [ ] Add content-only `AnimatePresence mode="wait"` with 300ms fade/10px translation.
- [ ] Apply the exact logo, navigation group typography, animated active indicator, and accent-ink mobile overlay.
- [ ] Preserve theme toggle, reminder check, authentication guard, and responsive navigation behavior.
- [ ] Run lint and typecheck.

### Task 4: Dashboard

**Files:**
- Modify: `src/pages/dashboard/index.tsx`
- Modify: all files in `src/components/dashboard/`.

**Interfaces:**
- Consumes: shared counters, reveal hooks, variants, cards, and theme tokens.

- [ ] Make WelcomeBanner and metric stagger reduced-motion/mobile aware.
- [ ] Use AnimatedCounter for every metric and apply the revenue-card glow.
- [ ] Correct both chart treatments to exact accent colors and once-only reveal.
- [ ] Add capped list stagger and `accent-soft/40` hover behavior.
- [ ] Run lint and typecheck.

### Task 5: CRM, Deals, and Tasks

**Files:**
- Modify: `src/pages/crm/index.tsx`, `src/pages/crm/[id].tsx`, and visual files in `src/components/crm/`.
- Modify: `src/pages/deals/index.tsx`, `src/pages/deals/[id].tsx`, and visual files in `src/components/deals/`.
- Modify: `src/pages/tasks/index.tsx` and visual files in `src/components/tasks/`.
- Modify: `src/utils/deals.ts` only to replace the obsolete purple stage value.

**Interfaces:**
- Keeps all dnd-kit sensors, update callbacks, filters, pagination, forms, and detail actions unchanged.

- [ ] Apply Eyebrow/Sora page headers and theme-safe surfaces.
- [ ] Add scale/stagger animation to at most 15 initial cards per board without wrapping drag overlays incorrectly.
- [ ] Apply exact accent glow to dragging cards and current highlights.
- [ ] Normalize lists, forms, details, dropdowns, tags, and empty states visually.
- [ ] Run lint and typecheck.

### Task 6: Financial

**Files:**
- Modify: `src/pages/financial/index.tsx`
- Modify: all files in `src/components/financial/`.
- Modify: `src/types/financial.ts` only to replace the obsolete purple swatch.

**Interfaces:**
- Keeps transaction, receivable, category, receipt, export, and payment callbacks unchanged.

- [ ] Move all five metrics to AnimatedCounter and stagger their cards.
- [ ] Set accumulated balance to `#b35cff` and make chart/tooltips theme-safe.
- [ ] Normalize financial cards, tables, filters, forms, drawers, and modals.
- [ ] Run lint and typecheck.

### Task 7: AutoPilot permanent dark treatment

**Files:**
- Modify: `src/pages/autopilot/index.tsx`
- Modify: all files in `src/components/autopilot/`.

**Interfaces:**
- Keeps conversation, message, context, send, rename, delete, confirm, and reject callbacks unchanged.

- [ ] Establish a local accent-ink visual context independent of the global theme.
- [ ] Convert sidebar, AI messages, prompts, actions, and input to the specified glass surfaces.
- [ ] Replace the three-dot indicator with a reduced-motion-aware concentric radar.
- [ ] Remove every solid-black AutoPilot class and keep BorderBeam in the exact accent family.
- [ ] Run lint and typecheck.

### Task 8: Settings, Support, Prospection, and Auth polish

**Files:**
- Modify: `src/pages/settings/index.tsx` and all files in `src/components/settings/`.
- Modify: `src/pages/support/index.tsx` and all files in `src/components/support/`.
- Modify: `src/pages/prospection/index.tsx` and `src/components/layout/ModulePlaceholder.tsx`.
- Modify: `src/layouts/AuthLayout.tsx` and auth pages for typography/token consistency.

**Interfaces:**
- Keeps all settings persistence, uploads, integrations, support search/navigation, and authentication behavior unchanged.

- [ ] Apply display typography and Eyebrows to every settings/support section.
- [ ] Normalize settings cards/editors and cap integration stagger.
- [ ] Rebuild FAQ disclosure with a circular plus icon and transform/opacity-only content entry.
- [ ] Disable support status pulse under reduced motion.
- [ ] Polish placeholder and authentication surfaces with the same exact palette.
- [ ] Run lint and typecheck.

### Task 9: Full verification and visual audit

**Files:**
- Modify only files required to correct findings from verification.

- [ ] Run `npm run lint` and compare warnings against the recorded baseline.
- [ ] Run `npx tsc --noEmit -p tsconfig.app.json --pretty false`.
- [ ] Run `npm run build`.
- [ ] Search for obsolete `#a855f7`, `bg-black`, `bg-[#000000]`, and unapproved hard-coded brand purples.
- [ ] Search for `useInView` calls without `once: true` and continuous animations lacking reduced-motion guards.
- [ ] Start the Vite app and inspect Dashboard, CRM, Deals, Financial, Tasks, AutoPilot, Settings, Support, Prospection, and auth routes at desktop/mobile widths.
- [ ] Verify long Dashboard scrolling, persistent shell transitions, reduced motion, modals/drawers, DnD affordances, and AutoPilot's permanent dark appearance.
- [ ] Produce the requested file-by-file handoff grouped by configuration, animation, decorative components, shell, and product page.
