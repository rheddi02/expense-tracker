# Project Reference — Expense Tracker PWA

> Last updated: 2026-06-18 (rev 2)

An offline-first Progressive Web App for personal expense and debt tracking. Financial data lives in a local SQLite database (via sql.js / IndexedDB) and syncs bidirectionally to Supabase when online. The app is designed for single-user or small household use, works fully without internet, and includes a role-based admin panel for multi-user deployments.

---

## Table of Contents

1. [Current Features](#1-current-features)
2. [Scope](#2-scope)
3. [Known Limitations](#3-known-limitations)
4. [Nice-to-Haves](#4-nice-to-haves)

---

## 1. Current Features

### 1.1 Dashboard

- **Summary cards** — total income, total expense, and net balance across all recorded transactions
- **Today's report** — income, expense, and net for the current calendar day
- **Category breakdown chart** — pie chart of expense distribution by category with preset date filters: Today, This Week, This Month, Custom Range; shows top categories by spend with percentage labels (Recharts)
- **Recent transactions** — 5 most recent entries with category, amount, and date
- **Quick-add shortcuts** — "+ Income" and "+ Expense" buttons open the transaction form pre-typed to the correct type
- **Pull-to-refresh** — swipe down on mobile to trigger a manual sync

---

### 1.2 Transactions (Income & Expense)

- **Full CRUD** — add, edit, delete transactions
- **Fields**: type (income / expense), amount (₱), category, date + time, note (max 200 chars)
- **Dynamic categories** — users can add, rename, reorder (↑/↓), and delete their own categories from the Profile page. 14 defaults are seeded on first run. 4 system categories (Debt Collection, Debt Payment, Loan Given, Loan Received) are locked and cannot be edited or deleted.
  - Default expense: Food, Transport, Bills, Shopping, Materials, Others, Debt Payment, Loan Given
  - Default income: Sales, Salary, Freelance, Gift, Debt Collection, Loan Received
- **Filtering**:
  - By category (dropdown)
  - By note keyword (text search)
  - By date: presets (Today, Yesterday, This Week, This Month, All) + custom date range calendar picker
- **Summary card** — filtered totals for income / expense / net + transaction count
- **Virtual scrolling** — large lists render efficiently via TanStack Virtual
- **Soft-delete** — records marked `deleted=1` and synced to cloud as deletions (prevents orphaned cloud records)

---

### 1.3 Debt / Money Tracker

- **Track lent and borrowed money** per person
- **Fields**: person name, amount (₱), type (lent / borrowed), category (cash / digital), borrow date, optional due date, note
- **Grouped by person** — net balance shown per person (owed to you / you owe / even), with avatar initial and colour coding
- **Per-person accordion** — expands to show all individual debt records for that person
- **Status badges**: Overdue (past due date), Due (upcoming due date), Paid, Offset
- **Debt actions**:
  - **Mark as paid** — full settlement; for cash-category debts, automatically creates a corresponding income/expense transaction in the ledger
  - **Offset** — net two opposing debts between the same person (e.g. you lent ₱500 and borrowed ₱200 → offset leaves ₱300 net lent). Distributes offset proportionally across multiple opposing records. Tracks partial progress with `settled_amount` and shows a progress line under the record.
  - **Edit** — update any field on an unsettled debt
  - **Delete** — soft-delete with cloud sync
- **Summary cards** — total outstanding lent (owed to you) and borrowed (you owe)
- **Filter** — All / Lent / Borrowed pills
- **Name search** — filter grouped list by person name

---

### 1.4 Profile

- Displays avatar, display name, and email (sourced from Supabase)
- **Account status badge** — Approved / Pending / Blocked
- **Online/offline indicator** — live connection status
- **Manage Categories** — opens a bottom sheet to add, rename, reorder, and delete transaction categories
- **Manual sync** — triggers bidirectional push + pull to/from Supabase
- **Clear all data** — deletes local SQLite contents (with sonner confirmation toast)
- **Logout** — with confirmation toast
- Cached profile shown when offline so the page still renders

---

### 1.5 Authentication

- **Google OAuth** — primary sign-in flow; redirects to `/expense-tracker/auth/callback`
- **Email + password** — sign-in and sign-up
- **Forgot password** — sends a reset email with a link to `/expense-tracker/reset-password`
- **Password update** — used in the reset flow after clicking the email link
- **Session management** — handled by Supabase Auth SDK; tokens stored by the SDK
- **Fast cold start** — auth user cached in `localStorage["cached_user"]`; app shows immediately without waiting for a network round-trip
- **Offline mode** — app is fully functional without any login; data remains local-only

---

### 1.6 Cloud Sync (Supabase)

- **Bidirectional**: push unsynced local records → Supabase; pull all user records ← Supabase
- **Synced tables**: transactions, debts, categories
- **Auto-sync** — triggered on login and whenever the device comes back online
- **Manual sync** — accessible from the Profile page
- **Sync tracking** — `synced` (0/1) and `deleted` (0/1) flags on every record
- **Conflict resolution** — last-write-wins via SQL `INSERT OR REPLACE` on record `id`
- **Multi-user isolation** — all records scoped to `user_id`; local data cleared on user switch
- **Offline profile cache** — `cached_profile` in localStorage for offline display only (not used as source of truth for security decisions)

---

### 1.7 Admin Panel _(role: admin only)_

- **Dashboard tab**:
  - User stats: total / pending / approved / blocked counts (stat cards)
  - User growth chart — registrations per day over the last 30 days (line chart)
  - Role distribution — admin vs. user count (pie chart)
- **Users tab**:
  - Data table listing all users: email, name, status, role, created date
  - Individual user drawer with full profile details
  - Per-user actions: approve, block, change role (admin ↔ user)
  - Bulk actions across selected users
- **Settings tab**:
  - **Maintenance mode** — toggle to lock out all non-admin users (triggers signout on their next auth check)
  - **Registration enabled** — toggle to open/close new user sign-ups
  - Settings saved to Supabase

---

### 1.8 PWA

- **Service worker** — auto-update strategy via vite-plugin-pwa / Workbox
- **App manifest** — name, short name, icons (192×192 and 512×512 PNG), theme colour `#0f172a`
- **Offline capability** — full read/write via local SQLite (IndexedDB-backed); sync queued until online
- **Install prompt** — browser install banner on mobile ("Add to Home Screen")
- **SQL WASM bundled locally** — `sql-wasm.wasm` served from `/public/` (no CDN dependency)
- **Base path** — deployed at `/expense-tracker/` subpath

---

## 2. Scope

### In scope
- Personal or small household expense tracking
- Offline-first: internet is never required; cloud is optional backup
- Philippine Peso (₱) as the sole currency
- Local SQLite (IndexedDB) as source of truth; Supabase as cloud sync target
- Simple categorical analytics — no forecasting or machine learning
- Debt tracking: lending, borrowing, net settlement, and offsetting between two parties
- Admin tooling for managing a small group of users in a shared deployment

### Out of scope _(not planned, not designed for)_
- Multi-currency or foreign exchange
- Investment, portfolio, or asset tracking
- Tax reporting, accounting compliance, or double-entry bookkeeping
- Receipt scanning / OCR
- Bank or e-wallet integrations (no Open Banking / Plaid)
- Shared / collaborative accounts (e.g. family with simultaneous edits)
- Push notifications (no FCM / APNs wiring)
- Importing data from other apps (CSV/OFX ingest)
- End-to-end encryption of Supabase cloud data

---

## 3. Known Limitations

| Area | Limitation | Impact |
|---|---|---|
| **Storage cap** | IndexedDB quota varies by browser (~50 MB–unlimited on desktop; ~300 MB on iOS Safari with eviction risk) | Heavy use over years could hit limits; no size warning shown |
| **Sync conflicts** | Last-write-wins; no merge or CRDT logic | Data loss possible when editing the same record on two devices simultaneously (rare for single user) |
| **Sync atomicity** | Transactions and debts sync in separate passes, not in one DB transaction | A mid-sync failure leaves records in a mixed synced/unsynced state |
| ~~**Fixed categories**~~ | ~~14 categories hardcoded in `src/lib/constants.ts`~~ | _Resolved — categories are now user-manageable via Profile page_ |
| **Single currency** | No currency field on any record; ₱ assumed everywhere | Cannot track expenses in USD, EUR, etc. |
| **Date/timezone** | Dates stored as local date strings with no timezone metadata | Records created near midnight may show the wrong date if device timezone changes |
| **Offline admin** | Admin panel makes direct Supabase calls; no local cache | Admin features are unavailable without internet |
| **Sync pagination** | Full table pull on every sync (no cursor or incremental fetch) | Sync slows down noticeably with thousands of records |
| **No test suite** | Zero automated tests (no Vitest, Jest, Playwright, or Cypress) | Regressions caught only through manual testing |
| **Debt history** | Only the current `settled_amount` is stored; no per-payment log | Cannot reconstruct when or how much was partially settled over time |
| **No conflict UI** | Sync conflicts resolved silently; user never notified | A Supabase record silently overwrapping a local edit is invisible |
| **First login needs internet** | Google OAuth and email sign-up require a network connection | Cannot create or authenticate an account while offline |
| **Two-tier roles only** | admin / user with no sub-roles | Cannot grant partial admin access (e.g. view-only admin) |

---

## 4. Nice-to-Haves

### Core UX

| Feature | Description |
|---|---|
| ~~**Custom categories**~~ | ~~Let users create, rename, reorder, and delete categories. Persist in SQLite + Supabase alongside the default 14.~~ | _Implemented — see §1.2 and §1.4_ |
| **Recurring transactions** | Schedule a fixed income or expense on a daily / weekly / monthly cadence. Auto-insert the record on its due date. |
| **Undo delete** | Show a Sonner toast with an Undo action for ~5 seconds before the record is actually deleted. Already using Sonner — low effort. |
| **Dark mode** | `next-themes` is already installed. Wire up a theme toggle in the Profile or header and add dark-mode CSS variable values. |
| **Transaction attachments** | Attach a receipt photo to a transaction. Store in Supabase Storage, reference via URL on the record. |
| **Bulk delete** | Checkbox multi-select on the transactions list; delete selected batch. |
| **Duplicate transaction** | Long-press or context menu to copy an existing transaction as a pre-filled new one. |

---

### Budget & Goals

| Feature | Description |
|---|---|
| **Monthly budget per category** | Set a ₱ spending cap per expense category. Dashboard shows a mini progress bar per category. Alert when near/over. |
| **Savings goal** | Set a target amount and a target date. Dashboard shows progress (current net vs. target). |
| **Spending alerts** | Local browser notification (Notification API) when a budget limit is reached or a debt is overdue. |

---

### Debt Improvements

| Feature | Description |
|---|---|
| **Debt payment history** | Store each partial payment as a separate log entry (date, amount, note) instead of overwriting `settled_amount`. Show a timeline in the debt drawer. |
| **Debt reminders** | Badge counter on the Debts tab and an optional local notification when a debt's due date is approaching (e.g. 3 days before). |
| **Multi-currency debts** | Per-debt currency field + manual exchange rate. Display original amount and ₱ equivalent. |
| **Debt photo** | Attach an IOU photo or screenshot to a debt record (Supabase Storage). |

---

### Analytics

| Feature | Description |
|---|---|
| **Monthly trend chart** | Line chart of income vs. expense over the last 6 or 12 months. Already have Recharts wired up — primarily a data query + chart config task. |
| **Net worth / running balance** | Cumulative balance chart from first transaction to today (income − expense over time). |
| **Category drill-down** | Click a pie slice to navigate to the transactions list pre-filtered to that category and date range. |
| **Year-in-review** | Annual summary card: total income, total expense, savings rate, largest expense category, month with highest spend. |
| **Export to CSV / JSON** | Button in Profile or a new Export page. Generates and downloads a flat file of all transactions and/or debts. |

---

### Technical

| Item | Description | Priority |
|---|---|---|
| **Test suite** | Vitest unit tests for `db.ts`, `debtsDb.ts`, `transactionCalculations.ts`, Zod schemas, `dateFilters.ts`, and sync logic. Highest ROI improvement for long-term stability. | High |
| **Sync cursor / incremental pull** | Add an `updated_at` column; pull only records where `updated_at > last_sync_timestamp`. Eliminates full-table scans. | High |
| **IndexedDB AES-GCM encryption** | Encrypt the SQLite export with a non-extractable `CryptoKey` stored in IndexedDB before writing. Protects data at rest on shared devices. | Medium |
| **Error monitoring** | Integrate Sentry (or LogRocket) for production runtime errors. Pair with `devError()` already in place. | Medium |
| **Sync conflict UI** | When a pull overwrites a locally-modified record, show a toast or diff view letting the user choose which version to keep. | Medium |
| **Remove unused React Query** | `@tanstack/react-query` is in `package.json` but never imported anywhere in `src/`. Remove it — saves ~50 KB from the bundle. | Low |
| **Lazy-load admin panel** | Wrap `AdminPage` in `React.lazy()` + `Suspense`. The entire admin chunk is never needed for regular users. | Low |
| **Background Sync API** | Use the Service Worker Background Sync API to queue and replay writes when the app tab is closed but the device regains connectivity. | Low |
| **CSV / OFX import** | Parse a bank export file, map columns to transaction fields, show a preview before importing. | Low |
