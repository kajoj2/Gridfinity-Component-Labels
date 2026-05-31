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

export async function directPrint(cfg, tapeWidth = '29', rotate = 'poziomo') {
  const tapeDots = TAPE_DOTS[String(tapeWidth)] || 306

  // Render label at 300 DPI → landscape canvas lw × lh
  const label = await renderLabel(cfg, 300)
  const lw    = label.width   // label length px  (e.g. 425 for 36 mm)
  const lh    = label.height  // label height px  (e.g. 142 for 12 mm)

  const tape    = document.createElement('canvas')
  const tapeCtx = tape.getContext('2d')

  if (rotate === 'poziomo') {
    // ── POZIOMO ──────────────────────────────────────────────────────────────
    // Label length (lw) runs ALONG tape feed → cut at label width (e.g. 36 mm)
    // Label height (lh) runs ACROSS tape, centred in tape width
    //
    // Tape canvas: tapeDots wide × lw tall
    // Mapping (explicit pixel loop, no transform ambiguity):
    //   tape_col = y + xOff          label top  → near left of content zone
    //   tape_row = lw - 1 - x        label left → row lw-1 (exits first → left when held)
    const xOff = Math.round((tapeDots - lh) / 2)
    tape.width  = tapeDots
    tape.height = lw
    tapeCtx.fillStyle = '#ffffff'
    tapeCtx.fillRect(0, 0, tapeDots, lw)
    const src = label.getContext('2d').getImageData(0, 0, lw, lh).data
    const dst = tapeCtx.getImageData(0, 0, tapeDots, lw)

    for (let x = 0; x < lw; x++) {
      for (let y = 0; y < lh; y++) {
        const si  = (y * lw + x) * 4
        const col = y + xOff
        const row = lw - 1 - x
        const di  = (row * tapeDots + col) * 4
        dst.data[di]     = src[si]
        dst.data[di + 1] = src[si + 1]
        dst.data[di + 2] = src[si + 2]
        dst.data[di + 3] = src[si + 3]
      }
    }
    tapeCtx.putImageData(dst, 0, 0)

  } else {
    // ── PIONOWO ──────────────────────────────────────────────────────────────
    // Label height (lh) runs ALONG tape feed → cut at label height (e.g. 12 mm)
    // Label width  (lw) runs ACROSS tape, scaled proportionally to fit tapeDots
    //
    // Tape canvas: tapeDots wide × scaledH tall
    // drawImage handles bilinear scaling; no pixel loop needed.
    const scale   = tapeDots / lw           // e.g. 306/425 = 0.72 for 36 mm on 29 mm tape
    const scaledH = Math.round(lh * scale)  // proportional cut length
    tape.width  = tapeDots
    tape.height = scaledH
    tapeCtx.fillStyle = '#ffffff'
    tapeCtx.fillRect(0, 0, tapeDots, scaledH)
    tapeCtx.drawImage(label, 0, 0, tapeDots, scaledH)
  }

  // Encode and POST to companion
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
