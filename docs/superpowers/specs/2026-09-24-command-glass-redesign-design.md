# Code Sellers — Command Glass redesign

**Date:** 2026-09-24  
**Status:** Approved  
**Scope:** Complete dark-only visual, structural, interaction, and responsive refactor of the existing CRM without changing its business rules, persistence model, or route contracts.

## Product intent

Code Sellers should feel like a focused commercial command center built by Code Makers: cinematic at first contact, calm during sustained work, and precise wherever the user manipulates data. The product should inherit the current Code Makers identity—deep red, near-black, warm white, Sora, Inter, sculptural light, and restrained glass—without copying the marketing site literally.

The experience is dark-only. Red is a controlled signal for identity, primary actions, selection, and focus. It is not used as a blanket fill for every surface. Dense operational surfaces remain stable and legible.

## Experience principles

1. **Decision before decoration.** Each page reveals the most important decision or action first.
2. **Glass is a layer, not a texture applied everywhere.** Navigation, overlays, contextual controls, and selected highlight surfaces may blur. Tables and long forms use more opaque dark panels.
3. **One product, one grammar.** Page headers, filters, list/kanban switches, cards, tables, drawers, dialogs, empty states, and loading states share a common system.
4. **Depth through contrast.** Layered blacks, hairline borders, soft inner highlights, subtle red illumination, and restrained shadows replace heavy gradients and excessive glow.
5. **Motion explains state.** Transitions last roughly 150–300 ms, prefer transform and opacity, and respect reduced-motion preferences.
6. **Accessibility is structural.** Visible focus, semantic labels, keyboard-safe overlays, readable contrast, sufficient targets, and non-color status cues are required.

## Information architecture

The persistent application shell is organized as a commercial cockpit:

- **Visão geral:** Dashboard
- **Relacionamento:** CRM, Prospecção
- **Vendas:** Negócios, Financeiro
- **Operação:** Tarefas, AutoPilot
- **Sistema:** Configurações, Suporte

The sidebar is a floating glass rail on desktop and an off-canvas drawer on narrow screens. The header is compact and contextual: breadcrumb/location, optional contextual controls, notifications, and profile. It does not duplicate the page title.

Every operational page follows the same hierarchy:

1. eyebrow/context;
2. title and supporting metric;
3. primary and secondary actions;
4. filters/view controls;
5. main work surface;
6. relevant empty, error, loading, or restricted state.

Master/detail experiences separate on mobile instead of compressing two dense panels side by side.

## Visual system

### Color roles

- `canvas`: near-black with a subtle warm red undertone;
- `surface-1`: primary work surface;
- `surface-2`: elevated cards and grouped controls;
- `surface-glass`: translucent navigation/overlay material;
- `border-subtle`: cool white at low opacity;
- `border-strong`: stronger white edge for focus/elevation;
- `text-primary`: warm white;
- `text-secondary`: cool light gray;
- `text-muted`: medium gray that still meets contrast requirements;
- `accent`: Code Makers deep red;
- `accent-bright`: brighter red for focus and active feedback;
- semantic success, warning, danger, and info colors remain distinct from brand red.

The existing purple system is removed from the product UI. The existing light-mode branch and theme toggle are removed. `color-scheme: dark` is set globally.

### Typography

- **Sora:** product mark, page titles, major metrics, and short high-emphasis headings.
- **Inter:** controls, forms, tables, body copy, metadata, and navigation.
- Numeric columns and KPI values use tabular numerals.
- Titles are compact and confident; body text remains practical and avoids landing-page scale inside operational screens.

### Materiality

- one cinematic ambient canvas behind the shell;
- sidebar/header: translucent, blurred, highlighted edge;
- cards: low-transparency dark fill with a fine border and modest shadow;
- tables/forms: mostly opaque for sustained readability;
- drawers/modals/dropdowns: elevated glass with a stronger backdrop;
- small noise/grain overlay at very low opacity;
- red radial illumination appears only around important focal areas.

### Shape and spacing

- major panels: 16–20 px radius;
- controls: 10–12 px radius;
- pills only for compact statuses, toggles, and intentional CTA treatments;
- consistent 4/8 px spacing rhythm;
- desktop content maximum width remains generous enough for CRM tables and kanban boards.

## Component system

The redesign consolidates the following reusable primitives:

