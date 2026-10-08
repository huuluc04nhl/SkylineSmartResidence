# SKYLINE SMART RESIDENCE — AGENT INSTRUCTIONS & CODING STANDARDS

> This document defines the engineering standards, architecture rules, and design philosophy for all AI coding agents working on **Skyline Smart Residence**.

---

## 1. The Ponytail Engineering Doctrine (Code Minimalism)
* **The 7-Step Ladder:** Before writing any new logic, stop at the first rung that satisfies the requirement:
  1. *YAGNI:* Delete or omit anything not strictly requested.
  2. *Reuse:* Use existing helpers in `lib/` and existing components in `components/`.
  3. *Stdlib:* Use built-in JavaScript/TypeScript APIs.
  4. *Platform Native:* Use standard HTML5/CSS features instead of installing packages.
  5. *Existing Deps:* Check `package.json` before proposing any new dependency.
  6. *One-Liner:* Keep logic clear, idiomatic, and compact.
  7. *Minimal Code:* Write the least amount of code necessary.
* **Preserve Reliability:** Never sacrifice validation, error handling, accessibility, or security for brevity.

---

## 2. Taste & Impeccable Design Standards (Anti-Slop Luxury)
* **Zero Border-Radius Project-Wide:**
  - Every component, button, badge, modal, input, card, and floating container MUST use `rounded-none`.
  - The only exception is small geometric circular status dots (e.g. `w-1.5 h-1.5 rounded-full` or `rounded-none`).
* **Luxury Color Tokens:**
  - Obsidian Base: `#0A0E14`
  - Dark Surface: `#0E131B`
  - Elevated Container: `#141B24`
  - Warm Gold Accent: `#C5A880` (Hover: `#E2C9A5` or `white`)
  - Status Indicators: Emerald `#10B981`, Amber `#F59E0B`, Rose `#F43F5E`
* **Frosted Glass (Glassmorphism):**
  - Use `backdrop-blur-xl` combined with semi-transparent surfaces (e.g. `bg-[#0E131B]/75 border border-[#C5A880]/30`) for floating elements and tooltips.
* **Anti-Slop Prohibitions:**
  - NO generic SaaS purple-to-blue gradients.
  - NO cards nested inside cards without clear functional hierarchy.
  - NO pure black `#000000` or low-contrast gray text on dark backgrounds.
* **Mobile & Tablet Responsiveness:**
  - Mobile (<640px): Full-sheet overlays with `100dvh`, thumb-friendly tap targets (min 40px), safe-area bottom padding.
  - Tablet (640px–1024px): Max width 365px for floating widgets so 65%+ of the screen remains visible and interactable.

---

## 3. Graphify Architecture & State Management
* **State Stores (`lib/`):**
  - `dataStore.ts`: Authentication, user profiles, apartment codes (`CH-06`, etc.), and role access (`ADMIN`, `TECHNICIAN`, `OWNER`, `TENANT`).
  - `billingStore.ts`: Monthly utility bills, VNPay QR integration, and payment history.
  - `ticketStore.ts`: NKS technical service requests, technician assignment, status tracking.
  - `facilityStore.ts`: Amenity booking (BBQ, pool, gym, sauna VIP).
  - `visitorStore.ts`: QR passes and guest PIN codes.
* **Hydration Safety:** Always check `typeof window !== 'undefined'` before accessing `localStorage` in browser-only stores.

---

## 4. Domain & Terminology Consistency
* Use accurate terminology:
  - Tòa nhà: The Tropical (BS-07, BS-08, BS-09, BS-10) thuộc phân khu Beverly Solari.
  - Khái niệm: Dùng đúng thuật ngữ "Chung cư" và "Căn hộ".
  - Hotline kỹ thuật: 1900 8899 (Hỗ trợ 24/7).
