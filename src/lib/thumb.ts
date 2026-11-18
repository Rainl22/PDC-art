/** Small copy of a photo: `<name>.jpg` → `<name>-t.jpg` (storage photos and bundled `/murals/<slug>/N.jpg`). Anything else is returned unchanged. */
export function thumbUrl(src: string | null | undefined): string {
  if (!src) return ''
  if (/-t\.jpe?g$/i.test(src)) return src
  if (!/\.jpe?g$/i.test(src)) return src
  if (!src.includes('/storage/v1/object/public/') && !src.startsWith('/murals/')) return src
  return src.replace(/\.jpe?g$/i, '-t.jpg')
}
