import { defineConfig } from 'vite'
import { sveltekit } from '@sveltejs/kit/vite'
import adapter from '@sveltejs/adapter-static'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      // Build a static SPA into out/renderer, which the Electron main process loads from disk.
      adapter: adapter({ pages: 'out/renderer', assets: 'out/renderer' }),
      // file:// URLs have no server to resolve paths, so route by location.hash instead.
      router: { type: 'hash' }
    })
  ],
  server: { port: 5173, strictPort: true }
})
