/** Anonymous per-browser id, used so one device counts once per like. Not a login; clearing site data resets it. */
export function getDeviceId(): string {
  try {
    let id = localStorage.getItem('pdc.device')
    if (!id || id.length < 16) {
      id = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`)
      localStorage.setItem('pdc.device', id)
    }
    return id
  } catch {
    return `anon-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
  }
}
