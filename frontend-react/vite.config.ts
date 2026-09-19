import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Restrict dependency pre-bundling's HTML scan to the real entry point -
  // unrelated reference-material folders living alongside this project
  // (Transitions/, Components/, Icons/) otherwise get crawled too.
  optimizeDeps: {
    entries: ['index.html'],
  },
})
