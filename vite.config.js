import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        spaceExplorer: resolve(__dirname, 'space-explorer.html'),
        sessionLogs: resolve(__dirname, 'session-logs.html')
      }
    }
  }
})
