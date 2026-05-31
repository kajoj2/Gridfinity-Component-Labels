// Each standard defines the component type, subtype, and icon automatically.
// This is the PRIMARY selector in the UI — picking a standard auto-fills everything.

export const STANDARDS = [
  // ── Screws: Socket Head ─────────────────────────────────────────────
  {
    code: 'ISO 4762',
    label: 'ISO 4762 / DIN 912',
    desc:  'Hexagon socket head cap screws',
    type:    'screw',
    subtype: 'socket_head',
    icon:    'din_912',
  },
  {
    code: 'ISO 7379',
    label: 'ISO 7379 / DIN 6912',
    desc:  'Hexagon socket head cap screws with low head',
    type:    'screw',
    subtype: 'socket_head',
    icon:    'iso_7379',
  },

  // ── Screws: Button Head ──────────────────────────────────────────────
  {
    code: 'ISO 7380',
    label: 'ISO 7380 / DIN 7380',
    desc:  'Hexagon socket button head cap screws',
    type:    'screw',
    subtype: 'button_head',
    icon:    'iso_7380',
  },

  // ── Screws: Flat/Countersunk Head ────────────────────────────────────
  {
    code: 'ISO 10642',
    label: 'ISO 10642 / DIN 7991',
    desc:  'Hexagon socket countersunk flat head screws',
    type:    'screw',
    subtype: 'flat_head',
    icon:    'din_7991',
  },
  {
    code: 'ISO 2009',
    label: 'ISO 2009 / DIN 963',
    desc:  'Slotted countersunk flat head screws',
    type:    'screw',
    subtype: 'flat_head',
    icon:    'din_963',
  },

  // ── Screws: Pan Head ─────────────────────────────────────────────────
  {
    code: 'ISO 14583',
    label: 'ISO 14583 / DIN 7985',
    desc:  'Hexalobular socket pan head screws',
    type:    'screw',
    subtype: 'pan_head',
    icon:    'din_7985',
  },
  {
    code: 'ISO 1580',
    label: 'ISO 1580 / DIN 85',
    desc:  'Slotted pan head screws',
    type:    'screw',
    subtype: 'pan_head',
    icon:    'din_85',
  },

  // ── Screws: Cylinder/Cheese Head ─────────────────────────────────────
  {
    code: 'ISO 1207',
    label: 'ISO 1207 / DIN 84',
    desc:  'Slotted cheese head screws',
    type:    'screw',
    subtype: 'pan_head',
    icon:    'din_84',
  },

  // ── Screws: Hex Head Bolts ───────────────────────────────────────────
  {
    code: 'ISO 4014',
    label: 'ISO 4014 / DIN 931',
    desc:  'Hexagon head bolts — part threaded',
    type:    'screw',
    subtype: 'hex_head',
    icon:    'iso_4014',
  },
  {
    code: 'ISO 4017',
    label: 'ISO 4017 / DIN 933',
    desc:  'Hexagon head bolts — fully threaded',
    type:    'screw',
    subtype: 'hex_head',
    icon:    'iso_4014',
  },

  // ── Set Screws ───────────────────────────────────────────────────────
  {
    code: 'ISO 4026',
    label: 'ISO 4026 / DIN 913',
    desc:  'Hexagon socket set screws — flat point',
    type:    'screw',
    subtype: 'set_screw',
    icon:    null,
  },
  {
    code: 'ISO 4029',
    label: 'ISO 4029 / DIN 916',
    desc:  'Hexagon socket set screws — cup point',
    type:    'screw',
    subtype: 'set_screw',
    icon:    null,
  },

  // ── Nuts ─────────────────────────────────────────────────────────────
  {
    code: 'ISO 4032',
    label: 'ISO 4032 / DIN 934',
    desc:  'Hexagon nuts — style 1',
    type:    'nut',
    subtype: 'hex_nut',
    icon:    'iso_4032',
  },
  {
    code: 'ISO 4035',
    label: 'ISO 4035 / DIN 439',
    desc:  'Hexagon thin nuts',
    type:    'nut',
    subtype: 'hex_nut',
    icon:    'din_934',
  },
  {
    code: 'DIN 985',
    label: 'DIN 985',
    desc:  'Hexagon nyloc nuts',
    type:    'nut',
    subtype: 'nyloc',
    icon:    'din_985',
  },

  // ── Washers ──────────────────────────────────────────────────────────
  {
    code: 'ISO 7089',
    label: 'ISO 7089 / DIN 125A',
    desc:  'Plain washers — normal series',
    type:    'washer',
    subtype: 'washer',
    icon:    'din_125',
  },
  {
    code: 'ISO 7093',
    label: 'ISO 7093 / DIN 9021',
    desc:  'Plain washers — large series',
    type:    'washer',
    subtype: 'washer',
    icon:    'din_9021',
  },

  // ── T-Nuts ───────────────────────────────────────────────────────────
  {
    code: 'DIN 508',
    label: 'DIN 508',
    desc:  'T-slot nuts',
    type:    'tnut',
    subtype: 'rollin',
    icon:    null,
  },

  // ── Threaded Inserts ─────────────────────────────────────────────────
  {
    code: 'INSERT',
    label: 'Threaded Insert',
    desc:  'Heat-set / press-fit threaded inserts',
    type:    'insert',
    subtype: 'insert',
    icon:    null,
  },
]

export const STANDARD_BY_CODE = Object.fromEntries(STANDARDS.map(s => [s.code, s]))
