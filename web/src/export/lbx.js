import JSZip from 'jszip'
import { safeName } from '../svg-gen.js'
import { renderLabel } from '../render.js'

// Brother P-Touch .lbx = ZIP containing label.xml + prop.xml + Object0.bmp
// BMP: 24-bit uncompressed, 1200 DPI (matching existing files in this repo)

const LBX_DPI  = 1200
const MM_TO_PT = 2.8346  // 1mm in PostScript points

// Canvas RGBA → uncompressed 24-bit BMP (BGR row order, top-down)
function canvasToBMP(canvas) {
  const ctx    = canvas.getContext('2d')
  const { width, height } = canvas
  const rgba   = ctx.getImageData(0, 0, width, height).data

  // Rows must be padded to 4-byte boundary
  const rowBytes   = width * 3
  const rowPadding = (4 - (rowBytes % 4)) % 4
  const rowStride  = rowBytes + rowPadding
  const pixelSize  = rowStride * height
  const fileSize   = 54 + pixelSize  // 14-byte file header + 40-byte DIB header

  const buf  = new ArrayBuffer(fileSize)
  const view = new DataView(buf)
  const u8   = new Uint8Array(buf)

  // BMP file header (14 bytes)
  u8[0] = 0x42; u8[1] = 0x4D            // 'BM'
  view.setUint32(2,  fileSize, true)     // total file size
  view.setUint32(6,  0,        true)     // reserved
  view.setUint32(10, 54,       true)     // offset to pixel data

  // BITMAPINFOHEADER (40 bytes)
  view.setUint32(14, 40,         true)   // header size
  view.setInt32( 18, width,      true)   // image width
  view.setInt32( 22, -height,    true)   // negative → top-down raster
  view.setUint16(26, 1,          true)   // color planes
  view.setUint16(28, 24,         true)   // bits per pixel
  view.setUint32(30, 0,          true)   // compression = BI_RGB (none)
  view.setUint32(34, pixelSize,  true)   // pixel data size
  const ppm = Math.round(LBX_DPI / 0.0254) // pixels per metre
  view.setInt32( 38, ppm,        true)   // X pixels/metre
  view.setInt32( 42, ppm,        true)   // Y pixels/metre
  view.setUint32(46, 0,          true)   // colours in palette
  view.setUint32(50, 0,          true)   // important colours

  // Pixel data: BGR (reversed from RGBA), row-padded, top-down
  let offset = 54
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4
      u8[offset++] = rgba[src + 2]   // B
      u8[offset++] = rgba[src + 1]   // G
      u8[offset++] = rgba[src + 0]   // R
    }
    offset += rowPadding
  }

  return u8
}

