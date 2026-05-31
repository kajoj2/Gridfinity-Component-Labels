import { renderLabel } from '../render.js'

const BASE = 'http://localhost:8099'

// Printable dots across tape at 300 DPI (from brother_ql label definitions)
const TAPE_DOTS = { '12': 106, '29': 306, '38': 413, '50': 554, '54': 590, '62': 696 }

export async function checkCompanion() {
  try {
    const r = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(1200) })
    return r.ok ? await r.json() : null
  } catch {
    return null
  }
}

export async function directPrint(cfg, tapeWidth = '29', rotate = 'ccw') {
  const tapeDots = TAPE_DOTS[String(tapeWidth)] || 306

  // 1. Render label at 300 DPI → landscape canvas (labelW × labelH px)
  const label = await renderLabel(cfg, 300)
  const lw = label.width   // label length in px  (e.g. 425 for 36 mm)
  const lh = label.height  // label height in px  (e.g. 142 for 12 mm)

  // 2. Build portrait tape canvas: tapeDots wide × lw tall
  //    Width  = printable dots across tape (e.g. 306 for 29 mm)
  //    Height = cut length in pixels       (e.g. 425 for 36 mm)
  //    We do ALL rotation/centering here so the companion receives a ready image.
  const tape = document.createElement('canvas')
  tape.width  = tapeDots
  tape.height = lw

  const ctx = tape.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, tapeDots, lw)

  // 3. Apply transform: label (x, y) → tape (canvas_col, canvas_row)
  //    canvas_col = y + xOff   — label height centred in tape width
  //    canvas_row = x          — label length runs along tape feed (CCW)
  //    canvas_row = lw-1 - x  — reversed feed direction (CW)
  //
  //    Canvas setTransform(a, b, c, d, e, f):
  //      canvas_x' = a·x + c·y + e
  //      canvas_y' = b·x + d·y + f
  //
  //    CCW:  a=0, b=1,  c=1, d=0, e=xOff, f=0
  //    CW:   a=0, b=-1, c=1, d=0, e=xOff, f=lw-1
  const xOff = Math.round((tapeDots - lh) / 2)
  ctx.setTransform(0, rotate === 'ccw' ? -1 : 1, 1, 0, xOff, rotate === 'ccw' ? lw - 1 : 0)
  ctx.drawImage(label, 0, 0)
  ctx.resetTransform()

  // 4. Encode as base64 PNG and POST to companion
  const blob = await new Promise(r => tape.toBlob(r, 'image/png'))
  const b64  = await new Promise((res, rej) => {
    const fr = new FileReader()
    fr.onload  = () => res(fr.result.split(',')[1])
    fr.onerror = rej
    fr.readAsDataURL(blob)
  })

  const resp = await fetch(`${BASE}/print`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: b64, label: String(tapeWidth) }),
  })
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }))
    throw new Error(err.error || `HTTP ${resp.status}`)
  }
}
