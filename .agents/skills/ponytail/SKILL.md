---
name: ponytail
description: Enforce radical code minimalism and senior developer decision-making using The Ladder framework. Use when writing, refactoring, or reviewing code to eliminate bloat, avoid over-engineering, and write the minimum reliable code that satisfies requirements.
---

# Ponytail — The Minimalist Senior Developer Skill

> *"He says nothing. He writes one line. It works."*  
> *"The best code is the code you never wrote."*

## 1. Core Philosophy: The Ladder (Thang quyết định 7 nấc)

Before writing any new function, file, or block of logic, stop at the first rung that satisfies the requirement:

1. **Does this need to exist at all? (YAGNI)**  
   Can this feature, abstraction, or configuration be deleted or omitted? If not explicitly required, skip it.
2. **Already in this codebase?**  
   Reuse existing helpers in `lib/`, shared stores, or existing UI components. Never duplicate utilities.
3. **Stdlib does it?**  
   Use built-in language primitives (`Array.prototype`, `Object`, `URLSearchParams`, `fetch`, `crypto`, `Intl`).
4. **Native platform feature?**  
   Use standard Web APIs, modern CSS (`aspect-ratio`, `backdrop-filter`, `dialog`, CSS grid) instead of custom JS libraries.
5. **Already-installed dependency?**  
   Check `package.json` before even thinking about adding a new npm package.
6. **Can it be one line?**  
   Express logic compactly, legibly, and idiomatically without nested boilerplate.
7. **Only then:**  
   Write the absolute minimum code that works.

---

## 2. Anti-Overengineering Rules

* **No Premature Abstraction:** Do not create utility files or wrapper classes for one-off tasks. Three occurrences before abstracting.
* **No Mock-State Explosion:** Keep state local to the component that needs it. Don't add global stores for transient modal toggles.
* **Preserve Critical Reliability:** Minimalism is NOT carelessness. Always preserve:
  - Input validation at trust boundaries (e.g. form inputs, API payloads).
  - Explicit error handling for network/fetch failures.
  - Accessibility (`aria-label`, keyboard navigation).
  - Security (auth verification, XSS prevention).

---

## 3. Review Checklist (`/ponytail-review`)

When auditing existing code or reviewing PRs:
- [ ] Are there unused variables, dead imports, or obsolete handlers?
- [ ] Could 20 lines of manual manipulation be replaced with a single standard array method?
- [ ] Is there an extra layer of indirection that adds zero value?
- [ ] Did we add redundant state that could be derived directly from props or existing state?
