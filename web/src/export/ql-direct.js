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

  // 1. Render label at 300 DPI → landscape canvas lw × lh px
  const label   = await renderLabel(cfg, 300)
  const lw      = label.width   // label length px  (e.g. 425 for 36 mm)
  const lh      = label.height  // label height px  (e.g. 142 for 12 mm)
  const xOff    = Math.round((tapeDots - lh) / 2)  // centre label height in tape width

  // 2. Read source pixels
  const src = label.getContext('2d').getImageData(0, 0, lw, lh).data

  // 3. Build portrait tape canvas: tapeDots wide × lw tall
  //    Width  = printable dots across tape  (e.g. 306 for 29 mm)
  //    Height = cut length                  (e.g. 425 for 36 mm)
  const tape    = document.createElement('canvas')
  tape.width    = tapeDots
  tape.height   = lw
  const tapeCtx = tape.getContext('2d')
  tapeCtx.fillStyle = '#ffffff'
  tapeCtx.fillRect(0, 0, tapeDots, lw)
  const dst = tapeCtx.getImageData(0, 0, tapeDots, lw)

  // 4. Pixel-by-pixel copy with explicit coordinate mapping.
  //
  //  In the label canvas:  x = horizontal (0 = label left), y = vertical (0 = label top)
  //  In the tape canvas:   col = across tape, row = along tape (row 0 = first printed)
  //
  //  Brother QL feeds tape so that the LAST raster row exits FIRST.
  //  Therefore row 0 (first printed) ends up at the PHYSICAL RIGHT when the label
  //  is held with text reading left → right.
  //
  //  Normalnie (ccw):
  //    col = y + xOff          label top  → left side of content zone on tape
  //    row = lw - 1 - x        label left → row lw-1 (exits first → physical left) ✓
  //
  //  Odwróć (cw) — 180° rotation of the whole print:
  //    col = (lh-1-y) + xOff   label bottom → left side of content zone (flipped)
  //    row = x                 label left → row 0 (exits last → physical right)
  //                            when tape is held from the other end, label reads normally

  for (let x = 0; x < lw; x++) {
    for (let y = 0; y < lh; y++) {
      const si = (y * lw + x) * 4

      let col, row
      if (rotate === 'ccw') {
        col = y + xOff
        row = lw - 1 - x
      } else {
        col = (lh - 1 - y) + xOff
        row = x
      }

      const di = (row * tapeDots + col) * 4
      dst.data[di]     = src[si]
      dst.data[di + 1] = src[si + 1]
      dst.data[di + 2] = src[si + 2]
      dst.data[di + 3] = src[si + 3]
    }
  }

  tapeCtx.putImageData(dst, 0, 0)

  // 5. Encode and POST to companion
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
