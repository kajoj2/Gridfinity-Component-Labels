export function dlPDF(cfg, svgStr) {
  const win = window.open('', '_blank')
  if (!win) { alert('Allow pop-ups to use PDF export.'); return }
  win.document.write(`<!DOCTYPE html><html><head><style>
    @page{size:${cfg.width}mm ${cfg.height}mm;margin:0}
    body{margin:0;background:white}svg{display:block;width:${cfg.width}mm;height:${cfg.height}mm}
  </style></head><body>${svgStr}<script>
    window.addEventListener('load',()=>{window.print();setTimeout(()=>window.close(),500)})
  <\/script></body></html>`)
  win.document.close()
}
