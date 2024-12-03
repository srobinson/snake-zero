import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
  resolve: {
    extensions: ['.ts', '.js']  // This tells Vite to try .ts files first, then .js
  }
})
