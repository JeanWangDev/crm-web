import dayjs from 'dayjs'

/** 导出当前筛选结果为带 BOM 的 CSV（Excel 可直接打开中文） */
export function exportCsv(filenamePrefix: string, header: string[], rows: Array<Array<string | number | null | undefined>>) {
  const lines = rows.map((row) =>
    row
      .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
      .join(','),
  )
  const bom = '\uFEFF'
  const blob = new Blob([bom + [header.join(','), ...lines].join('\n')], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filenamePrefix}_${dayjs().format('YYYYMMDD_HHmmss')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
