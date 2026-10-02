<script lang="ts">
  import '../app.css'
  import { ModeWatcher } from 'mode-watcher'
  import { Toaster } from '#lib/components/ui/sonner'
  import * as Tooltip from '#lib/components/ui/tooltip'

  let { children } = $props()

  // Lets CSS adapt to the custom title bar per OS (see the mac:/win: variants in app.css).
  // `window.electron` is absent when the UI is opened in a plain browser.
  document.documentElement.dataset.platform = window.electron?.process.platform ?? 'web'
</script>

<ModeWatcher />
<Toaster />
<Tooltip.Provider>
  {@render children()}
</Tooltip.Provider>
