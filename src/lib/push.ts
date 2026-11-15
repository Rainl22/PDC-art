// Public VAPID key for Web Push (safe to ship; the private key lives only in the database, used by the notify-submission function).
export const VAPID_PUBLIC_KEY = 'BCZLsQ7K5yoA3-nO7mxCL-DhpCnsjE6ZRbbWIodWts58HV7R5YupRhLGTm8NIv98FtC2XQLSlQZKaJZawIzyZT0'

export function urlBase64ToUint8Array(base64: string): Uint8Array {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(Array.from(raw, c => c.charCodeAt(0)))
}
