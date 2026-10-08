---
name: taste-design
description: Frontend aesthetic curation and anti-slop framework. Guides UI creation to achieve bespoke, luxury aesthetics tailored to the product's identity, avoiding generic AI templates, cliché gradients, and repetitive card patterns.
---

# Taste Design — The Anti-Slop Frontend Framework

> *"Don't build generic SaaS templates. Build interfaces with character, deliberate typography, and tailored rhythm."*

## 1. Section 0: Brief & Persona Inference

Before writing any HTML/CSS:
1. **Identify Persona & Purpose:**
   - For Skyline: High-end luxury residential living, smart building management, European architectural elegance (The Tropical / Beverly Solari).
2. **Define Tone & Atmosphere:**
   - Deep obsidian backgrounds (`#0A0E14`, `#0E131B`), brushed gold accents (`#C5A880`, `#B59569`), emerald status accents (`#10B981`), frosted glass surfaces (`backdrop-blur-xl`).
3. **Audit Against AI Slop:**
   - ❌ NO generic purple-to-blue gradients.
   - ❌ NO rounded-square icon tiles centered above every heading.
   - ❌ NO nesting cards inside cards inside cards.
   - ❌ NO pure un-tinted black (`#000000`) or generic low-contrast gray text on dark backgrounds.
   - ❌ NO default uncurated browser fonts (use Playfair Display for serif headings + Plus Jakarta Sans for UI text).

---

## 2. Configuration Dials (Scale 1–10)

For Skyline Smart Residence, the standard dial settings are:

* **`DESIGN_VARIANCE = 7` (High Character & Brand Individuality)**:
  - Strict zero border radius (`rounded-none`). Crisp, architectural edges reminiscent of luxury skyscrapers.
  - Asymmetric and responsive grid layouts instead of predictable 3-column cookie-cutter cards.
* **`MOTION_INTENSITY = 4` (Restrained, Premium Micro-Interactions)**:
  - Subtle fades, smooth opacity transitions, elegant glowing ambient blur (`blur-sm`).
  - No cartoonish bouncing or elastic easing.
* **`VISUAL_DENSITY = 7` (Refined High-Information Layout)**:
  - Clean data presentation for IoT controls, smart lock pins, and billing records without excessive dead space.

---

## 3. Responsive Principles for Mobile & Tablet

* **Mobile (< 640px):**
  - Full-sheet overlays (`fixed inset-0 h-[100dvh]`) for complex floating widgets (e.g. Chatbot).
  - Minimum touch target 40px x 40px.
  - Safe-area bottom padding (`pb-[max(0.75rem,env(safe-area-inset-bottom))]`).
* **Tablet (640px – 1024px):**
  - Sidebars collapse smoothly to icon rails or responsive drawers.
  - Corner widgets occupy max 360px width to keep 65%+ of the viewport interactable.
