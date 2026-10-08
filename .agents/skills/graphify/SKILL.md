---
name: graphify
description: Architectural knowledge graph and dependency analysis skill. Helps agents navigate complex codebase relationships, trace data stores to UI components, identify central God Nodes, and preserve data integrity across modifications.
---

# Graphify — Codebase Knowledge & Dependency Mapping

> *"Know what connects to what before changing a single line of code."*

## 1. Architectural Map of Skyline Smart Residence

```
┌────────────────────────────────────────────────────────┐
│                   App Layer (Next.js)                  │
│       app/portal/page.tsx  &  app/page.tsx             │
└──────────┬───────────────────────────────┬─────────────┘
           │                               │
┌──────────▼────────────────────┐ ┌────────▼──────────────┐
│       Resident Portal         │ │      Admin / Tech     │
│   components/portal/resident/ │ │ components/portal/adm/│
│   - SmartHomeHub.tsx          │ │ - AdminDashboard.tsx  │
│   - ResidentHome.tsx          │ │ - KanbanBoard.tsx     │
│   - ResidentTickets.tsx       │ │ - BillingStudio.tsx   │
│   - ResidentFacilities.tsx    │ │ - EkycApproval.tsx    │
└──────────┬────────────────────┘ └────────┬──────────────┘
           │                               │
┌──────────▼───────────────────────────────▼──────────────┐
│                  Shared UI Components                   │
│   components/portal/shared/                             │
│   - AiConciergeFloating.tsx  (Trợ lý ảo nổi)            │
│   - Topbar.tsx               (Header + Search)          │
│   - Sidebar.tsx              (Điều hướng trái)          │
└──────────┬───────────────────────────────┬──────────────┘
           │                               │
┌──────────▼───────────────────────────────▼──────────────┐
│                    Data & State Layer                   │
│   lib/                                                  │
│   - dataStore.ts         (God Node: Users & Auth)       │
│   - billingStore.ts      (Hóa đơn & Biểu phí)           │
│   - ticketStore.ts       (Phiếu kỹ thuật NKS)           │
│   - facilityStore.ts     (Đặt lịch tiện ích)            │
│   - visitorStore.ts      (Mã QR khách thăm)             │
│   - themeContext.tsx     (Chủ đề tối / sáng)            │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Core Inspection Rules

1. **Watch Out for "God Nodes":**
   - `lib/dataStore.ts` and `app/portal/page.tsx` are central nodes. Modifications here propagate across almost all resident and administrative views.
2. **Store Hydration Verification:**
   - Client stores check `typeof window !== 'undefined'` before reading `localStorage`.
   - Never perform synchronous server-side writes to browser stores.
3. **Trace Impact Radius:**
   - Before modifying a data type or store method in `lib/`, search all importing components to prevent breaking interfaces.
