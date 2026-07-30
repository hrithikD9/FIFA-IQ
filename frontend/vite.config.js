import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replaceAll('\\', '/')

          if (!normalizedId.includes('/node_modules/')) {
            return undefined
          }

          if (
            normalizedId.includes('/node_modules/react/')
            || normalizedId.includes('/node_modules/react-dom/')
            || normalizedId.includes('/node_modules/react-router/')
            || normalizedId.includes('/node_modules/react-router-dom/')
            || normalizedId.includes('/node_modules/scheduler/')
          ) {
            return 'vendor-react'
          }

          if (normalizedId.includes('/node_modules/@supabase/')) {
            return 'vendor-supabase'
          }

          if (
            normalizedId.includes('/node_modules/lucide-react/')
            || normalizedId.includes('/node_modules/recharts/')
            || normalizedId.includes('/node_modules/chart.js/')
          ) {
            return 'vendor-ui-charts'
          }

          return 'vendor-core'
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})