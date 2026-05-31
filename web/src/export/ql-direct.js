import { renderLabel } from '../render.js'

const BASE = 'http://localhost:8099'

// Returns companion info object or null if not running
export async function checkCompanion() {
  try {
    const r = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(1200) })
    return r.ok ? await r.json() : null
  } catch {
    return null
  }
}

export async function directPrint(cfg, tapeWidth = '29') {
  const canvas = await renderLabel(cfg, 300)

  const blob = await new Promise(r => canvas.toBlob(r, 'image/png'))

  // FileReader is the cleanest way to base64-encode a Blob without stack overflow
  const b64 = await new Promise((res, rej) => {
    const fr = new FileReader()
    fr.onload  = () => res(fr.result.split(',')[1])
    fr.onerror = rej
    fr.readAsDataURL(blob)
  })

  const r = await fetch(`${BASE}/print`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: b64, label: String(tapeWidth) }),
  })

  if (!r.ok) {
    const err = await r.json().catch(() => ({ error: `HTTP ${r.status}` }))
    throw new Error(err.error || `HTTP ${r.status}`)
  }
}
