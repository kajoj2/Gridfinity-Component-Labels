// Canvas-based label renderer — bypasses SVG blob URL restrictions
// that prevent <image data:...> elements from loading in some browsers.
// Used for: PNG export, LBX export, (preview uses inline SVG instead).

import { ICON_B64 } from './icons-b64.js'

const SUBTYPE_ICON = {
  socket_head: 'din_912',  button_head: 'iso_7380',
  flat_head:   'din_7991', pan_head:    'din_7985',
  hex_head:    'iso_4014', hex_nut:     'iso_4032',
  square_nut:  'iso_4032', lock_nut:    'iso_4032',
  nyloc:       'din_985',  washer:      'din_125',
  rollin:      'tnut_rollin', hammerhead: 'tnut_hammerhead',
  square_tnut: 'tnut_square', insert:     'insert',
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

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload  = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export async function renderLabel(cfg, dpi) {
  const W = cfg.width, H = cfg.height
  const mm = dpi / 25.4  // px per mm

  const canvas  = document.createElement('canvas')
  canvas.width  = Math.round(W * mm)
  canvas.height = Math.round(H * mm)
  const ctx = canvas.getContext('2d')

  // Ensure fonts are loaded before drawing text
  await document.fonts.ready

  // White background
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // ── Layout (mirrors svg-gen.js) ────────────────────────────────────
  const pad      = 1.0
  const iconH    = H - 2.2
  const iconW    = iconH * 4.2
  const iconKey   = resolveIconKey(cfg)
  const hasIcon   = cfg.showIcon && iconKey && ICON_B64[iconKey]
  const iconAreaW = hasIcon ? Math.min(iconW + pad * 2, W * 0.50) : 0
  const textXmm   = iconAreaW + pad * 0.5

  // ── Icon ────────────────────────────────────────────────────────────
  if (hasIcon) {
    try {
      const img = await loadImage(`data:image/png;base64,${ICON_B64[iconKey]}`)
      const ix  = 0.5 * mm
      const iy  = ((H - iconH) / 2) * mm
      const iw  = Math.min(iconW, iconAreaW - pad) * mm
      const ih  = iconH * mm
      ctx.drawImage(img, ix, iy, iw, ih)
    } catch (_) { /* icon failed to load, skip */ }

    // Divider line
    ctx.strokeStyle = '#ccc'
    ctx.lineWidth   = 0.18 * mm
    ctx.beginPath()
    ctx.moveTo(iconAreaW * mm, pad * 0.8 * mm)
    ctx.lineTo(iconAreaW * mm, (H - pad * 0.8) * mm)
    ctx.stroke()
  }

  // ── Text content ────────────────────────────────────────────────────
  let mainText, subText
  if (cfg.type === 'custom') {
    mainText = cfg.customMain || '—'
    subText  = cfg.customSub  || ''
  } else if (cfg.type === 'screw') {
    const pitch = cfg.pitch ? `(${cfg.pitch})` : ''
    mainText    = `${cfg.size}×${cfg.length || '?'}${pitch}`
    subText     = SUBTYPE_LABELS[cfg.subtype] || ''
  } else {
    mainText = cfg.size
    subText  = SUBTYPE_LABELS[cfg.subtype] || ''
  }

  const isoText = cfg.showIso && cfg.isoCode ? cfg.isoCode : ''
  const hasSub  = cfg.showSub && subText
  const hasIso  = !!isoText

  // Font sizes in mm
  const mainFS = H === 12 ? 5.2 : 4.0
  const subFS  = H === 12 ? 2.0 : 1.75
  const isoFS  = H === 12 ? 1.6 : 1.4

  // Vertical positions (baseline, in mm)
  let subY, mainY, isoY
  if (H === 12) {
    subY  = hasSub ? 3.6 : 0
    mainY = hasSub && hasIso ? 8.3 : hasSub ? 9.2 : hasIso ? 8.0 : 8.8
    isoY  = mainY + isoFS + 0.7
  } else {
    subY  = hasSub ? 2.8 : 0
    mainY = hasSub && hasIso ? 6.3 : hasSub ? 7.0 : hasIso ? 6.0 : 6.8
    isoY  = mainY + isoFS + 0.5
  }

  const FONT_STACK = `"JetBrains Mono", "Fira Code", "Courier New", monospace`

  if (hasSub) {
    ctx.fillStyle = '#888'
    ctx.font      = `600 ${(subFS * mm).toFixed(1)}px ${FONT_STACK}`
    ctx.fillText(subText, textXmm * mm, subY * mm)
  }

  ctx.fillStyle = '#111'
  ctx.font      = `700 ${(mainFS * mm).toFixed(1)}px ${FONT_STACK}`
  ctx.fillText(mainText, textXmm * mm, mainY * mm)

  if (hasIso) {
    ctx.fillStyle = '#999'
    ctx.font      = `600 ${(isoFS * mm).toFixed(1)}px ${FONT_STACK}`
    ctx.fillText(isoText, textXmm * mm, isoY * mm)
  }

  if (cfg.note && !hasIso) {
    ctx.fillStyle = '#aaa'
    ctx.font      = `400 ${(1.45 * mm).toFixed(1)}px ${FONT_STACK}`
    ctx.fillText(cfg.note, textXmm * mm, (H - (H === 12 ? 0.8 : 0.7)) * mm)
  }

  // ── Border ──────────────────────────────────────────────────────────
  if (cfg.border) {
    ctx.strokeStyle = '#666'
    ctx.lineWidth   = 0.28 * mm
    ctx.setLineDash([1.2 * mm, 0.6 * mm])
    ctx.strokeRect(0.2 * mm, 0.2 * mm, (W - 0.4) * mm, (H - 0.4) * mm)
    ctx.setLineDash([])
  }

  return canvas
}
