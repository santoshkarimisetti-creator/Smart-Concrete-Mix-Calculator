/**
 * exportExcel.js
 * Generates valid .xlsx (OOXML) workbooks in the browser using fflate for ZIP.
 *
 * Key implementation details verified against openpyxl reference output:
 *  - workbook.xml uses the correct /2006/main namespace
 *  - workbook.xml.rels uses absolute Target paths (/xl/...)
 *  - Cells use t="s" shared strings (NOT inlineStr which Excel rejects)
 *  - xl/sharedStrings.xml is included and referenced
 *  - Worksheet includes <dimension> element
 *
 * Public API (both functions are synchronous from the caller's perspective):
 *   downloadResultExcel(formData, result, costResult)  — Calculator page
 *   downloadCalculationExcel(record)                   — History page
 */

import { zipSync, strToU8 } from 'fflate'

// ─── Filename helper ──────────────────────────────────────────────────────────

function makeFilename(grade) {
  const date = new Date().toISOString().slice(0, 10)
  return `Smart-Concrete-Mix-${(grade || 'Mix').replace(/\s+/g, '')}-${date}.xlsx`
}

// ─── XML escape ───────────────────────────────────────────────────────────────

function xe(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// ─── Column letter ────────────────────────────────────────────────────────────

function colLetter(idx) {
  let s = '', n = idx + 1
  while (n > 0) {
    s = String.fromCharCode(64 + (n % 26 || 26)) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

// ─── Shared strings ───────────────────────────────────────────────────────────

/**
 * Collect all unique non-empty strings across all sheets, assign sequential
 * indices, and produce the xl/sharedStrings.xml content.
 * @returns {{ index: Map<string,number>, xml: string }}
 */
function buildSharedStrings(allSheets) {
  const index = new Map()
  for (const rows of allSheets)
    for (const row of rows)
      for (const cell of row)
        if (cell && cell.v && !index.has(cell.v))
          index.set(cell.v, index.size)

  let items = ''
  for (const [str] of index)
    items += `<si><t xml:space="preserve">${xe(str)}</t></si>`

  const count = index.size
  const xml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"' +
    ` count="${count}" uniqueCount="${count}">` +
    items +
    '</sst>'

  return { index, xml }
}

// ─── Worksheet XML ────────────────────────────────────────────────────────────

function worksheetXml(rows, ssIndex) {
  // Calculate the dimension extent
  let maxRow = 0, maxCol = 0
  let sheetData = ''

  rows.forEach((row, ri) => {
    let rowCells = ''
    row.forEach((cell, ci) => {
      if (!cell || cell.v == null || cell.v === '') return
      const si = ssIndex.get(cell.v)
      if (si == null) return
      const ref = `${colLetter(ci)}${ri + 1}`
      rowCells += `<c r="${ref}" t="s"><v>${si}</v></c>`
      if (ri + 1 > maxRow) maxRow = ri + 1
      if (ci + 1 > maxCol) maxCol = ci + 1
    })
    if (rowCells) sheetData += `<row r="${ri + 1}">${rowCells}</row>`
  })

  const dimRef = maxRow > 0
    ? `${colLetter(0)}1:${colLetter(maxCol - 1)}${maxRow}`
    : 'A1'

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"' +
    ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    `<dimension ref="${dimRef}"/>` +
    '<sheetViews><sheetView workbookViewId="0"/></sheetViews>' +
    '<sheetFormatPr defaultRowHeight="15"/>' +
    '<cols>' +
    '<col min="1" max="1" width="36" customWidth="1"/>' +
    '<col min="2" max="2" width="26" customWidth="1"/>' +
    '</cols>' +
    '<sheetData>' + sheetData + '</sheetData>' +
    '<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>' +
    '</worksheet>'
  )
}

// ─── OOXML package parts ──────────────────────────────────────────────────────

const SHEET_NAMES = [
  'Project Inputs',
  'Mix Design Results',
  'Absolute Volumes',
  'Cost Estimation',
]

// Relationship layout in xl/_rels/workbook.xml.rels (absolute targets):
//   rId1 → /xl/worksheets/sheet1.xml
//   rId2 → /xl/worksheets/sheet2.xml
//   rId3 → /xl/worksheets/sheet3.xml
//   rId4 → /xl/worksheets/sheet4.xml
//   rId5 → /xl/sharedStrings.xml
//   rId6 → /xl/styles.xml
//   rId7 → /xl/theme/theme1.xml
// workbook.xml sheet elements reference rId1–rId4.

function contentTypesXml() {
  const sheetOverrides = SHEET_NAMES.map((_, i) =>
    `<Override PartName="/xl/worksheets/sheet${i + 1}.xml"` +
    ` ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  ).join('')

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml"' +
    ' ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    '<Override PartName="/xl/styles.xml"' +
    ' ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
    '<Override PartName="/xl/theme/theme1.xml"' +
    ' ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>' +
    '<Override PartName="/xl/sharedStrings.xml"' +
    ' ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>' +
    sheetOverrides +
    '</Types>'
  )
}

// _rels/.rels — points to the workbook
const ROOT_RELS_XML =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1"' +
  ' Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"' +
  ' Target="/xl/workbook.xml"/>' +
  '</Relationships>'

// xl/workbook.xml — uses correct /2006/main namespace
function workbookXml() {
  const sheetEls = SHEET_NAMES
    .map((name, i) =>
      `<sheet xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"` +
      ` name="${xe(name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`
    )
    .join('')

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"' +
    ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    '<workbookPr/>' +
    '<bookViews><workbookView activeTab="0"/></bookViews>' +
    `<sheets>${sheetEls}</sheets>` +
    '</workbook>'
  )
}

// xl/_rels/workbook.xml.rels — absolute target paths
function workbookRelsXml() {
  const sheetRels = SHEET_NAMES
    .map((_, i) =>
      `<Relationship Id="rId${i + 1}"` +
      ` Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"` +
      ` Target="/xl/worksheets/sheet${i + 1}.xml"/>`
    )
    .join('')

  const n = SHEET_NAMES.length // 4
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    sheetRels +
    `<Relationship Id="rId${n + 1}"` +
    ` Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings"` +
    ` Target="/xl/sharedStrings.xml"/>` +
    `<Relationship Id="rId${n + 2}"` +
    ` Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles"` +
    ` Target="/xl/styles.xml"/>` +
    `<Relationship Id="rId${n + 3}"` +
    ` Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme"` +
    ` Target="/xl/theme/theme1.xml"/>` +
    '</Relationships>'
  )
}

