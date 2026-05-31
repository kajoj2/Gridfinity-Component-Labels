import { ICON_B64 } from './icons-b64.js'

const FONT = `'JetBrains Mono', Consolas, 'Courier New', monospace`

const SUBTYPE_ICON = {
  socket_head: 'din_912',
  button_head: 'iso_7380',
  flat_head:   'din_7991',
  pan_head:    'din_7985',
  hex_head:    'iso_4014',
  set_screw:   null,
  hex_nut:     'iso_4032',
  square_nut:  'iso_4032',
  lock_nut:    'iso_4032',
  nyloc:       'din_985',
  washer:      'din_125',
  rollin:      'tnut_rollin',
  hammerhead:  'tnut_hammerhead',
  square_tnut: 'tnut_square',
  insert:      'insert',
  bearing:     'bearing_lm8uu',
}

function resolveIconKey(cfg) {
  return (cfg.iconKey || null) || SUBTYPE_ICON[cfg.subtype] || null
}

const SUBTYPE_LABELS = {
  socket_head: 'Socket Head',  button_head: 'Button Head',
  pan_head:    'Pan Head',     flat_head:   'Flat Head',
  set_screw:   'Set Screw',    hex_head:    'Hex Head',
  hex_nut:     'Hex Nut',      square_nut:  'Square Nut',
  lock_nut:    'Lock Nut',     nyloc:       'Nyloc Nut',
  rollin:      'Roll-In T-Nut', hammerhead: 'Hammerhead',
  square_tnut: 'Square T-Nut', washer:     'Washer',
  insert:      'Threaded Insert',
}

// Reduce font size if text would overflow available width
function autoFit(text, maxW, nominalFS, charRatio = 0.62) {
  if (!text) return nominalFS
  const needed = text.length * nominalFS * charRatio
  return needed > maxW ? Math.max(2.8, maxW / (text.length * charRatio)) : nominalFS
}

export function generateSVG(cfg) {
  const W = cfg.width
  const H = cfg.height
  const pad = 1.0

  const iconH   = H - 2.2
  const iconW   = iconH * 4.2
  const iconKey = resolveIconKey(cfg)
  const hasIcon = cfg.showIcon && iconKey && ICON_B64[iconKey]

  const iconAreaW   = hasIcon ? Math.min(iconW + pad * 2, W * 0.50) : 0
  const iconX       = pad * 0.5
  const iconY       = (H - iconH) / 2
  const iconRenderW = iconAreaW - pad * 1.0
  const textX       = iconAreaW + pad * 0.5

  const subtext = cfg.showSub ? (SUBTYPE_LABELS[cfg.subtype] || '') : ''
  let mainText
  if (cfg.type === 'custom') {
    mainText = cfg.customMain || '—'
  } else if (cfg.type === 'screw') {
    const pitchStr = cfg.pitch ? `(${cfg.pitch})` : ''
    mainText = `${cfg.size}×${cfg.length || '?'}${pitchStr}`
  } else {
    mainText = cfg.size
  }
  const customSubText = cfg.type === 'custom' ? (cfg.customSub || '') : ''
  const isoText = cfg.showIso && cfg.isoCode ? cfg.isoCode : ''

  const textAreaW = W - iconAreaW - pad * 1.5
  const mainFS    = autoFit(mainText, textAreaW, H === 12 ? 5.2 : 4.0)
  const subFS     = H === 12 ? 2.0 : 1.75
  const isoFS     = H === 12 ? 1.6 : 1.4

  const hasSub = subtext || customSubText
  const hasIso = !!isoText

  let subY, mainY, isoY, noteY
  if (H === 12) {
    subY  = hasSub ? 3.6 : 0
    mainY = hasSub && hasIso ? 8.3 : hasSub ? 9.2 : hasIso ? 8.0 : 8.8
    isoY  = mainY + isoFS + 0.7
    noteY = H - 0.8
  } else {
    subY  = hasSub ? 2.8 : 0
    mainY = hasSub && hasIso ? 6.3 : hasSub ? 7.0 : hasIso ? 6.0 : 6.8
    isoY  = mainY + isoFS + 0.5
    noteY = H - 0.7
  }

  const bg      = cfg.dark ? '#111111' : 'white'
  const cMain   = cfg.dark ? '#f0f0f0' : '#111'
  const cSub    = cfg.dark ? '#aaaaaa' : '#888'
  const cIso    = cfg.dark ? '#555555' : '#999'
  const cNote   = cfg.dark ? '#666666' : '#aaa'
  const cDiv    = cfg.dark ? '#404040' : '#ccc'
  const cBorder = cfg.dark ? '#666666' : '#666'

  // Invert PNG icons for dark labels so they show as light-on-dark
  const defsSection = (hasIcon && cfg.dark)
    ? `<defs><filter id="icn-inv"><feColorMatrix type="matrix" values="-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 1  0 0 0 1 0"/></filter></defs>`
    : ''
  const iconFilterAttr = (hasIcon && cfg.dark) ? ` filter="url(#icn-inv)"` : ''

  const iconSVG = hasIcon ? `
  <image x="${iconX.toFixed(2)}" y="${iconY.toFixed(2)}"
         width="${iconRenderW.toFixed(2)}" height="${iconH.toFixed(2)}"
         href="data:image/png;base64,${ICON_B64[iconKey]}"
         preserveAspectRatio="xMidYMid meet"${iconFilterAttr}/>` : ''

  const divider = hasIcon ? `
  <line x1="${iconAreaW.toFixed(2)}" y1="${(pad * 0.8).toFixed(2)}"
        x2="${iconAreaW.toFixed(2)}" y2="${(H - pad * 0.8).toFixed(2)}"
        stroke="${cDiv}" stroke-width="0.2"/>` : ''

  const borderSVG = cfg.border ? `
  <rect x="0.2" y="0.2" width="${(W - 0.4).toFixed(2)}" height="${(H - 0.4).toFixed(2)}"
        fill="none" stroke="${cBorder}" stroke-width="0.28" stroke-dasharray="1.2,0.6"/>` : ''

  const displaySub = hasSub ? escXML(subtext || customSubText) : ''

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${W}mm" height="${H}mm"
     viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${bg}"/>
  ${defsSection}
  ${iconSVG}
  ${divider}
  ${hasSub ? `<text x="${textX.toFixed(2)}" y="${subY}" font-family="${FONT}" font-size="${subFS}" font-weight="600" fill="${cSub}">${displaySub}</text>` : ''}
  <text x="${textX.toFixed(2)}" y="${mainY}" font-family="${FONT}" font-size="${mainFS.toFixed(2)}" font-weight="700" fill="${cMain}">${escXML(mainText)}</text>
  ${hasIso ? `<text x="${textX.toFixed(2)}" y="${isoY}" font-family="${FONT}" font-size="${isoFS}" font-weight="600" fill="${cIso}">${escXML(isoText)}</text>` : ''}
  ${cfg.note && !hasIso ? `<text x="${textX.toFixed(2)}" y="${noteY}" font-family="${FONT}" font-size="1.45" fill="${cNote}">${escXML(cfg.note)}</text>` : ''}
  ${borderSVG}
</svg>`
}

function escXML(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

export function safeName(cfg) {
  if (cfg.type === 'custom') return (cfg.customMain || 'custom').replace(/[^\w]/g, '_')
  if (cfg.type === 'screw')  return `${cfg.size}x${cfg.length}_${cfg.subtype}`
  return `${cfg.size}_${cfg.subtype || cfg.type}`
}
