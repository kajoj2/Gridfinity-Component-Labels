// SVG icons — 10×10 viewBox, vertical orientation (head top, shaft down)
// Design principles:
//  - Clean filled silhouettes, no diagonal thread marks (noise at small sizes)
//  - Each head shape is very proportionally distinct
//  - 3 thin horizontal rings on shaft to indicate threading
//  - Flat chamfer tip (no sharp point)

const SHAFT_X1 = 4.05
const SHAFT_X2 = 5.95
const SHAFT_W  = 1.9

// Thin horizontal rings on shaft to suggest threading
function threadRings(y1, y2, count = 3) {
  const step = (y2 - y1) / (count + 1)
  let out = ''
  for (let i = 1; i <= count; i++) {
    const y = (y1 + step * i).toFixed(2)
    out += `<line x1="${(SHAFT_X1 - 0.6).toFixed(2)}" y1="${y}" x2="${(SHAFT_X2 + 0.6).toFixed(2)}" y2="${y}" stroke="white" stroke-width="0.38"/>`
  }
  return out
}

// Flat chamfer at tip
const CHAMFER = `<polygon points="${SHAFT_X1},8.7 ${SHAFT_X2},8.7 ${(SHAFT_X2 - 0.35).toFixed(2)},9.55 ${(SHAFT_X1 + 0.35).toFixed(2)},9.55"/>`

function shaft(yTop, yBot = 8.7) {
  return `<rect x="${SHAFT_X1}" y="${yTop}" width="${SHAFT_W}" height="${(yBot - yTop).toFixed(2)}"/>`
}

