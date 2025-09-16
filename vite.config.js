// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/Y-S/',     // <-- REQUIRED for GitHub Pages under scprime.github.io/Y-S/
  plugins: [react()],
})
