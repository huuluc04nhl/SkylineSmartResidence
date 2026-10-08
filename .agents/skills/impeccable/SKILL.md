---
name: impeccable
description: Quality assurance and design system enforcement skill inspired by Paul Bakaus's Impeccable framework. Use for design audits, polish passes, typography fixes, contrast/accessibility validation, and edge case hardening.
---

# Impeccable — Design Engineering & Quality Verification

> *"Durable product truth in PRODUCT.md, design system consistency in DESIGN.md, and ruthless attention to detail."*

## 1. Core Workflow Commands

| Command | Action |
|:---|:---|
| `/impeccable audit` | Run technical quality checks: responsive breakpoints, contrast ratios, a11y attributes, keyboard tab indices. |
| `/impeccable polish` | Final design system alignment check: verify font tokens, border radius consistency, and active states. |
| `/impeccable critique` | UX review: evaluate visual hierarchy, information scanability, and emotional resonance. |
| `/impeccable harden` | Edge cases: test long strings, empty states, error fallbacks, and mobile keyboard obstruction. |
| `/impeccable distill` | Strip away decorative fluff and keep only the functional essence of an element. |
| `/impeccable bolder` | Strengthen weak or timid designs (improve contrast, punchier typography, clearer call-to-actions). |
| `/impeccable quieter` | Tone down visually noisy or over-decorated sections. |

---

## 2. Deterministic Quality Rules for Skyline

1. **Border Radius Rule:**
   - Strict `rounded-none` everywhere. Never introduce `rounded-md`, `rounded-lg`, `rounded-full` (except for small indicator status dots where explicitly geometric).
2. **Color Contrast Rule:**
   - Text on `#0E131B` or `#141B24` must use at least `text-gray-300` or `#C5A880`. Never place un-contrasted dark gray text on dark surfaces.
3. **Responsive Viewport Rule:**
   - Every interactive component must be tested for Mobile (375px), Tablet (768px), and Desktop (1280px+).
4. **State Completeness Rule:**
   - Every interactive button must have 4 explicit visual states: Default, Hover, Active, and Disabled.
