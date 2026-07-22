import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
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

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found in document");

createRoot(rootEl).render(
  <StrictMode>
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="expense-tracker-theme"
      disableTransitionOnChange
    >
      <App />
    </ThemeProvider>
  </StrictMode>,
);
