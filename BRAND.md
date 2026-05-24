# Tempo Brand Book

**Locked: 2026-05-24.** This document is the source of truth for Tempo's identity — belief, voice, refusal, system. Any change requires a written argument, signed off in a PR, and a coordinated migration plan. Not an in-the-moment swap.

History of pivots: orange → teal (Apr 11, 2026) → navy (May 24, 2026). The cost of indecision is real. We are done pivoting.

---

## Part I — What Tempo believes

### The belief

> **Work is local. Payroll, policy, and people only make sense in the place they happen. Most software hides that complexity. Tempo was built around it.**

This is the sentence every page, screen, and conversation has to defend. If a piece of work doesn't reinforce this belief, it shouldn't ship.

### The shorter version (sticker-on-the-wall)

> *"We are not a US product that has Africa as a feature. We are an African product that has the US as a feature."*

This reorganizes every default: which currency demos use, whose payslip is the reference, where the office sits, which language onboards first.

### Why this belief is defensible

- **Product reality:** statutory engines per country, 22 locales, country-specific payroll already exist
- **Structurally unique:** US-first competitors would have to dismantle themselves to claim it
- **Customer truth:** an Accra CFO knows Tempo "gets it" within 30 seconds of seeing GRA-compliant tax filing on the home page

---

## Part II — What Tempo refuses

> **Tempo refuses American defaults.**
>
> No imperial units. No MM/DD dates. No USD-first pricing. No English-first onboarding. No California labor law as the reference implementation.
>
> Every market enters Tempo as a first-class citizen on day one — or it doesn't enter at all.

### How to use the refusal

When a feature is proposed, ask: *does this make a local market more first-class, or less?* If it makes any market less first-class, it doesn't ship in that form.

When a competitor or investor pushes you to "launch US-first and localize later," the answer is this page. Not negotiation. Not compromise.

---

## Part III — Voice

### Five principles

| # | Principle | Test |
|---|---|---|
| 1 | **Specific over abstract** | If a number, currency, or country could be added — add it |
| 2 | **Local over generic** | Would a CFO in Accra recognize the truth in this sentence? |
| 3 | **Quiet confidence over enthusiasm** | If we believe it, we don't have to shout. No exclamation marks. Ever. |
| 4 | **Acknowledge complexity** | Don't pretend payroll is simple. Tell the truth, then explain how Tempo handles it |
| 5 | **The customer is the expert** | They know their business. We provide infrastructure. Never patronize |

### Vocabulary

**Words Tempo uses:**
- *Infrastructure, run, file, close, reconcile, comply, hire, pay, retain, ship*
- Country names, currency codes, tax codes, specific durations
- Customer names (with permission)

**Words Tempo doesn't use:**
- *Empower, unleash, transform, supercharge, leverage, synergy, seamless, revolutionary*
- Generic claims with no number attached
- Exclamation marks
- "Get started!" / "Sign up today!" / "Don't miss out!"
- Em-dash-led hype phrases that could appear in any SaaS landing page

### Voice rewrites

| Generic SaaS | Tempo voice |
|---|---|
| "Empower your workforce with AI-driven insights" | "See which teams lose 6 hours a week to admin — and reclaim it" |
| "Get started in minutes!" | "Most teams have their first payroll running in 11 days. Ecobank did it in 14" |
| "Welcome to your dashboard" | "Good morning, Amara. Three things need you today" |
| "Streamline your HR workflows" | "Compliant with Ghana's GRA, Nigeria's PAYE, Kenya's NSSF. Filed automatically" |
| "Trusted by leading enterprises" | "Running payroll for 23,000 employees across 41 countries this month" |
| "Take a product tour" | "Watch Amara close her quarter in 6 minutes" |
| "Boost productivity" | "Cut your monthly close from 5 days to 2" |
| "Built for modern teams" | "Built for teams who file in 4 currencies and report to 3 regulators" |

### Voice by surface

