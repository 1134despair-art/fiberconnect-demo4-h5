export const downloadBlob = (blob: Blob, filename: string) => {
 const url = URL.createObjectURL(blob), link = document.createElement('a')
 link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove()
 window.setTimeout(() => URL.revokeObjectURL(url), 30000)
}
const safeCell = (value: unknown) => { const s = String(value ?? ''); return /^[=+@-]/.test(s) ? "'" + s : s }
export const recordsCsv = (rows: unknown[][]) => '\ufeff' + rows.map(row => row.map(value => '"' + safeCell(value).replace(/"/g, '""') + '"').join(',')).join('\r\n')
const xml = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
// SpreadsheetML 2003 is an Excel-readable XML document, not a renamed CSV/XLSX.
export const recordsExcelXml = (rows: unknown[][]) => '<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="熔接记录"><Table>' + rows.map(row => '<Row>' + row.map(value => '<Cell><Data ss:Type="String">' + xml(String(value ?? '')) + '</Data></Cell>').join('') + '</Row>').join('') + '</Table></Worksheet></Workbook>'