export const ICONS = {

  // Socket Head Cap Screw (ISO 4762)
  // Square-ish cylindrical head with prominent hex socket
  socket_head: `
    <rect x="2.7" y="0.4" width="4.6" height="2.8" rx="0.25"/>
    <polygon points="5,0.7 6.25,1.4 6.25,2.45 5,3.1 3.75,2.45 3.75,1.4" fill="white"/>
    ${shaft(3.2)}
    ${threadRings(3.2, 8.7)}
    ${CHAMFER}`,

  // Button Head Cap Screw (ISO 7380)
  // VERY wide, VERY flat dome — much wider than tall
  button_head: `
    <ellipse cx="5" cy="2.1" rx="4.2" ry="1.5"/>
    <ellipse cx="5" cy="2.1" rx="2.5" ry="0.6" fill="none" stroke="white" stroke-width="0.35"/>
    ${shaft(3.6)}
    ${threadRings(3.6, 8.7)}
    ${CHAMFER}`,

  // Pan Head — medium width, taller rounded rectangle
  pan_head: `
    <rect x="2.0" y="0.5" width="6.0" height="3.0" rx="1.4"/>
    <line x1="2.0" y1="2.0" x2="8.0" y2="2.0" stroke="white" stroke-width="0.3"/>
    ${shaft(3.5)}
    ${threadRings(3.5, 8.7)}
    ${CHAMFER}`,

  // Flat / Countersunk Head (ISO 10642)
  // Wide triangle — instantly recognisable countersink profile
  flat_head: `
    <polygon points="1.0,0.4 9.0,0.4 ${SHAFT_X2},3.4 ${SHAFT_X1},3.4"/>
    <line x1="2.5" y1="1.5" x2="7.5" y2="1.5" stroke="white" stroke-width="0.3"/>
    ${shaft(3.4)}
    ${threadRings(3.4, 8.7)}
    ${CHAMFER}`,

  // Set Screw — no external head, hex drive socket at top, flat tip
  set_screw: `
    <rect x="3.3" y="0.4" width="3.4" height="9.15" rx="0.3"/>
    <polygon points="5,0.7 6.1,1.3 6.1,2.3 5,2.9 3.9,2.3 3.9,1.3" fill="white"/>
    <line x1="3.3" y1="3.5" x2="6.7" y2="3.5" stroke="white" stroke-width="0.38"/>
    <line x1="3.3" y1="5.2" x2="6.7" y2="5.2" stroke="white" stroke-width="0.38"/>
    <line x1="3.3" y1="6.9" x2="6.7" y2="6.9" stroke="white" stroke-width="0.38"/>
    <rect x="3.3" y="9.1" width="3.4" height="0.45" rx="0.15"/>`,

  // Hex Nut
  hex_nut: `
    <polygon points="5,0.2 8.9,2.3 8.9,7.7 5,9.8 1.1,7.7 1.1,2.3"/>
    <circle cx="5" cy="5" r="2.35" fill="white"/>`,

  // Square Nut
  square_nut: `
    <rect x="0.8" y="0.8" width="8.4" height="8.4" rx="0.4"/>
    <circle cx="5" cy="5" r="2.35" fill="white"/>`,

  // Lock Nut (hex with jam nut underneath)
  lock_nut: `
    <polygon points="5,0.2 8.9,2.3 8.9,7.7 5,9.8 1.1,7.7 1.1,2.3"/>
    <circle cx="5" cy="5" r="2.35" fill="white"/>
    <line x1="1.1" y1="7.3" x2="8.9" y2="7.3" stroke="white" stroke-width="0.5"/>`,

  // Nyloc Nut (hex + nylon insert indicated by dome top)
  nyloc: `
    <polygon points="5,0.2 8.9,2.3 8.9,7.0 5,9.1 1.1,7.0 1.1,2.3"/>
    <circle cx="5" cy="4.5" r="2.2" fill="white"/>
    <ellipse cx="5" cy="9.2" rx="3.9" ry="0.85"/>`,

  // Washer
  washer: `
    <circle cx="5" cy="5" r="4.6"/>
    <circle cx="5" cy="5" r="2.0" fill="white"/>`,

  // T-Nut Roll-In
  rollin: `
    <rect x="0.5" y="4.0" width="9.0" height="2.6" rx="0.5"/>
    <rect x="3.5" y="1.0" width="3.0" height="3.5" rx="0.4"/>
    <circle cx="5" cy="5.3" r="1.0" fill="white"/>`,

  // T-Nut Hammerhead
  hammerhead: `
    <rect x="0.8" y="3.5" width="8.4" height="2.2" rx="0.4"/>
    <rect x="3.5" y="0.5" width="3.0" height="3.8" rx="0.4"/>
    <circle cx="5" cy="4.6" r="1.0" fill="white"/>`,

  // T-Nut Square
  square_tnut: `
    <rect x="0.5" y="3.6" width="9.0" height="2.5" rx="0.3"/>
    <rect x="3.5" y="0.5" width="3.0" height="3.5" rx="0.25"/>
    <circle cx="5" cy="4.85" r="1.0" fill="white"/>`,

  // Threaded Insert
  insert: `
    <rect x="3.2" y="0.5" width="3.6" height="9.0" rx="1.6" fill="none" stroke="black" stroke-width="1.3"/>
    <line x1="4.0" y1="2.6" x2="6.0" y2="2.6" stroke="black" stroke-width="0.65"/>
    <line x1="4.0" y1="4.2" x2="6.0" y2="4.2" stroke="black" stroke-width="0.65"/>
    <line x1="4.0" y1="5.8" x2="6.0" y2="5.8" stroke="black" stroke-width="0.65"/>
    <line x1="4.0" y1="7.4" x2="6.0" y2="7.4" stroke="black" stroke-width="0.65"/>`,

  // Bearing
  bearing: `
    <circle cx="5" cy="5" r="4.5" fill="none" stroke="black" stroke-width="1.1"/>
    <circle cx="5" cy="5" r="2.9" fill="none" stroke="black" stroke-width="0.45" stroke-dasharray="0.9,0.55"/>
    <circle cx="5" cy="5" r="1.5" fill="none" stroke="black" stroke-width="1.1"/>`,
}

export function getIcon(type, subtype) {
  const map = {
    screw:   subtype,
    nut:     subtype,
    washer:  'washer',
    tnut:    subtype,
    insert:  'insert',
    bearing: 'bearing',
  }
  return ICONS[map[type]] || ''
}
