import JSZip from 'jszip'
import { generateSVG, safeName } from './svg-gen.js'
import { STANDARDS } from './standards.js'
import { dlSVG } from './export/svg.js'
import { dlPNG } from './export/png.js'
import { dlPDF } from './export/pdf.js'
import { dlLBX, dlLBXBatch } from './export/lbx.js'
import { printQL } from './export/ql.js'
import { checkCompanion, directPrint } from './export/ql-direct.js'
import { renderLabel } from './render.js'

/* ═══════════════════════════════════════
   STATE
   ═══════════════════════════════════════ */
const state = {
  // ISO standard (primary)
  isoCode:  '',
  isoLabel: '',
  iconKey:  null,
  // Component (auto-set by ISO, or manual)
  type:    'screw',
  subtype: 'socket_head',
  // Dimensions
  size:   'M3',
  length: '10',
  pitch:  '',
  note:   '',
  // Custom
  customMain: '',
  customSub:  '',
  // Label settings
  height:   12,
  width:    36,
  showIcon: true,
  showSub:  true,
  showIso:  true,
  border:   false,
  dark:     false,
  qlTape:   '29',
  qlRotate: 'ccw',
}

const batch = {
  isoCode:  '',
  isoLabel: '',
  iconKey:  null,
  type:    'screw',
  subtype: 'socket_head',
  size:    'M3',
  note:    '',
  lengths: new Set([6, 8, 10, 12, 16, 20, 25]),
}

const LENGTHS = [6, 8, 10, 12, 14, 16, 18, 20, 25, 30, 35, 40, 50, 60]

const TYPE_DEFAULTS = {
  screw: 'socket_head', nut: 'hex_nut', washer: 'washer',
  tnut: 'rollin', insert: 'insert', bearing: 'bearing', custom: '',
}

/* ═══════════════════════════════════════
   PERSISTENCE — URL hash + localStorage
   ═══════════════════════════════════════ */
const PERSIST_KEYS = ['type','subtype','size','length','isoCode','isoLabel','iconKey',
  'height','width','showIcon','showSub','showIso','border','dark','note','pitch','customMain','customSub','qlTape','qlRotate']
const BOOL_KEYS = new Set(['showIcon','showSub','showIso','border','dark'])
const NUM_KEYS  = new Set(['height','width'])

function stateToParams() {
  const p = new URLSearchParams()
  for (const k of PERSIST_KEYS) {
    const v = state[k]
    if (v === null || v === '' || v === undefined) continue
    p.set(k, BOOL_KEYS.has(k) ? (v ? '1' : '0') : String(v))
  }
  return p
}

function applyParams(p) {
  for (const k of PERSIST_KEYS) {
    if (!p.has(k)) continue
    const raw = p.get(k)
    if (BOOL_KEYS.has(k))     state[k] = raw === '1'
    else if (NUM_KEYS.has(k)) state[k] = +raw
    else                      state[k] = raw
  }
}

function saveState() {
  const p = stateToParams()
  history.replaceState(null, '', '#' + p.toString())
  try { localStorage.setItem('gfl-state', p.toString()) } catch (_) {}
}

function loadState() {
  const hash = location.hash.slice(1)
  if (hash) { applyParams(new URLSearchParams(hash)); return }
  try {
    const ls = localStorage.getItem('gfl-state')
    if (ls) applyParams(new URLSearchParams(ls))
  } catch (_) {}
}

/* ═══════════════════════════════════════
   SYNC STATE → UI (after load from storage/URL)
   ═══════════════════════════════════════ */