// xl/styles.xml — minimal valid styles using correct /2006/main namespace
const STYLES_XML =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<numFmts count="0"/>' +
  '<fonts count="1">' +
    '<font><sz val="11"/><name val="Calibri"/><family val="2"/></font>' +
  '</fonts>' +
  '<fills count="2">' +
    '<fill><patternFill patternType="none"/></fill>' +
    '<fill><patternFill patternType="gray125"/></fill>' +
  '</fills>' +
  '<borders count="1">' +
    '<border><left/><right/><top/><bottom/><diagonal/></border>' +
  '</borders>' +
  '<cellStyleXfs count="1">' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>' +
  '</cellStyleXfs>' +
  '<cellXfs count="1">' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
  '</cellXfs>' +
  '<cellStyles count="1">' +
    '<cellStyle name="Normal" xfId="0" builtinId="0"/>' +
  '</cellStyles>' +
  '</styleSheet>'

// xl/theme/theme1.xml — standard Office theme
const THEME_XML =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme">' +
  '<a:themeElements>' +
  '<a:clrScheme name="Office">' +
    '<a:dk1><a:sysClr lastClr="000000" val="windowText"/></a:dk1>' +
    '<a:lt1><a:sysClr lastClr="FFFFFF" val="window"/></a:lt1>' +
    '<a:dk2><a:srgbClr val="44546A"/></a:dk2>' +
    '<a:lt2><a:srgbClr val="E7E6E6"/></a:lt2>' +
    '<a:accent1><a:srgbClr val="4472C4"/></a:accent1>' +
    '<a:accent2><a:srgbClr val="ED7D31"/></a:accent2>' +
    '<a:accent3><a:srgbClr val="A9D18E"/></a:accent3>' +
    '<a:accent4><a:srgbClr val="FFC000"/></a:accent4>' +
    '<a:accent5><a:srgbClr val="5B9BD5"/></a:accent5>' +
    '<a:accent6><a:srgbClr val="70AD47"/></a:accent6>' +
    '<a:hlink><a:srgbClr val="0563C1"/></a:hlink>' +
    '<a:folHlink><a:srgbClr val="954F72"/></a:folHlink>' +
  '</a:clrScheme>' +
  '<a:fontScheme name="Office">' +
    '<a:majorFont><a:latin typeface="Calibri Light"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>' +
    '<a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont>' +
  '</a:fontScheme>' +
  '<a:fmtScheme name="Office">' +
    '<a:fillStyleLst>' +
      '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>' +
      '<a:gradFill rotWithShape="1"><a:gsLst>' +
        '<a:gs pos="0"><a:schemeClr val="phClr"><a:lumMod val="110000"/><a:satMod val="105000"/><a:tint val="67000"/></a:schemeClr></a:gs>' +
        '<a:gs pos="50000"><a:schemeClr val="phClr"><a:lumMod val="105000"/><a:satMod val="103000"/><a:tint val="73000"/></a:schemeClr></a:gs>' +
        '<a:gs pos="100000"><a:schemeClr val="phClr"><a:lumMod val="105000"/><a:satMod val="109000"/><a:tint val="81000"/></a:schemeClr></a:gs>' +
      '</a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill>' +
      '<a:gradFill rotWithShape="1"><a:gsLst>' +
        '<a:gs pos="0"><a:schemeClr val="phClr"><a:satMod val="103000"/><a:lumMod val="102000"/><a:tint val="94000"/></a:schemeClr></a:gs>' +
        '<a:gs pos="50000"><a:schemeClr val="phClr"><a:satMod val="110000"/><a:lumMod val="100000"/><a:shade val="100000"/></a:schemeClr></a:gs>' +
        '<a:gs pos="100000"><a:schemeClr val="phClr"><a:lumMod val="99000"/><a:satMod val="120000"/><a:shade val="78000"/></a:schemeClr></a:gs>' +
      '</a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill>' +
    '</a:fillStyleLst>' +
    '<a:lnStyleLst>' +
      '<a:ln w="6350" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln>' +
      '<a:ln w="12700" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln>' +
      '<a:ln w="19050" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln>' +
    '</a:lnStyleLst>' +
    '<a:effectStyleLst>' +
      '<a:effectStyle><a:effectLst/></a:effectStyle>' +
      '<a:effectStyle><a:effectLst/></a:effectStyle>' +
      '<a:effectStyle><a:effectLst><a:outerShdw blurRad="57150" dist="19050" dir="5400000" algn="ctr" rotWithShape="0"><a:srgbClr val="000000"><a:alpha val="63000"/></a:srgbClr></a:outerShdw></a:effectLst></a:effectStyle>' +
    '</a:effectStyleLst>' +
    '<a:bgFillStyleLst>' +
      '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>' +
      '<a:solidFill><a:schemeClr val="phClr"><a:tint val="95000"/><a:satMod val="170000"/></a:schemeClr></a:solidFill>' +
      '<a:gradFill rotWithShape="1"><a:gsLst>' +
        '<a:gs pos="0"><a:schemeClr val="phClr"><a:tint val="93000"/><a:satMod val="150000"/><a:shade val="98000"/><a:lumMod val="102000"/></a:schemeClr></a:gs>' +
        '<a:gs pos="50000"><a:schemeClr val="phClr"><a:tint val="98000"/><a:satMod val="130000"/><a:shade val="90000"/><a:lumMod val="103000"/></a:schemeClr></a:gs>' +
        '<a:gs pos="100000"><a:schemeClr val="phClr"><a:shade val="63000"/><a:satMod val="120000"/></a:schemeClr></a:gs>' +
      '</a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill>' +
    '</a:bgFillStyleLst>' +
  '</a:fmtScheme>' +
  '</a:themeElements>' +
  '</a:theme>'

