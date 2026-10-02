import { defineConfig } from 'electron-vite'

// electron-vite only builds the Electron main + preload scripts.
// The renderer is a SvelteKit app built by vite.config.ts.
export default defineConfig({
  main: {},
  preload: {}
})