function syncUIToState() {
  if (state.isoCode) {
    document.getElementById('iso-input').value         = state.isoLabel || state.isoCode
    document.getElementById('iso-clear').style.display = 'block'
    const badge = document.getElementById('iso-selected-badge')
    const std   = STANDARDS.find(s => s.code === state.isoCode)
    if (std && badge) { badge.textContent = std.desc; badge.style.display = 'block' }
    showManualFields(false)
  }
  setActiveToggle('tg-type',      state.type)
  applyTypeVisibility(state.type)
  setActiveToggle('tg-screw-sub', state.subtype)
  setActiveToggle('tg-nut-sub',   state.subtype)
  setActiveToggle('tg-tnut-sub',  state.subtype)
  const sizeEl = document.getElementById('sel-size')
  if ([...sizeEl.options].some(o => o.value === state.size)) sizeEl.value = state.size
  document.getElementById('inp-length').value      = state.length
  document.getElementById('inp-note').value        = state.note
  document.getElementById('inp-pitch').value       = state.pitch
  document.getElementById('inp-main').value        = state.customMain
  document.getElementById('inp-sub').value         = state.customSub
  document.getElementById('inp-custom-note').value = state.note
  setActiveToggle('tg-height', state.height)
  document.getElementById('sw-icon').checked    = state.showIcon
  document.getElementById('sw-sub').checked     = state.showSub
  document.getElementById('sw-iso').checked     = state.showIso
  document.getElementById('sw-border').checked  = state.border
  document.getElementById('sw-dark').checked    = state.dark
  document.getElementById('sel-ql-tape').value   = state.qlTape   || '29'
  setActiveToggle('tg-ql-rotate', state.qlRotate || 'cw')
  document.getElementById('width-slider').value = state.width
  document.getElementById('width-val').textContent = state.width + ' mm'
}

/* ═══════════════════════════════════════
   PREVIEW
   Inline SVG in DOM — avoids blob URL restrictions
   that block data: URIs inside <image> elements
   ═══════════════════════════════════════ */
function updatePreview() {
  const svg  = generateSVG(state)
  const area  = document.getElementById('preview-area')
  const avail = area.clientWidth - 56
  const scale = Math.min(14, avail / state.width)
  const pxW   = (state.width  * scale).toFixed(0)
  const pxH   = (state.height * scale).toFixed(0)

  // Parse SVG string → DOM element, then insert inline
  // Inline SVG can freely load data: URIs unlike blob-URL <img>
  const parser  = new DOMParser()
  const svgDoc  = parser.parseFromString(svg, 'image/svg+xml')
  const svgEl   = svgDoc.documentElement

  svgEl.setAttribute('width',  pxW + 'px')
  svgEl.setAttribute('height', pxH + 'px')
  svgEl.style.display    = 'block'
  svgEl.style.boxShadow  = '0 4px 20px rgba(0,0,0,0.45), 0 1px 3px rgba(0,0,0,0.3)'

  const container = document.getElementById('preview-svg-container')
  container.innerHTML = ''
  container.appendChild(document.importNode(svgEl, true))

  const dim = `${state.width} × ${state.height} mm`
  document.getElementById('dim-label').textContent    = dim
  document.getElementById('preview-meta').textContent = dim
  saveState()
}

/* ═══════════════════════════════════════
   ISO DROPDOWN (reusable)
   ═══════════════════════════════════════ */
function buildISODropdown(inputId, dropdownId, clearId, badgeId, onSelect) {
  const input    = document.getElementById(inputId)
  const dropdown = document.getElementById(dropdownId)
  const clear    = document.getElementById(clearId)
  const badge    = document.getElementById(badgeId)

  function render(query) {
    const q    = (query || '').toLowerCase()
    const hits = STANDARDS.filter(s =>
      s.label.toLowerCase().includes(q) ||
      s.desc.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q)
    )
    dropdown.innerHTML = hits.length
      ? hits.map(s => `
          <div class="iso-opt" data-code="${s.code}">
            <div class="iso-opt-code">${s.label}</div>
            <div class="iso-opt-desc">${s.desc}</div>
          </div>`).join('')
      : `<div class="iso-opt" style="cursor:default;color:var(--text-muted)">No results</div>`

    dropdown.querySelectorAll('.iso-opt[data-code]').forEach(el => {
      el.addEventListener('mousedown', e => {
        e.preventDefault()
        const std = STANDARDS.find(s => s.code === el.dataset.code)
        if (std) selectStandard(std)
      })
    })
  }

  function selectStandard(std) {
    input.value = std.label
    clear.style.display = 'block'
    dropdown.classList.remove('open')
    if (badge) {
      badge.textContent = std.desc
      badge.style.display = 'block'
    }
    onSelect(std)
  }

  function clearSelection() {
    input.value = ''
    clear.style.display = 'none'
    if (badge) badge.style.display = 'none'
    dropdown.classList.remove('open')
    onSelect(null)
  }

  input.addEventListener('focus', () => {
    render(input.value)
    dropdown.classList.add('open')
  })
  input.addEventListener('blur', () => {
    setTimeout(() => dropdown.classList.remove('open'), 200)
  })
  input.addEventListener('input', e => {
    render(e.target.value)
    dropdown.classList.add('open')
    clear.style.display = e.target.value ? 'block' : 'none'
    if (!e.target.value && badge) badge.style.display = 'none'
  })
  clear.addEventListener('click', clearSelection)
}

