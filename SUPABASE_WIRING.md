# Supabase Integration Wiring Guide

## Step 1: Environment Setup

1. Copy `.env.example` to `.env.local`
2. Get your Supabase project URL and anon key from Supabase dashboard
3. Add them to `.env.local`:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Step 2: Create Supabase Tables & RLS

1. Go to Supabase dashboard → SQL Editor
2. Click "New Query"
3. Paste contents of `supabase.sql`
4. Run the query

This creates the `transactions` table with Row Level Security enabled. Only users can access their own rows.

## Step 3: Install Dependencies

```bash
npm install @supabase/supabase-js
```

(Already in package.json, just make sure it's installed)

---

## Step 4: Wire Auth in App Entry

Edit `src/main.tsx`:

```typescript
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { setupSyncListeners } from "./db/syncService";

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Service worker registration failed:', error);
    });
  });
}

// Set up sync listeners (for online/offline events)
setupSyncListeners();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

---

## Step 5: Wire Auth & Sync in App.tsx

At the **top** of the component (after imports):

```typescript
import { useEffect, useState } from "react";
import { getCurrentUser, onAuthStateChange } from "./auth/authService";
import { syncOnLoad, syncToSupabase } from "./db/syncService";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ... other state ...

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
      setIsLoading(false);
    });

    // Sync on load if authenticated
    syncOnLoad();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    // Show login page here (to be created)
    return <LoginPage />;
  }

  // Rest of app...
}
```

---

## Step 6: Add user_id to Transactions

When adding a transaction, include the user ID.

In `handleAddTransaction` (App.tsx), change:

**Before:**

```typescript
const handleAddTransaction = async (data: TransactionFormValues) => {
  await addTransaction({
    type: data.type,
    amount: Number(data.amount),
    categoryId: data.categoryId,
    date: data.date,
    note: data.note,
  });
  // ...
};
```

**After:**

```typescript
const handleAddTransaction = async (data: TransactionFormValues) => {
  await addTransaction({
    user_id: user?.id, // ADD THIS
    type: data.type,
    amount: Number(data.amount),
    categoryId: data.categoryId,
    date: data.date,
    note: data.note,
  });

  // Sync after adding transaction
  await syncToSupabase(); // ADD THIS

  // Reload transactions
  const updatedTransactions = await getTransactions();
  setTransactions(updatedTransactions);
};
```

---

## Step 7: Same for Edit & Delete

In `handleEditTransaction`:

```typescript
const handleEditTransaction = async (data: TransactionFormValues) => {
  if (editingTransaction) {
    await updateTransaction(editingTransaction.id, {
      user_id: user?.id, // ADD THIS
      type: data.type,
      amount: Number(data.amount),
      categoryId: data.categoryId,
      date: data.date,
      note: data.note,
    });

    await syncToSupabase(); // ADD THIS

    const updatedTransactions = await getTransactions();
    setTransactions(updatedTransactions);
    setEditingTransaction(undefined);
  }
};
```

In the delete toast callback:

```typescript
onClick: async () => {
  await deleteTransaction(transaction.id);
  await syncToSupabase(); // ADD THIS

  const updatedTransactions = await getTransactions();
  setTransactions(updatedTransactions);
  // ...
};
```

---

## Step 8: Wire Logout to Clear Local DB

Update `handleClearData` or create a logout handler that calls `signOut()`:

```typescript
import { signOut } from "./auth/authService";

const handleLogout = async () => {
  await signOut(); // This clears local DB + signs out
  // UI will re-render due to onAuthStateChange
};
```

---

## Step 9: Create Login Page (Next Steps)

You'll need to create a login UI that calls:

- `signInWithGoogle()`
- `signInWithEmail(email, password)`
- `signUpWithEmail(email, password)`
- `forgotPassword(email)`

Example skeleton:

```typescript
import { signInWithGoogle, signInWithEmail } from "../auth/authService";

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Google login failed:", error);
    }
  };

  return (
    <div>
      <button onClick={handleGoogleLogin}>Sign in with Google</button>
      {/* Email form... */}
    </div>
  );
}
```

---

## Summary

1. ✅ `.env.local` created with credentials
2. ✅ `supabase.sql` run in Supabase dashboard
3. ✅ `authService.ts` handles all auth flows
4. ✅ `syncService.ts` handles push/pull with Supabase
5. ✅ `db.ts` updated with `user_id` and `synced` columns
6. ✅ `main.tsx` calls `setupSyncListeners()`
7. ✅ `App.tsx` listens to auth state with `onAuthStateChange()`
8. ✅ All transaction handlers add `user_id` and call `syncToSupabase()`
9. ✅ Logout clears local DB via `signOut()`

---

## Testing

1. **Offline**: Add transaction → app saves locally with `synced=0`
2. **Online**: Transaction syncs to Supabase → `synced=1` locally
3. **Multiple devices**: Log in on another device → transactions sync down from Supabase
4. **Logout**: Local DB clears, then re-login → Supabase transactions reload
