import { safeName } from '../svg-gen.js'

export function dlSVG(cfg, svgStr) {
  const a    = document.createElement('a')
  a.href     = URL.createObjectURL(new Blob([svgStr], { type: 'image/svg+xml' }))
  a.download = safeName(cfg) + '.svg'
  a.click()
}
