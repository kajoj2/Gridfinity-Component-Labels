import { generateSVG } from '../svg-gen.js'

export function printQL(cfg, tapeWidthMm = 29) {
  const svg       = generateSVG(cfg)
  const marginTop = ((tapeWidthMm - cfg.height) / 2).toFixed(1)

  const win = window.open('', '_blank', 'width=500,height=300')
  if (!win) { alert('Pop-up blocked — allow pop-ups for this site and try again.'); return }

  win.document.write(`<!DOCTYPE html><html><head>
    <meta charset="UTF-8">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@600;700&display=swap" rel="stylesheet">
    <style>
      @page { size: ${cfg.width}mm ${tapeWidthMm}mm; margin: 0; }
      html, body { margin: 0; padding: 0; background: white; }
      svg { display: block; margin-top: ${marginTop}mm; }
    </style>
  </head><body>${svg}</body></html>`)
  win.document.close()

  win.onload = () => {
    win.document.fonts.ready.then(() => { win.focus(); win.print() })
  }
}
