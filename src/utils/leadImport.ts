import * as XLSX from 'xlsx'
import type { LeadImportRow } from '../api/leads'

/** 与导入模板、导出字段对齐（导入不要求创建人/时间） */
export const LEAD_IMPORT_HEADERS = ['姓名', '电话', '微信号', '来源', '状态', '归属顾问', '备注'] as const

const HEADER_MAP: Record<string, keyof LeadImportRow> = {
  姓名: 'studentName',
  学员姓名: 'studentName',
  电话: 'studentPhone',
  手机: 'studentPhone',
  学员电话: 'studentPhone',
  微信号: 'wechat',
  微信: 'wechat',
  来源: 'source',
  信息来源: 'source',
  状态: 'status',
  归属顾问: 'ownerName',
  顾问: 'ownerName',
  备注: 'remark',
}

function cellText(value: unknown) {
  if (value == null) return ''
  if (typeof value === 'number') return String(value)
  return String(value).trim()
}

export function downloadLeadImportTemplate() {
  const sheet = XLSX.utils.aoa_to_sheet([
    [...LEAD_IMPORT_HEADERS],
    ['张三', '13800138000', 'zhangsan_wx', '运营分配', '待联系', '', '旧系统导入示例'],
    ['李四', '13900139000', '', '广告', '跟进中', '', ''],
  ])
  sheet['!cols'] = LEAD_IMPORT_HEADERS.map(() => ({ wch: 14 }))
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, '意向线索')
  XLSX.writeFile(book, '意向线索导入模板.xlsx')
}

export function parseLeadImportFile(file: File): Promise<LeadImportRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.onload = () => {
      try {
        const data = new Uint8Array(reader.result as ArrayBuffer)
        const book = XLSX.read(data, { type: 'array' })
        const sheetName = book.SheetNames[0]
        if (!sheetName) {
          reject(new Error('Excel 里没有工作表'))
          return
        }
        const sheet = book.Sheets[sheetName]
        const matrix = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
          header: 1,
          defval: '',
          raw: false,
        })
        if (!matrix.length) {
          reject(new Error('表格是空的'))
          return
        }
        const headerCells = (matrix[0] || []).map((cell) => cellText(cell))
        const indexMap = new Map<number, keyof LeadImportRow>()
        headerCells.forEach((title, index) => {
          const key = HEADER_MAP[title]
          if (key) indexMap.set(index, key)
        })
        if (![...indexMap.values()].includes('studentName') || ![...indexMap.values()].includes('studentPhone')) {
          reject(new Error('表头必须包含「姓名」「电话」列，请先下载模板'))
          return
        }
        const rows: LeadImportRow[] = []
        for (let i = 1; i < matrix.length; i += 1) {
          const line = matrix[i] || []
          const row: LeadImportRow = { studentName: '', studentPhone: '' }
          let hasAny = false
          indexMap.forEach((field, col) => {
            const text = cellText(line[col])
            if (text) hasAny = true
            row[field] = text
          })
          if (!hasAny) continue
          rows.push(row)
        }
        if (!rows.length) {
          reject(new Error('没有读到有效数据行'))
          return
        }
        resolve(rows)
      } catch (error) {
        reject(error instanceof Error ? error : new Error('解析 Excel 失败'))
      }
    }
    reader.readAsArrayBuffer(file)
  })
}
