/** Re-encode a photo as a ≤2000px JPEG. This also strips EXIF metadata (including GPS) before upload. */
export async function prepareImage(file: File, maxEdge = 2000, quality = 0.85): Promise<Blob> {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, maxEdge / Math.max(bmp.width, bmp.height))
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h)
  bmp.close?.()
  const blob: Blob | null = await new Promise(r => canvas.toBlob(r, 'image/jpeg', quality))
  if (!blob) throw new Error('image encode failed')
  return blob
}
