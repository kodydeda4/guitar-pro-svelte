<script lang="ts">
  import '../app.css'
  import { ModeWatcher, userPrefersMode } from 'mode-watcher'
  import { Toaster } from '#lib/components/ui/sonner'
  import * as Tooltip from '#lib/components/ui/tooltip'

  let { children } = $props()

  // Lets CSS adapt to the custom title bar per OS (see the mac:/win: variants in app.css).
  // `window.electron` is absent when the UI is opened in a plain browser.
  document.documentElement.dataset.platform = window.electron?.process.platform ?? 'web'

  // Keep the native glass behind the frame in the same light/dark mode as the app.
  $effect(() => window.api?.setTheme(userPrefersMode.current))

  // Use the OS accent color for the app's accent (app.css falls back to Apple's system blue).
  $effect(() => {
    const api = window.api
    if (!api) return
    const apply = (color: string | null): void => {
      if (color) document.documentElement.style.setProperty('--system-accent', color)
      else document.documentElement.style.removeProperty('--system-accent')
    }
    api.getAccentColor().then(apply)
    return api.onAccentColorChange(apply)
  })
</script>

<ModeWatcher />
<Toaster />
<Tooltip.Provider>
  {@render children()}
</Tooltip.Provider>
