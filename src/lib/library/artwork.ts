// URLs for artist/album thumbnails, served by the main process (src/main/artwork.ts).
// In a plain browser these fail to load and components fall back to an icon.

export function artistArtworkUrl(artist: string, albumHint?: string | null): string {
  const query = albumHint ? `?album=${encodeURIComponent(albumHint)}` : ''
  return `artwork://artist/${encodeURIComponent(artist)}${query}`
}

export function albumArtworkUrl(artist: string, album: string): string {
  return `artwork://album/${encodeURIComponent(artist)}/${encodeURIComponent(album)}`
}
