// composables/usePdfExport.ts
import { ElMessage } from 'element-plus'
import { todayYMD, toYMD } from '~/utils/dateFunctions'

export function usePdfExport($pdfMake: any) {
  function getAllFilteredRows(rows: any[] = [], filters: any = {}) {
    const { dateRange, q, status, sailing } = filters
    const [from, to] = dateRange || []
    const df = from ? toYMD(from) : null
    const dt = to ? toYMD(to) : null
    const ql = (q || '').toLowerCase()
    const sailFilter = (sailing || '').toLowerCase()

    return rows.filter((r) => {
      const dateStr = (r?.date || '').slice(0, 10)
      const service = (r?.service || '').toLowerCase()
      const sailingVal = (r?.sailing || '').toLowerCase()

      const matchesSearch = !ql || service.includes(ql) || sailingVal.includes(ql)
      const matchesSailing = !sailFilter || sailingVal.includes(sailFilter)
      const matchesDate = (!df || dateStr >= df) && (!dt || dateStr <= dt)
      const matchesStatus = !status || r?._myStatus === status
      return matchesSearch && matchesSailing && matchesDate && matchesStatus
    })
  }

  function formatPdfData(filteredRows: any[] = [], statusLabel: (s: string) => string) {
    return filteredRows.map((r) => [
      (r?.date || '').slice(0, 10),
      r?.sailing || '',
      r?.service || '',
      statusLabel?.(r?._myStatus || 'none') || '',
    ])
  }

  function exportPdf(data: any[][], filename: string) {
    if (!data?.length) {
      ElMessage?.info?.('No data to export')
      return
    }

    const header = [
      { text: 'Date', bold: true },
      { text: 'Sailing', bold: true },
      { text: 'Service', bold: true },
      { text: 'Status', bold: true },
    ]

    const body = [header, ...data] // важно: именно ...data

    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [24, 24, 24, 24],
      content: [
        {
          table: { headerRows: 1, widths: ['auto', 'auto', '*', 'auto'], body },
          layout: 'lightHorizontalLines',
        },
      ],
    }

    $pdfMake.createPdf(docDefinition).download(filename)
  }

  function handleExport(rows: any[], filters: any, statusLabel: (s: string) => string) {
    const filteredRows = getAllFilteredRows(rows, filters)
    const pdfData = formatPdfData(filteredRows, statusLabel)
    const filename = `Export-${todayYMD()}.pdf`
    exportPdf(pdfData, filename)
  }

  return { handleExport }
}