/* ═══════════════════════════════════════
   TOGGLE GROUPS
   ═══════════════════════════════════════ */
function bindToggleGroup(groupId, onSelect) {
  const group = document.getElementById(groupId)
  if (!group) return
  group.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      group.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      onSelect(btn.dataset.val)
    })
  })
}

function setActiveToggle(groupId, val) {
  const group = document.getElementById(groupId)
  if (!group) return
  group.querySelectorAll('.toggle-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.val === String(val))
  )
}

/* ═══════════════════════════════════════
   APPLY ISO STANDARD → auto-fill state
   ═══════════════════════════════════════ */
function applyStandard(std) {
  if (!std) {
    state.isoCode  = ''
    state.isoLabel = ''
    state.iconKey  = null
    showManualFields(true)
    updatePreview()
    return
  }
  state.isoCode  = std.code
  state.isoLabel = std.label
  state.iconKey  = std.icon
  state.type     = std.type
  state.subtype  = std.subtype

  // Reflect in manual toggles (even if hidden, keep in sync)
  setActiveToggle('tg-type', std.type)
  applyTypeVisibility(std.type)
  if (std.type === 'screw')  setActiveToggle('tg-screw-sub', std.subtype)
  if (std.type === 'nut')    setActiveToggle('tg-nut-sub',   std.subtype)
  if (std.type === 'tnut')   setActiveToggle('tg-tnut-sub',  std.subtype)

  // Hide manual type/head fields when standard is selected
  showManualFields(false)
  updatePreview()
}

function applyBatchStandard(std) {
  if (!std) { batch.isoCode = ''; batch.isoLabel = ''; batch.iconKey = null; return }
  batch.isoCode  = std.code
  batch.isoLabel = std.label
  batch.iconKey  = std.icon
  batch.type     = std.type
  batch.subtype  = std.subtype
}

function showManualFields(show) {
  document.getElementById('manual-fields').style.display = show ? '' : 'none'
}

/* ═══════════════════════════════════════
   TYPE VISIBILITY
   ═══════════════════════════════════════ */
function applyTypeVisibility(type) {
  document.getElementById('field-screw-sub').style.display = type === 'screw'  ? '' : 'none'
  document.getElementById('field-nut-sub').style.display   = type === 'nut'    ? '' : 'none'
  document.getElementById('field-tnut-sub').style.display  = type === 'tnut'   ? '' : 'none'
  document.getElementById('field-length').style.display    = type === 'screw'  ? '' : 'none'
  document.getElementById('field-note').style.display      = type === 'custom' ? 'none' : ''
  document.getElementById('field-size').style.display      = (type === 'custom' || type === 'bearing') ? 'none' : ''
  document.getElementById('field-custom').style.display    = type === 'custom' ? '' : 'none'
}

/* ═══════════════════════════════════════
   BATCH CHECKBOXES
   ═══════════════════════════════════════ */
function buildLengthGrid() {
  const grid = document.getElementById('len-grid')
  LENGTHS.forEach(l => {
    const el = document.createElement('div')
    el.className = 'len-check' + (batch.lengths.has(l) ? ' checked' : '')
    el.innerHTML = `<span>${l}</span>`
    el.addEventListener('click', () => {
      if (batch.lengths.has(l)) { batch.lengths.delete(l); el.classList.remove('checked') }
      else { batch.lengths.add(l); el.classList.add('checked') }
    })
    grid.appendChild(el)
  })
}

