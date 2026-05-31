import { ICON_B64 } from './icons-b64.js'

const FONT = `'JetBrains Mono', Consolas, 'Courier New', monospace`

// Fallback icon when no ISO standard is selected — based on subtype
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
  return cfg.iconKey || SUBTYPE_ICON[cfg.subtype] || null
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

export function generateSVG(cfg) {
  const W = cfg.width
  const H = cfg.height
  const pad = 1.0

  // Horizontal PNG icons: aspect ~4:1, fill icon area height minus margins
  const iconH   = H - 2.2                   // usable icon height in mm
  const iconW   = iconH * 4.2               // maintain 4.2:1 aspect ratio
  const iconKey = resolveIconKey(cfg)
  const hasIcon = cfg.showIcon && iconKey && ICON_B64[iconKey]

  // Icon area width: if icon present, carve out space; otherwise zero
  const iconAreaW = hasIcon ? Math.min(iconW + pad * 2, W * 0.50) : 0
  const iconX     = pad * 0.5
  const iconY     = (H - iconH) / 2
  const iconRenderW = iconAreaW - pad * 1.0
  const textX       = iconAreaW + pad * 0.5

  // Derive display texts
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

  // Font sizes (mm = SVG user units)
  const mainFS = H === 12 ? 5.2 : 4.0
  const subFS  = H === 12 ? 2.0 : 1.75
  const isoFS  = H === 12 ? 1.6 : 1.4

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

  const iconSVG = hasIcon ? `
  <image x="${iconX.toFixed(2)}" y="${iconY.toFixed(2)}"
         width="${iconRenderW.toFixed(2)}" height="${iconH.toFixed(2)}"
         href="data:image/png;base64,${ICON_B64[iconKey]}"
         preserveAspectRatio="xMidYMid meet"/>` : ''

  const divider = hasIcon ? `
  <line x1="${iconAreaW.toFixed(2)}" y1="${(pad * 0.8).toFixed(2)}"
        x2="${iconAreaW.toFixed(2)}" y2="${(H - pad * 0.8).toFixed(2)}"
        stroke="#ccc" stroke-width="0.2"/>` : ''

  const borderSVG = cfg.border ? `
  <rect x="0.2" y="0.2" width="${(W - 0.4).toFixed(2)}" height="${(H - 0.4).toFixed(2)}"
        fill="none" stroke="#666" stroke-width="0.28" stroke-dasharray="1.2,0.6"/>` : ''

  const displaySub = hasSub ? escXML(subtext || customSubText) : ''

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${W}mm" height="${H}mm"
     viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="white"/>
  ${iconSVG}
  ${divider}
  ${hasSub ? `<text x="${textX.toFixed(2)}" y="${subY}" font-family="${FONT}" font-size="${subFS}" font-weight="600" fill="#888">${displaySub}</text>` : ''}
  <text x="${textX.toFixed(2)}" y="${mainY}" font-family="${FONT}" font-size="${mainFS}" font-weight="700" fill="#111">${escXML(mainText)}</text>
  ${hasIso ? `<text x="${textX.toFixed(2)}" y="${isoY}" font-family="${FONT}" font-size="${isoFS}" font-weight="600" fill="#999">${escXML(isoText)}</text>` : ''}
  ${cfg.note && !hasIso ? `<text x="${textX.toFixed(2)}" y="${noteY}" font-family="${FONT}" font-size="1.45" fill="#aaa">${escXML(cfg.note)}</text>` : ''}
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
