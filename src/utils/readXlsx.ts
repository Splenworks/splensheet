import JSZip from 'jszip'
import { Workbook, Worksheet } from '../types'

const colLetterToIndex = (letters: string): number => {
  let num = 0
  for (let i = 0; i < letters.length; i++) {
    num = num * 26 + (letters.charCodeAt(i) - 64)
  }
  return num - 1
}

export async function readXlsx(buffer: ArrayBuffer): Promise<Workbook> {
  const zip = await JSZip.loadAsync(buffer)
  const parser = new DOMParser()

  const workbookText = await zip.file('xl/workbook.xml')!.async('string')
  const workbookDoc = parser.parseFromString(workbookText, 'application/xml')
  const sheetElements = Array.from(workbookDoc.getElementsByTagName('sheet'))

  const sharedStrings: string[] = []
  const sharedFile = zip.file('xl/sharedStrings.xml')
  if (sharedFile) {
    const sharedText = await sharedFile.async('string')
    const sharedDoc = parser.parseFromString(sharedText, 'application/xml')
    const siNodes = Array.from(sharedDoc.getElementsByTagName('si'))
    for (const si of siNodes) {
      const t = si.getElementsByTagName('t')[0]
      sharedStrings.push(t?.textContent || '')
    }
  }

  const worksheets: Worksheet[] = []
  for (let i = 0; i < sheetElements.length; i++) {
    const sheetEl = sheetElements[i]
    const name = sheetEl.getAttribute('name') || `Sheet${i + 1}`
    const sheetPath = `xl/worksheets/sheet${i + 1}.xml`
    const sheetFile = zip.file(sheetPath)
    if (!sheetFile) continue
    const sheetText = await sheetFile.async('string')
    const sheetDoc = parser.parseFromString(sheetText, 'application/xml')
    const rowNodes = Array.from(sheetDoc.getElementsByTagName('row'))
    const data: (string | number | boolean | null)[][] = []
    for (const rowNode of rowNodes) {
      const cellNodes = Array.from(rowNode.getElementsByTagName('c'))
      const row: (string | number | boolean | null)[] = []
      for (const c of cellNodes) {
        const ref = c.getAttribute('r') || ''
        const colLetters = ref.replace(/[0-9]/g, '')
        const colIdx = colLetters ? colLetterToIndex(colLetters) : row.length
        const type = c.getAttribute('t')
        const vNode = c.getElementsByTagName('v')[0]
        let value: string | number | boolean | null = null
        if (vNode) {
          const text = vNode.textContent || ''
          if (type === 's') {
            value = sharedStrings[parseInt(text, 10)] || ''
          } else if (type === 'b') {
            value = text === '1'
          } else {
            const num = Number(text)
            value = isNaN(num) ? text : num
          }
        }
        row[colIdx] = value
      }
      data.push(row)
    }
    worksheets.push({ id: i + 1, name, data })
  }

  return { worksheets }
}