function generateLabelXML(cfg, pxW, pxH) {
  // All dimensions in PostScript points (pt), landscape orientation
  // In Brother's model: "width" = tape width (short side), "height" = label length (long side)
  const tapeW  = (cfg.height * MM_TO_PT).toFixed(1)  // tape width  e.g. 33.6pt for 12mm
  const labelL = (cfg.width  * MM_TO_PT).toFixed(1)  // label length e.g. 102pt for 36mm

  // Background rect: label area minus margins (5.6pt top+bottom, 2.8pt left+right)
  const bgW = ((cfg.width  * MM_TO_PT) - 5.6).toFixed(1)
  const bgH = ((cfg.height * MM_TO_PT) - 5.6).toFixed(1)

  // Original image dimensions in pt at LBX_DPI
  const imgWpt = (pxW * 72 / LBX_DPI).toFixed(1)
  const imgHpt = (pxH * 72 / LBX_DPI).toFixed(1)

  return `<?xml version="1.0" encoding="UTF-8"?><pt:document xmlns:pt="http://schemas.brother.info/ptouch/2007/lbx/main" xmlns:style="http://schemas.brother.info/ptouch/2007/lbx/style" xmlns:text="http://schemas.brother.info/ptouch/2007/lbx/text" xmlns:draw="http://schemas.brother.info/ptouch/2007/lbx/draw" xmlns:image="http://schemas.brother.info/ptouch/2007/lbx/image" xmlns:barcode="http://schemas.brother.info/ptouch/2007/lbx/barcode" xmlns:database="http://schemas.brother.info/ptouch/2007/lbx/database" xmlns:table="http://schemas.brother.info/ptouch/2007/lbx/table" xmlns:cable="http://schemas.brother.info/ptouch/2007/lbx/cable" version="1.7" generator="Gridfinity Label Generator"><pt:body currentSheet="Sheet 1" direction="LTR"><style:sheet name="Sheet 1"><style:paper media="0" width="${tapeW}pt" height="${labelL}pt" marginLeft="2.8pt" marginTop="5.6pt" marginRight="2.8pt" marginBottom="5.6pt" orientation="landscape" autoLength="false" monochromeDisplay="true" printColorDisplay="false" printColorsID="0" paperColor="#FFFFFF" paperInk="#000000" split="1" format="259" backgroundTheme="0" printerID="30256" printerName="Brother PT-P710BT"/><style:cutLine regularCut="0pt" freeCut=""/><style:backGround x="5.6pt" y="2.8pt" width="${bgW}pt" height="${bgH}pt" brushStyle="NULL" brushId="0" userPattern="NONE" userPatternId="0" color="#000000" printColorNumber="1" backColor="#FFFFFF" backPrintColorNumber="0"/><pt:objects><image:image><pt:objectStyle x="0pt" y="2.8pt" width="${labelL}pt" height="${bgH}pt" backColor="#FFFFFF" backPrintColorNumber="0" ropMode="COPYPEN" angle="0" anchor="TOPLEFT" flip="NONE"><pt:pen style="NULL" widthX="0.5pt" widthY="0.5pt" color="#000000" printColorNumber="1"/><pt:brush style="NULL" color="#000000" printColorNumber="1" id="0"/><pt:expanded objectName="Image1" ID="0" lock="2" templateMergeTarget="LABELLIST" templateMergeType="NONE" templateMergeID="0" linkStatus="NONE" linkID="0"/></pt:objectStyle><image:imageStyle originalName="label.png" alignInText="LEFT" firstMerge="true" fileName="Object0.bmp"><image:transparent flag="false" color="#FFFFFF"/><image:trimming flag="true" shape="RECTANGLE" trimOrgX="0pt" trimOrgY="0pt" trimOrgWidth="${imgWpt}pt" trimOrgHeight="${imgHpt}pt"/><image:orgPos x="0pt" y="2.8pt" width="${labelL}pt" height="${bgH}pt"/><image:effect effect="NONE" brightness="50" contrast="50" photoIndex="4"/><image:mono operationKind="BINARY" reverse="0" ditherKind="MESH" threshold="128" gamma="100" ditherEdge="0" rgbconvProportionRed="30" rgbconvProportionGreen="59" rgbconvProportionBlue="11" rgbconvProportionReversed="0"/></image:imageStyle></image:image></pt:objects></style:sheet></pt:body></pt:document>`
}

function generatePropXML() {
  const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z')
  return `<?xml version="1.0" encoding="UTF-8"?><meta:properties xmlns:meta="http://schemas.brother.info/ptouch/2007/lbx/meta" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/"><meta:appName>Gridfinity Label Generator</meta:appName><dc:title></dc:title><dc:subject></dc:subject><dc:creator></dc:creator><meta:keyword></meta:keyword><dc:description></dc:description><meta:template></meta:template><dcterms:created>${now}</dcterms:created><dcterms:modified>${now}</dcterms:modified><meta:lastPrinted></meta:lastPrinted><meta:modifiedBy></meta:modifiedBy><meta:revision>1</meta:revision><meta:editTime>0</meta:editTime><meta:numPages>1</meta:numPages><meta:numWords>0</meta:numWords><meta:numChars>0</meta:numChars><meta:security>0</meta:security><meta:transferScript></meta:transferScript></meta:properties>`
}

export async function dlLBX(cfg) {
  const canvas = await renderLabel(cfg, LBX_DPI)
  const bmp    = canvasToBMP(canvas)

  const zip = new JSZip()
  zip.file('label.xml', generateLabelXML(cfg, canvas.width, canvas.height))
  zip.file('prop.xml',  generatePropXML())
  zip.file('Object0.bmp', bmp)

  const blob = await zip.generateAsync({ type: 'blob' })
  const a    = document.createElement('a')
  a.href     = URL.createObjectURL(blob)
  a.download = `${safeName(cfg)}.lbx`
  a.click()
}

// Batch: multiple lengths → multiple .lbx files in a ZIP
export async function dlLBXBatch(baseCfg, lengths) {
  const zip = new JSZip()

  for (const len of [...lengths].sort((a, b) => a - b)) {
    const cfg    = { ...baseCfg, length: String(len) }
    const canvas = await renderLabel(cfg, LBX_DPI)
    const bmp    = canvasToBMP(canvas)

    const name = safeName(cfg)
    const inner = new JSZip()
    inner.file('label.xml',   generateLabelXML(cfg, canvas.width, canvas.height))
    inner.file('prop.xml',    generatePropXML())
    inner.file('Object0.bmp', bmp)
    zip.file(`${name}.lbx`, await inner.generateAsync({ type: 'blob' }))
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  const a    = document.createElement('a')
  a.href     = URL.createObjectURL(blob)
  a.download = `${baseCfg.size}_${baseCfg.subtype}_labels.zip`
  a.click()
}
