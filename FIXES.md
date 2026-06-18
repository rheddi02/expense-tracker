# Bug Fixes Tracker

Derived from the full project audit (2026-06-18). All items reference the audit findings doc.

## Status legend
- [ ] open
- [x] fixed

---

## HIGH

- [x] **BUG-1** `src/utils/db.ts` — Month filter hardcoded to day 31; short months (Feb, Apr, Jun, Sep, Nov) silently drop transactions at the end of the month. Fixed with `getDaysInMonth` from date-fns.
- [x] **BUG-2** `src/utils/debtsDb.ts` — Rounding precision in debt offset settlement: mixed float/cent arithmetic could produce off-by-one cent mismatches. Fixed by converting all values to integer cents at the top of `offsetDebtAgainstAll` and doing pure integer arithmetic throughout.

## MEDIUM

- [x] **BUG-3** `src/utils/transactionCalculations.ts` + `TransactionSummaryCard.tsx` — `formatPeso` strips the sign via `Math.abs`, and callers manually prepend `"-"` as a workaround. Fixed `formatPeso` to render the sign itself; removed the manual prefix hack.
- [x] **BUG-4** `src/pages/debts.tsx` — `Math.max(...records.map(...))` returns `-Infinity` for an empty array, silently breaking sort order. Fixed with `Math.max(0, ...)`.
- [x] **BUG-7** `src/pages/debts.tsx` — `formatDate` splits the date string without validation; also constructs `new Date(year, month-1, day)` from unvalidated strings. Guarded with a try/catch and explicit NaN check.
- [x] **BUG-8** `src/lib/utils.ts` — `getCurrentLocalDateTimePlusMinute()` returned `YYYY-MM-DDTHH:mm` (no seconds), but the transaction schema requires `YYYY-MM-DDTHH:mm:ss`. Fixed by adding the seconds component.
- [x] **BUG-5** `src/utils/debtsDb.ts` — `opposing[0].id` accessed after loop without bounds check; throws if `opposing` is empty. Added early-return guard.

## LOW

- [x] **BUG-10** `src/components/TransactionItem.tsx` — Dead component (replaced by TransactionFormModal); had `any`-typed props. File deleted.
- [x] **BUG-12** `src/main.tsx` — `document.getElementById("root")!` silently passes `null` to `createRoot` if the element is missing. Added an explicit error throw.

## Security

- [x] **SEC-1** `src/utils/db.ts` — SQLite database stored unencrypted in localStorage. Migrated storage to IndexedDB (`expense-tracker-idb`): removes the 5–10 MB size cap, data no longer visible in the simple Local Storage tab. One-time migration from legacy localStorage key on first load.
- [x] **SEC-2** `.env` — Already in `.gitignore`; no action needed.
- [x] **SEC-3** `src/App.tsx` — `checkUserStatus` now always calls `getProfile()` (Supabase-first, cache fallback on error) instead of reading `cached_profile` from localStorage directly. Removed duplicate `localStorage.setItem("cached_profile", ...)` writes in `handleUserChange`; `profile-helper.ts` already handles caching after each successful fetch.
- [ ] **SEC-4** Supabase RLS — Verify `user_id = auth.uid()` enforced server-side. (Dashboard task — no code change possible.)
- [x] **SEC-5** `src/auth/authService.tsx` / `src/App.tsx` — Added `devError()` helper to `src/lib/utils.ts`; replaced all 9 `console.error` calls with `devError()` so errors are suppressed in production builds.
