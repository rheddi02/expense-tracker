import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path";
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [react(), tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Expense Tracking',
        short_name: 'Expenses',
        theme_color: '#0f172a',
        icons: [
          {
            src: '/expense.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/expense.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: '/expense-tracker/',
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
  build: {
    target: 'esnext',
  },
})
