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

/** A 600px JPEG for gallery cards, pins and tour rows (about 50 KB instead of about 500 KB). Stored next to the photo as `<name>-t.jpg`. */
export const prepareThumb = (file: File) => prepareImage(file, 600, 0.72)

/** Upload the small copy next to a photo. Never fails the upload: without it the app just falls back to the full photo. */
export async function uploadThumb(
  storage: { from: (bucket: string) => { upload: (path: string, body: Blob, opts: { contentType: string }) => Promise<{ error: unknown }> } },
  bucket: string, photoPath: string, file: File,
) {
  try {
    await storage.from(bucket).upload(photoPath.replace(/\.jpg$/, '-t.jpg'), await prepareThumb(file), { contentType: 'image/jpeg' })
  } catch { /* fine */ }
}
