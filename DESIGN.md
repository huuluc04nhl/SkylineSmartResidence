# DESIGN.md — Design System & Visual Guidelines: Skyline Smart Residence

## 1. Visual Identity & Atmosphere
* **Aesthetic:** Modern Architectural Luxury, High-Tech Minimalist Dark Mode.
* **Border Radius:** `0px` (`rounded-none`) unconditionally across buttons, cards, dialogs, inputs, floating widgets, and images.

## 2. Color Palette & Surface Hierarchy
* **Deep Obsidian (Base):** `#0A0E14` (Page background)
* **Dark Surface (Layer 1):** `#0E131B` (Sidebar, Header, Main Cards)
* **Elevated Surface (Layer 2):** `#141B24` (Subcards, Modal Headers, Active items)
* **Deep Well (Layer 3):** `#16202D` (Chips, Input fields, Code blocks)
* **Gold Accent (Brand):** `#C5A880` / `#B59569` (CTA buttons, highlight titles, active icons)
* **Gold Light (Hover):** `#E2C9A5` / `#FFFFFF`
* **Status Colors:**
  - Emerald: `#10B981` (Online, Success, Paid)
  - Amber: `#F59E0B` (Pending, Warning)
  - Rose: `#F43F5E` (Emergency, Unpaid, Error)

## 3. Glassmorphism & Frosted Effects
* Floating widgets (such as `AiConciergeFloating`) use `backdrop-blur-xl` with semi-transparent tinted backgrounds (`bg-[#0E131B]/75`), subtle border glows (`border-[#C5A880]/30`), and ambient shadows.

## 4. Typography
* **Heading / Luxury Serifs:** `font-serif` (Playfair Display)
* **UI / Body Text:** `font-sans` (Plus Jakarta Sans)
* **Codes / Apartment Badges / Timestamps:** `font-mono`
