<script lang="ts">
  import * as AlertDialog from '#lib/components/ui/alert-dialog'
  import { library } from '#lib/library/library.svelte'
  import { session } from '#lib/session.svelte'

  let open = $state(false)

  // ⌘W (Close Song, in the app menu): ask before closing the open song, like closing a tab. With
  // nothing open, close the window instead.
  $effect(() =>
    window.api?.onCloseTab(() => {
      if (library.selected) open = true
      else window.api?.closeWindow()
    })
  )

  function closeSong(): void {
    // The score stays loaded (hidden) underneath, so stop it before letting the song go.
    session.player?.stop()
    library.selected = null
    open = false
  }
</script>

<AlertDialog.Root bind:open>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Close “{library.selected?.title}”?</AlertDialog.Title>
      <AlertDialog.Description>
        Playback stops. Your track, mixer and position settings for this song are kept for next
        time.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action onclick={closeSong}>Close Song</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