// ─── Pack and download ────────────────────────────────────────────────────────

function packAndDownload(allSheets, grade) {
  const { index: ssIndex, xml: ssXml } = buildSharedStrings(allSheets)

  const sheetXmls = allSheets.map((rows) => worksheetXml(rows, ssIndex))

  const entries = {}
  const add = (path, xml) => { entries[path] = [strToU8(xml), { level: 0 }] }

  add('[Content_Types].xml',        contentTypesXml())
  add('_rels/.rels',                ROOT_RELS_XML)
  add('xl/workbook.xml',            workbookXml())
  add('xl/_rels/workbook.xml.rels', workbookRelsXml())
  add('xl/styles.xml',              STYLES_XML)
  add('xl/theme/theme1.xml',        THEME_XML)
  add('xl/sharedStrings.xml',       ssXml)
  sheetXmls.forEach((xml, i) => add(`xl/worksheets/sheet${i + 1}.xml`, xml))

  const zip  = zipSync(entries)
  const blob = new Blob([zip], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  const filename = makeFilename(grade)
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Cell helpers ─────────────────────────────────────────────────────────────

/** Plain string cell */
const sc = (v) => ({ v: String(v ?? '') })

/**
 * Formatted numeric cell.
 * Returns a string cell: "{n.toFixed(digits)} {unit}" or `fallback` when absent.
 */
const fc = (v, unit = '', digits = 2, fallback = '—') => {
  if (v == null || v === '') return sc(fallback)
  const n = Number(v)
  if (!Number.isFinite(n)) return sc(fallback)
  return sc(unit ? `${n.toFixed(digits)} ${unit}` : n.toFixed(digits))
}

// ─── Sheet builder ────────────────────────────────────────────────────────────

function buildSheet(title, dataRows) {
  return [
    [sc(title), sc('')],
    [sc('Field'), sc('Value')],
    ...dataRows.map(([label, cell]) => [sc(label), cell]),
  ]
}

// ─── Public: Calculator page ──────────────────────────────────────────────────

export function downloadResultExcel(formData, result, costResult) {
  const adm     = Boolean(result?.admixture?.enabled)
  const hasCost = costResult != null

  const sheet1 = buildSheet('Project Inputs', [
    ['Concrete Grade',                    sc(formData.concreteGrade || '—')],
    ['Area',                              fc(formData.area, 'm2', 2)],
    ['Thickness',                         fc(formData.thickness, 'mm', 0)],
    ['Cement Type',                       sc(formData.cementType || '—')],
    ['Maximum Aggregate Size',            sc(formData.aggregateSize || '—')],
    ['Exposure Condition',                sc(formData.exposureCondition || '—')],
    ['Slump',                             fc(formData.slump, 'mm', 0)],
    ['Water-Cement Ratio',                fc(formData.waterCementRatio, '', 3)],
    ['Cement Specific Gravity',           fc(formData.cementSpecificGravity, '', 2)],
    ['Fine Aggregate Specific Gravity',   fc(formData.fineAggregateSpecificGravity, '', 2)],
    ['Coarse Aggregate Specific Gravity', fc(formData.coarseAggregateSpecificGravity, '', 2)],
    ['Admixture Used',                    sc(adm ? 'Yes' : 'No')],
    ['Admixture Type',                    sc(adm ? (formData.admixtureType || '—') : 'Not used')],
    ['Admixture Dosage',                  adm ? fc(formData.admixtureDosage, '%', 2)         : sc('Not used')],
    ['Admixture Specific Gravity',        adm ? fc(formData.admixtureSpecificGravity, '', 2) : sc('Not used')],
    ['Water Reduction',                   adm ? fc(formData.admixtureWaterReduction, '%', 2) : sc('Not used')],
  ])

  const sheet2 = buildSheet('Mix Design Results', [
    ['Concrete Volume',      fc(result?.volume?.concreteVolume,         'm3',     2)],
    ['Target Mean Strength', fc(result?.strength?.targetMeanStrength,   'MPa',    2)],
    ['Water Content',        fc(result?.water?.contentPerM3,            'kg/m3',  2)],
    ['Cement Content',       fc(result?.cement?.adoptedPerM3,           'kg/m3',  2)],
    ['Fine Aggregate',       fc(result?.aggregates?.fineKgPerM3,        'kg/m3',  2)],
    ['Coarse Aggregate',     fc(result?.aggregates?.coarseKgPerM3,      'kg/m3',  2)],
    ['Admixture Quantity',   adm ? fc(result?.admixture?.quantity, 'kg', 2) : sc('Not used')],
    ['Mix Ratio',            sc(result?.mixRatio?.formatted || '—')],
    ['Cement Bags',          fc(result?.cement?.bags, '', 2)],
  ])

  const cV   = result?.cement?.volume               ?? 0
  const wV   = result?.water?.volume                ?? 0
  const aggV = result?.aggregates?.totalVolumePerM3 ?? 0
  const admV = result?.admixture?.volume            ?? 0
  const airV = result?.air?.volume                  ?? 0
  const tot  = cV + wV + aggV + admV + airV

  const sheet3 = buildSheet('Absolute Volumes', [
    ['Cement Volume',            fc(result?.cement?.volume,                  'm3', 4)],
    ['Water Volume',             fc(result?.water?.volume,                   'm3', 4)],
    ['Fine Aggregate Volume',    fc(result?.aggregates?.fineVolumePerM3,     'm3', 4)],
    ['Coarse Aggregate Volume',  fc(result?.aggregates?.coarseVolumePerM3,   'm3', 4)],
    ['Aggregate Volume (Total)', fc(result?.aggregates?.totalVolumePerM3,    'm3', 4)],
    ['Admixture Volume',         adm ? fc(result?.admixture?.volume, 'm3', 4) : sc('Not used')],
    ['Air Volume',               fc(result?.air?.volume,                     'm3', 4)],
    ['Total Absolute Volume',    fc(tot > 0 ? tot : null,                    'm3', 4)],
  ])

  const sheet4 = buildSheet('Cost Estimation', [
    ['Cement Price',    hasCost ? fc(costResult.cementPrice,    'Rs/kg',    2) : sc('Not calculated')],
    ['Sand Price',      hasCost ? fc(costResult.sandPrice,      'Rs/kg',    2) : sc('Not calculated')],
    ['Aggregate Price', hasCost ? fc(costResult.aggregatePrice, 'Rs/kg',    2) : sc('Not calculated')],
    ['Water Price',     hasCost ? fc(costResult.waterPrice,     'Rs/litre', 4) : sc('Not calculated')],
    ['Admixture Price',
      adm && hasCost && costResult.admixturePrice != null
        ? fc(costResult.admixturePrice, 'Rs/kg', 2)
        : sc('Not used')],
    ['Total Cost',  hasCost ? fc(costResult.totalCost, 'Rs', 2) : sc('Not calculated')],
    ['Cost per m3', hasCost ? fc(costResult.costPerM3, 'Rs', 2) : sc('Not calculated')],
    ['Cost per m2', hasCost ? fc(costResult.costPerM2, 'Rs', 2) : sc('Not calculated')],
  ])

  packAndDownload([sheet1, sheet2, sheet3, sheet4], formData.concreteGrade)
}

// ─── Public: History page ─────────────────────────────────────────────────────

export function downloadCalculationExcel(record) {
  const adm     = Boolean(record.admixture)
  const hasCost = record.total_cost != null

  const sheet1 = buildSheet('Project Inputs', [
    ['Concrete Grade',                    sc(record.concrete_grade || '—')],
    ['Area',                              fc(record.area,                              'm2',  2)],
    ['Thickness',                         fc(record.thickness,                         'mm',  0)],
    ['Cement Type',                       sc(record.cement_type || '—')],
    ['Maximum Aggregate Size',            sc(record.aggregate_size || '—')],
    ['Exposure Condition',                sc(record.exposure_condition || '—')],
    ['Slump',                             fc(record.slump,                             'mm',  0)],
    ['Water-Cement Ratio',                fc(record.water_cement_ratio,                '',    3)],
    ['Cement Specific Gravity',           fc(record.cement_specific_gravity,           '',    2)],
    ['Fine Aggregate Specific Gravity',   fc(record.fine_aggregate_specific_gravity,   '',    2)],
    ['Coarse Aggregate Specific Gravity', fc(record.coarse_aggregate_specific_gravity, '',    2)],
    ['Admixture Used',                    sc(adm ? 'Yes' : 'No')],
    ['Admixture Type',                    sc(adm ? (record.admixture_type || '—') : 'Not used')],
    ['Admixture Dosage',                  adm ? fc(record.admixture_dosage,           '%', 2) : sc('Not used')],
    ['Admixture Specific Gravity',        adm ? fc(record.admixture_specific_gravity, '', 2)  : sc('Not used')],
    ['Water Reduction',                   adm ? fc(record.water_reduction_percent,    '%', 2) : sc('Not used')],
  ])

  const sheet2 = buildSheet('Mix Design Results', [
    ['Concrete Volume',      fc(record.concrete_volume,      'm3',    2)],
    ['Target Mean Strength', fc(record.target_mean_strength, 'MPa',   2)],
    ['Water Content',        fc(record.water_content,        'kg/m3', 2)],
    ['Cement Content',       fc(record.cement_content,       'kg/m3', 2)],
    ['Fine Aggregate',       fc(record.fine_aggregate,       'kg/m3', 2)],
    ['Coarse Aggregate',     fc(record.coarse_aggregate,     'kg/m3', 2)],
    ['Admixture Quantity',
      adm && (record.admixture_quantity ?? 0) > 0
        ? fc(record.admixture_quantity, 'kg', 2)
        : sc('Not used')],
    ['Mix Ratio',   sc(record.mix_ratio || '—')],
    ['Cement Bags', fc(record.cement_bags, '', 2)],
  ])

  const sheet3 = buildSheet('Absolute Volumes', [
    ['Cement Volume',            fc(record.cement_volume,    'm3', 4)],
    ['Water Volume',             fc(record.water_volume,     'm3', 4)],
    ['Fine Aggregate Volume',    sc('Not available')],
    ['Coarse Aggregate Volume',  sc('Not available')],
    ['Aggregate Volume (Total)', fc(record.aggregate_volume, 'm3', 4)],
    ['Admixture Volume',         adm ? fc(record.admixture_volume, 'm3', 4) : sc('Not used')],
    ['Air Volume',               sc('Not available')],
    ['Total Absolute Volume',    sc('Not available')],
  ])

  const sheet4 = buildSheet('Cost Estimation', [
    ['Cement Price',    hasCost ? fc(record.cement_price,    'Rs/kg',    2) : sc('Not calculated')],
    ['Sand Price',      hasCost ? fc(record.sand_price,      'Rs/kg',    2) : sc('Not calculated')],
    ['Aggregate Price', hasCost ? fc(record.aggregate_price, 'Rs/kg',    2) : sc('Not calculated')],
    ['Water Price',     hasCost ? fc(record.water_price,     'Rs/litre', 4) : sc('Not calculated')],
    ['Admixture Price',
      adm && hasCost && record.admixture_price != null
        ? fc(record.admixture_price, 'Rs/kg', 2)
        : sc('Not used')],
    ['Total Cost',  hasCost ? fc(record.total_cost,  'Rs', 2) : sc('Not calculated')],
    ['Cost per m3', hasCost ? fc(record.cost_per_m3, 'Rs', 2) : sc('Not calculated')],
    ['Cost per m2', hasCost ? fc(record.cost_per_m2, 'Rs', 2) : sc('Not calculated')],
  ])

  packAndDownload([sheet1, sheet2, sheet3, sheet4], record.concrete_grade)
}
