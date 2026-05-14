# Theme Color Unification (Free = Pro) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the free tier use the same primary theme color as the pro tier across the whole site.

**Architecture:** Stop overriding `--primary` and `--ring` at runtime based on `isProMode`. Keep `pro-mode` class toggling for pro-only visual flourishes, but keep the base theme variables controlled by CSS (`:root` / `.dark`).

**Tech Stack:** React (Vite), TypeScript, Tailwind + CSS variables.

---

## File Map

**Modify**
- [store.tsx](file:///workspace/artifacts/teamspirit/src/lib/store.tsx#L186-L198) — remove runtime overrides of `--primary`/`--ring`, keep `pro-mode` class toggle

---

### Task 1: Remove Runtime Theme Variable Overrides

**Files:**
- Modify: [store.tsx](file:///workspace/artifacts/teamspirit/src/lib/store.tsx#L186-L198)

- [ ] **Step 1: Update the “Pro mode CSS vars” effect**

Replace the current effect body with:

```ts
  useEffect(() => {
    if (!state) return;
    if (state.isProMode) {
      document.documentElement.classList.add('pro-mode');
    } else {
      document.documentElement.classList.remove('pro-mode');
    }
  }, [state?.isProMode]);
```

Important:
- Do not set `--primary` or `--ring` via `style.setProperty`.
- Leave `pro-mode` toggling intact.

- [ ] **Step 2: Typecheck**

Run:

```bash
pnpm -C /workspace/artifacts/teamspirit typecheck
```

Expected:
- Exit code 0

---

### Task 2: Manual Visual Verification

**Files:**
- None (manual verification)

- [ ] **Step 1: Run the dev server**

Run:

```bash
PORT=3000 pnpm -C /workspace/artifacts/teamspirit dev
```

- [ ] **Step 2: Verify free vs pro theme behavior**

Check:
- Using a free account, primary buttons / focus rings appear green (same as pro).
- Using a pro account, theme color remains the same, and pro-only flourishes remain (elements under `.pro-mode`).

---

## Plan Self-Review

- Spec coverage: removes the only code path that makes free theme “grey”, while preserving `pro-mode` class for pro-only styling.
- Placeholder scan: none.
- Type consistency: no API changes, only DOM style toggling.

