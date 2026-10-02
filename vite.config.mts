import { defineConfig } from 'vite'
import { sveltekit } from '@sveltejs/kit/vite'
import adapter from '@sveltejs/adapter-static'
import tailwindcss from '@tailwindcss/vite'
import { alphaTab } from '@coderline/alphatab-vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    // Bundles alphaTab's audio worker and worklet. Fonts and the soundfont are imported
    // explicitly in alphatab-score.ts, so the plugin doesn't need to copy them.
    alphaTab({ assetOutputDir: false }),
    sveltekit({
      // Build a static SPA into out/renderer, which the Electron main process loads from disk.
      adapter: adapter({ pages: 'out/renderer', assets: 'out/renderer' }),
      // file:// URLs have no server to resolve paths, so route by location.hash instead.
      router: { type: 'hash' }
    })
  ],
  // alphaTab starts its audio worker/worklet as ES modules.
  worker: { format: 'es' },
  server: { port: 5173, strictPort: true }
})