- **Hero headlines:** declarative, present tense, specific noun
- **Empty states:** acknowledge what isn't there, offer the next step, never apologize
- **Error messages:** name the cause, name the action, never "Oops" or "Something went wrong"
- **Pricing copy:** plain numbers, plain currency switching, never "Starting at" hedges
- **Onboarding:** name the user, name the market, name the first task

---

## Part IV — Visual signature: the "Beat" system

The brand is named *Tempo*. Rhythm is the proprietary visual language.

### Wordmark

- Custom-drawn (not Inter-bold). The "o" is slightly opened on the right edge — a metronome's swing arc
- The dot is a beat marker, not a decorative full-stop
- Single weight, single size per surface. Never animated except in the loading state

### The beat divider

A signature graphic device: four narrow vertical bars at irregular weights, like a metronome's downbeat-upbeat pattern.

```
▍ ▎ ▌ ▎
```

Appears at:
- Section breaks in marketing pages
- Chapter transitions in onboarding flows
- Loading-state placeholders
- Footer credit line

Implementation: `.tempo-beat-divider` in `globals.css`.

### The beat pulse

The loading state. A 4-beat rhythm at 1.2s per cycle (Inter's natural reading cadence). Not a spinner. Three short pulses + one long.

Implementation: `.tempo-beat-pulse` in `globals.css`.

### Chart heartbeat

Every chart has a faint vertical mark every 7 units on the x-axis — a "tempo line" that gives data a measurable rhythm. People will recognize Tempo charts from a screenshot.

Implementation: chart components accept a `beatInterval` prop (default 7).

### Iconography

- 1.25px stroke weight — the considered in-between between 1px (severe) and 2px (friendly)
- Baseline grid: 4-beat (16px) — every icon sits on a multiple of 4

### When NOT to use beat motifs

- Inside dense data tables (it competes with content)
- In error states (rhythm signals confidence; an error needs stillness)
- More than once per screen above the fold (one beat marker per view is the limit)

---

## Part V — Photography

### Brief

Commissioned portraits of real African knowledge workers in real workplaces. Single subject. Considered framing. Natural daylight. No laptops-and-fist-bumps.

**Reference:** Annie Leibovitz quiet, not Getty Images noisy.

### Subjects

- A Lagos fintech CFO at her desk
- A Nairobi operations lead reviewing a tablet
- A Johannesburg HR director in a meeting
- An Accra payroll manager in their office at 7am
- An Abidjan IT lead in a server room

(Not all five must be African — but the *majority must be*, and the framing is the same regardless of geography.)

### What never appears in Tempo photography

- Stock photo "diverse teams smiling at a laptop"
- Multiple subjects forced into a single frame
- Whiteboard scenes
- Conference room handshakes
- Anyone holding a coffee cup as a personality signifier
- Soft-focus office backgrounds
- The word "team" implied through visual gimmick

### Treatment

- Single subject per frame, except where context requires (a 1-on-1 meeting, etc.)
- Natural light, often morning or late afternoon
- Subject is *doing the work*, not posing
- Color graded warm-neutral — never blue-cool corporate stock filter
- Crops respect the rule of thirds; subjects can look off-frame

---

## Part VI — Motion

### Principles

1. **Motion has tempo.** All transitions snap to multiples of 100ms (100/200/300/600/1200ms). Nothing arbitrary.
2. **Motion serves comprehension.** A panel sliding in tells you where it came from. A fade tells you it appeared from nowhere — use sparingly.
3. **Motion is restrained.** Default to no motion. Add motion only where it answers a user question ("where did that go?" "what just happened?").
4. **Easing is `cubic-bezier(0.16, 1, 0.3, 1)`** for most transitions — a calm exponential ease-out. Never spring physics. Never bounce.
5. **Loading states use the beat pulse.** Not spinners. Not skeleton shimmer.

### Forbidden

- Particle effects
- Confetti
- Parallax in hero sections
- Hover animations that move more than 2px or scale more than 1.02
- Auto-playing video in marketing pages

---

## Part VII — Pan-African positioning, made visible without decoration

The brand visual stays clean Swedish-enterprise. African positioning shows up in **content choices**, not in visual ornament. No kente patterns. No Adinkra symbols. No flag motifs.

### Where Africa shows up

| Surface | Decision |
|---|---|
| Marketing photography | Majority African subjects, real workplaces |
| Demo persona | Amara Kone (CHRO, Ecobank). Used in product screenshots and marketing copy |
| Hero copy examples | Reference Lagos, Nairobi, Accra, Johannesburg by name |
| Pricing | Local currencies first (NGN, KES, XOF, ZAR, GHS) with USD as fallback |
| Geo UI defaults | Maps centered on Africa, not Mercator-stretched USA |
| Language switcher | Prominent in top nav, not buried in settings |
| Credit line | "Built in Lagos for the work that builds tomorrow's economies." Once per page |
| Case studies | Lead with African enterprise customers |
| Statutory examples | Show GRA, PAYE, NSSF, SARS — not just IRS |

### Where Africa does NOT show up

- Color palette (stays Nordic-clean)
- Iconography (stays neutral)
- Patterns or backgrounds (none)
- Typography (Inter for now; if commissioned, a Latin face — not "Africa-inspired" anything)

The sophistication is in the *what*, not the *how*. Klarna doesn't have Swedish flags on it.

---

## Part VIII — Color system

### Primary — Tempo Navy

| Token | Hex | Tailwind | Role |
|---|---|---|---|
| `--color-tempo-50` | `#EEF5FA` | `bg-tempo-50` | Faint surface, tip-box bg |
| `--color-tempo-100` | `#D9E8F2` | `bg-tempo-100` | Hover surface |
| `--color-tempo-200` | `#B8D3E4` | `border-tempo-200` | Accented borders |
| `--color-tempo-300` | `#8DB8D1` | `text-tempo-300` | Dark-mode supporting |
| `--color-tempo-400` | `#5F98B8` | `text-tempo-400` | Dark-mode primary |
| `--color-tempo-500` | `#3F789A` | `text-tempo-500` | Mid emphasis, links |
| **`--color-tempo-600`** | **`#285B7A`** | **`bg-tempo-600`** | **Primary anchor — default for CTAs, brand mark** |
| `--color-tempo-700` | `#204B65` | `bg-tempo-700` | Secondary buttons |
| `--color-tempo-800` | `#1B3D52` | `hover:bg-tempo-800` | Primary hover |
| `--color-tempo-900` | `#142C3D` | `bg-tempo-900` | Primary active, dark surface |

### Accent — Brass

The single warm voice. Sparingly, for emphasis only.

| Token | Hex | Tailwind | Role |
|---|---|---|---|
| `--color-brass-50` | `#FBF5E9` | `bg-brass-50` | Faint warm surface |
| `--color-brass-100` | `#F5E8C9` | `bg-brass-100` | Highlight surface |
| **`--color-brass-600`** | **`#A77A32`** | **`bg-brass-600`** | **Accent anchor** |
| `--color-brass-700` | `#8A6427` | `hover:bg-brass-700` | Accent hover |

### Semantic

| Token | Hex | Role |
|---|---|---|
| `--color-success` | `#637D4B` | Positive state (Nordic muted green) |
| `--color-error` | `#B24B55` | Error state (clay red) |
| `--color-warning` | `#A7782F` | Warning state (brass-aligned) |
| `--color-info` | `#3F789A` | Info state (tempo-500) |

### Neutrals

| Token | Hex | Role |
|---|---|---|
| `--color-canvas` | `#F4F6F5` | App background |
| `--color-card` | `#ffffff` | Card surface |
| `--color-graphite` | `#121A20` | Strong text / dark surface |
| `--color-chrome` | `#111820` | Dark canvas |

---

## Part IX — Typography

- **Font family:** `Inter`, system-ui fallback. Loaded from Google Fonts (weights 300–800).
- *(Future:* commission a custom display face for headlines once budget allows. Inter for body, custom for hero. The wordmark is custom regardless.)
- **Hierarchy:** type-led (size + weight) over color contrast
- **No more than 4 sizes per screen.** If you need 5, redesign the hierarchy
- **Numbers:** use Inter's tabular-nums variant in all dashboards and pricing
- **Line height:** 1.5 for body, 1.1 for hero headlines, 1.3 for sub-headlines

---

## Part X — Radius, shadow, focus

### Radius
- `--radius-card: 7px` — cards, modals, panels
- `--radius-button: 7px` — buttons, badges
- `--radius-pill: 100px` — pills, tags
- `--radius-input: 7px` — inputs, selects, textareas

7px is the Scandinavian considered choice — softer than 4px (severe), tighter than 12px (consumer). Do not deviate per-component.

### Shadow
- `--shadow-card` — default card elevation
- `--shadow-popover` — menus, modals, command palette

Two shadows. If a component needs a third, it's the wrong component.

### Focus
- `var(--focus-ring)` — 3px navy at 18% opacity
- All interactive elements must have visible focus
- Minimum contrast: WCAG AA (4.5:1 body, 3:1 large text)
- Primary CTA (`bg-tempo-600` + white) passes AAA

---

## Part XI — Six rules that never break

1. **Never introduce a new primary color.** If you think you need one, you need a new component pattern.
2. **Never use Tailwind defaults (`teal-*`, `blue-*`, `emerald-*`).** Use `tempo-*` and `brass-*`.
3. **Never hardcode hex in component code.** Use Tailwind classes or CSS variables. Exceptions: chart palette source-of-truth files, Next.js metadata, seed data.
4. **Never pair brass with any other warm color.** Brass is the only warm voice.
5. **Never use the accent (`brass-*`) as more than ~15% of a screen.**
6. **Never gradient between primary and accent.** Navy → brass is muddy. Keep them in separate visual zones.

---

## Part XII — Migration enforcement

```bash
# Must return zero matches in src/
grep -rE "bg-teal-|text-teal-|orange-|#004D40|#00897B|#8BC34A|empower|unleash|transform your|supercharge" src/
```

Pre-commit hook (TODO): fail any new hardcoded hex outside chart palette files and `layout.tsx`.

---

## Part XIII — Decision log

| Date | Change | Rationale |
|---|---|---|
| ~2026-Q1 | Orange primary | Initial energetic positioning |
| 2026-04-11 | Orange → Teal `#004D40` | "Nature-inspired" repositioning. Mis-signaled wellness/healthcare for a payroll product |
| 2026-05-24 | Teal → Navy `#285B7A` | Trust/infrastructure positioning matches workforce-platform brief. Swedish enterprise vocabulary (Klarna, Tink, Zettle, SEB, Northvolt all live here). Single warm accent `brass #A77A32` documented |
| 2026-05-24 | Brand belief + refusal + voice locked | Moved from system-only (tokens) to brand (belief, voice, photography, motion, beat signature). The brand work begins |

Future entries to this table require a written PR and 2 reviewer sign-offs.

---

## Part XIV — What hasn't been built yet

To be honest about gaps:

- [ ] Custom wordmark (drawn, not Inter-bold-with-a-dot)
- [ ] Photography commissioned (currently using academy stock-ish images)
- [ ] Chart heartbeat lines in chart components
- [ ] Icon stroke audit (verify 1.25px across all icons)
- [ ] Local-currency pricing toggle (NGN, KES, XOF, ZAR, GHS before USD)
- [ ] African map projection in geo UI
- [ ] Language switcher promoted to top nav
- [ ] Pre-commit hook for hex enforcement
- [ ] Brand book PDF for new hires and partners

When each item ships, check it off here and link the PR.
