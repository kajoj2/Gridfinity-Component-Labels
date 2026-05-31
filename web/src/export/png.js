import { renderLabel } from '../render.js'
import { safeName } from '../svg-gen.js'

export async function dlPNG(cfg) {
  const canvas = await renderLabel(cfg, 300)
  canvas.toBlob(blob => {
    const a    = document.createElement('a')
    a.href     = URL.createObjectURL(blob)
    a.download = safeName(cfg) + '.png'
    a.click()
  })
}