- application shell and ambient background;
- page heading/action row;
- glass panel and stable data panel;
- buttons and icon buttons;
- inputs, selects, textareas, switches, and search controls;
- segmented view switcher;
- filter toolbar and active filter chips;
- table shell, sortable header, pagination, and responsive card fallback;
- metric cards, status badges, avatars, and progress indicators;
- drawer, modal, confirmation dialog, tooltip, dropdown, and toast;
- skeleton, spinner, empty state, error state, and no-results state.

Lucide icons are used consistently instead of scattered inline SVG implementations. Icon-only buttons always include accessible names and tooltips where their meaning is not obvious.

## Page behavior

### Authentication

Login, registration, and password recovery use a cinematic Code Makers red atmosphere with a concise brand statement and a stable dark glass form. On mobile, the form becomes the primary focus and decorative material recedes.

### Dashboard

The dashboard begins with an operational briefing, then KPI cards, revenue/pipeline visualizations, recent records, and activity. Metrics avoid redundant card chrome. Chart tooltips and axes use the dark system and semantic color roles.

### CRM and deals

CRM and Deals share the same heading, filter, view switcher, list, kanban, pagination, drawer, and confirmation grammar. Tables remain tables on wide screens. Narrow screens use intentional record cards. Kanban columns provide stable horizontal scrolling and clear drag feedback.

### Detail pages

Contact and deal records use a clear identity/summary block, contextual actions, business metadata, related records, and chronological activity. Destructive actions are visually separated from frequent actions.

### Tasks

Task list and kanban adopt the same operational framework. Priority, due date, reminder, status, subtasks, and linked entities stay visually distinguishable without relying on color alone.

### Financial

Cash position, inflow, outflow, receivables, and exceptions are prioritized above transaction history. Currency values use tabular numerals. Transaction and receivable forms retain all current capabilities.

### AutoPilot

AutoPilot remains the most immersive module but uses the common shell and tokens. Conversation navigation, message surfaces, context badges, proposed actions, and confirmation states clearly distinguish AI suggestion from executed action.

### Settings and support

Settings uses a sticky internal section navigation and compact grouped forms. Support keeps its information hierarchy but adopts the common tab, search, accordion, status, and contact surfaces.

### Prospecção

The existing placeholder remains a placeholder. It receives the new product treatment but no new business behavior is invented.

## Responsive behavior

- desktop: floating sidebar, compact header, multi-column dashboards, wide tables and kanban;
- tablet: collapsible rail, reduced gaps, preserved data hierarchy;
- mobile: off-canvas navigation, stacked page actions, horizontally scrollable segmented controls only when necessary, record-card alternatives for tables, and full-width drawers;
- touch targets aim for 44 px where space permits and never fall below accessible minimums;
- safe-area insets are respected for fixed navigation and overlays.

## Motion and interaction

- control feedback: 120–180 ms;
- panels, drawers, and route surfaces: 180–300 ms;
- easing is shared through motion tokens;
- list rows do not receive large stagger animations;
- hover effects are supplementary and never required for understanding;
- `prefers-reduced-motion` disables nonessential transforms, ambient paths, smooth scrolling, and long transitions.

## Accessibility and overlay contract

All interactive controls have visible `:focus-visible` states. Drawers and modals trap focus, close on Escape, restore focus to the trigger, expose an accessible title, and lock background scrolling. Forms retain persistent labels, field errors are connected to controls, and color is not the only status cue.

## Data and error handling

Existing hooks, Supabase services, models, routes, uploads, imports, exports, and CRUD behavior remain intact. The UI explicitly distinguishes:

- initial loading;
- background refresh;
- empty dataset;
- empty filtered result;
- recoverable error;
- destructive-action pending state;
- read-only or unavailable capability.

## Verification strategy

The implementation is verified through:

- focused source-level tests for shared design behavior and route contracts;
- existing unit tests;
- TypeScript production build;
- lint;
- visual inspection at approximately 1440 px, 390 px, and 320 px where practical;
- keyboard navigation, focus visibility, overlays, overflow, and reduced-motion checks;
- confirmation that business service signatures and route topology are unchanged.

## Non-goals

- changing database schema or Supabase policies;
- introducing new CRM functionality;
- fabricating data or converting Prospecção into a working module;
- rewriting service and hook logic solely for visual reasons;
- reproducing the marketing website inside the application.