/* ═══════════════════════════════════════
   BATCH CONFIG HELPER
   ═══════════════════════════════════════ */
function batchCfg() {
  return {
    ...state,
    isoCode:  batch.isoCode,
    isoLabel: batch.isoLabel,
    iconKey:  batch.iconKey,
    type:     batch.type    || state.type,
    subtype:  batch.subtype || state.subtype,
    size:     batch.size,
    note:     batch.note,
    showIcon: true, showSub: true, showIso: true, border: false,
  }
}

/* ═══════════════════════════════════════
   INIT
   ═══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  loadState()

  // Mode tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const mode = tab.dataset.mode
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
      tab.classList.add('active')
      document.getElementById('view-single').style.display = mode === 'single' ? '' : 'none'
      document.getElementById('view-batch').style.display  = mode === 'batch'  ? '' : 'none'
    })
  })

  // ISO dropdowns
  buildISODropdown('iso-input', 'iso-dropdown', 'iso-clear', 'iso-selected-badge', applyStandard)
  buildISODropdown('batch-iso-input', 'batch-iso-dropdown', 'batch-iso-clear', 'batch-iso-badge', applyBatchStandard)

  // Manual type selector
  bindToggleGroup('tg-type', val => {
    state.type    = val
    state.subtype = TYPE_DEFAULTS[val] || ''
    state.iconKey = null
    applyTypeVisibility(val)
    setActiveToggle('tg-screw-sub', TYPE_DEFAULTS.screw)
    setActiveToggle('tg-nut-sub',   TYPE_DEFAULTS.nut)
    setActiveToggle('tg-tnut-sub',  TYPE_DEFAULTS.tnut)
    updatePreview()
  })
  bindToggleGroup('tg-screw-sub', val => { state.subtype = val; updatePreview() })
  bindToggleGroup('tg-nut-sub',   val => { state.subtype = val; updatePreview() })
  bindToggleGroup('tg-tnut-sub',  val => { state.subtype = val; updatePreview() })

  // Size, length, note
  document.getElementById('sel-size').addEventListener('change',  e => { state.size   = e.target.value; updatePreview() })
  document.getElementById('inp-length').addEventListener('input',  e => { state.length = e.target.value; updatePreview() })
  document.getElementById('inp-note').addEventListener('input',    e => { state.note   = e.target.value; updatePreview() })
  document.getElementById('inp-pitch').addEventListener('input',   e => { state.pitch  = e.target.value; updatePreview() })

  // Custom fields
  document.getElementById('inp-main').addEventListener('input', e => { state.customMain = e.target.value; updatePreview() })
  document.getElementById('inp-sub').addEventListener('input',  e => { state.customSub  = e.target.value; updatePreview() })
  document.getElementById('inp-custom-note').addEventListener('input', e => { state.note = e.target.value; updatePreview() })

  // Advanced toggle
  document.getElementById('adv-toggle').addEventListener('click', () => {
    const open = document.getElementById('adv-body').classList.toggle('open')
    document.getElementById('adv-arrow').classList.toggle('open', open)
  })

  // Label settings
  bindToggleGroup('tg-height', val => { state.height = +val; updatePreview() })
  document.getElementById('sw-icon').addEventListener('change',   e => { state.showIcon = e.target.checked; updatePreview() })
  document.getElementById('sw-sub').addEventListener('change',    e => { state.showSub  = e.target.checked; updatePreview() })
  document.getElementById('sw-iso').addEventListener('change',    e => { state.showIso  = e.target.checked; updatePreview() })
  document.getElementById('sw-border').addEventListener('change', e => { state.border = e.target.checked; updatePreview() })
  document.getElementById('sw-dark').addEventListener('change',   e => { state.dark   = e.target.checked; updatePreview() })
  document.getElementById('sel-ql-tape').addEventListener('change', e => { state.qlTape = e.target.value; saveState() })
  bindToggleGroup('tg-ql-rotate', val => { state.qlRotate = val; saveState() })
  document.getElementById('width-slider').addEventListener('input', e => {
    state.width = +e.target.value
    document.getElementById('width-val').textContent = e.target.value + ' mm'
    updatePreview()
  })

  // Single downloads
  document.getElementById('btn-svg').addEventListener('click', () => dlSVG(state, generateSVG(state)))
  document.getElementById('btn-png').addEventListener('click', async () => {
    const btn = document.getElementById('btn-png')
    btn.disabled = true
    try { await dlPNG(state) }
    finally { btn.disabled = false }
  })
  document.getElementById('btn-pdf').addEventListener('click', () => dlPDF(state, generateSVG(state)))
  document.getElementById('btn-lbx').addEventListener('click', async () => {
    const btn = document.getElementById('btn-lbx')
    btn.disabled = true; btn.textContent = '⏳ Generating…'
    try { await dlLBX(state) }
    finally { btn.disabled = false; btn.textContent = '↓ LBX (Brother P-Touch)' }
  })

  // QL direct print — check companion on startup, update button accordingly
  let _companionOk = false
  const qlBtn = document.getElementById('btn-ql')

  checkCompanion().then(info => {
    _companionOk = !!info
    if (info) {
      qlBtn.textContent = '⚡ Direct Print (QL)'
      qlBtn.title = `Companion connected • ${info.model} • ${info.printer}`
    }
  })

  qlBtn.addEventListener('click', async () => {
    if (_companionOk) {
      qlBtn.disabled = true
      const prev = qlBtn.textContent
      qlBtn.textContent = '⏳ Printing…'
      try {
        await directPrint(state, state.qlTape || '29', state.qlRotate || 'ccw')
        qlBtn.textContent = '✓ Sent!'
        setTimeout(() => { qlBtn.textContent = prev; qlBtn.disabled = false }, 2000)
      } catch (e) {
        qlBtn.textContent = '✗ Failed'
        alert(`Print error: ${e.message}`)
        setTimeout(() => { qlBtn.textContent = prev; qlBtn.disabled = false }, 2000)
      }
    } else {
      printQL(state, parseInt(state.qlTape || '29', 10))
    }
  })

  document.getElementById('btn-copy').addEventListener('click', async () => {
    const btn = document.getElementById('btn-copy')
    btn.disabled = true; btn.textContent = '⏳'
    try {
      const canvas = await renderLabel(state, 300)
      const blob   = await new Promise(r => canvas.toBlob(r, 'image/png'))
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      btn.textContent = '✓ Copied!'
      setTimeout(() => { btn.textContent = '⎘ Copy PNG'; btn.disabled = false }, 1800)
      return
    } catch (_) {}
    // Clipboard API not available — fall back to download
    const canvas = await renderLabel(state, 300)
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png'); a.download = 'label.png'; a.click()
    btn.textContent = '⎘ Copy PNG'; btn.disabled = false
  })

  // Batch
  document.getElementById('batch-size').addEventListener('change', e => { batch.size = e.target.value })
  document.getElementById('batch-note').addEventListener('input',  e => { batch.note = e.target.value })

  document.getElementById('btn-batch-zip').addEventListener('click', async () => {
    if (!batch.lengths.size) { alert('Select at least one length.'); return }
    const zip = new JSZip()
    const cfg = batchCfg()
    for (const len of [...batch.lengths].sort((a,b)=>a-b)) {
      cfg.length = String(len)
      zip.file(`${safeName(cfg)}.svg`, generateSVG(cfg))
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${batch.size}_${batch.subtype}_labels.zip`
    a.click()
  })

  document.getElementById('btn-batch-lbx').addEventListener('click', async () => {
    if (!batch.lengths.size) { alert('Select at least one length.'); return }
    const btn = document.getElementById('btn-batch-lbx')
    btn.disabled = true; btn.textContent = '⏳ Generating…'
    const cfg = batchCfg()
    try { await dlLBXBatch(cfg, batch.lengths) }
    finally { btn.disabled = false; btn.textContent = '↓ ZIP (LBX Brother)' }
  })

  buildLengthGrid()
  syncUIToState()
  updatePreview()
})
