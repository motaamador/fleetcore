'use client'

import { useState } from 'react'
import { Download, Printer } from 'lucide-react'

interface ReportExportActionsProps {
  data: {
    financeData: Array<{ name: string; ingresos: number; gastos: number }>
    totalIngresos:  number
    totalGastos:    number
    margenNeto:     number
    sumPayrollsUSD: number
    sumMaintUSD:    number
    sumFuelUSD:     number
    reportTitle:    string
    generatedAt:    string
  }
}

export function ReportExportActions({ data }: ReportExportActionsProps) {
  const [isExporting, setIsExporting] = useState(false)

  function handlePrint() {
    window.print()
  }

  function handleCSV() {
    setIsExporting(true)

    const rows = [
      ['Período', 'Ingresos (USD)', 'Gastos (USD)', 'Balance (USD)'],
      ...data.financeData.map(m => [
        m.name,
        m.ingresos.toFixed(2),
        m.gastos.toFixed(2),
        (m.ingresos - m.gastos).toFixed(2),
      ]),
      [],
      ['RESUMEN', '', '', ''],
      ['Total Ingresos',   data.totalIngresos.toFixed(2),   '', ''],
      ['Total Gastos',     data.totalGastos.toFixed(2),     '', ''],
      ['Margen Neto',      data.margenNeto.toFixed(2),      '', ''],
      ['Nóminas pagadas',  data.sumPayrollsUSD.toFixed(2),  '', ''],
      ['Mantenimiento',    data.sumMaintUSD.toFixed(2),     '', ''],
      ['Combustible',      data.sumFuelUSD.toFixed(2),      '', ''],
      [],
      [`Generado: ${data.generatedAt}`, '', '', ''],
    ]

    const csv = rows.map(r => r.map(cell => {
      const s = String(cell ?? '')
      return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s
    }).join(',')).join('\n')

    const bom  = new Uint8Array([0xEF, 0xBB, 0xBF])
    const blob = new Blob([bom, csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `FleetCore_Reporte_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setTimeout(() => setIsExporting(false), 1000)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCSV}
        disabled={isExporting}
        className="btn-secondary flex items-center gap-2 text-sm print:hidden"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">{isExporting ? 'Exportando…' : 'Exportar CSV'}</span>
      </button>
      <button
        onClick={handlePrint}
        className="btn-secondary flex items-center gap-2 text-sm print:hidden"
      >
        <Printer className="w-4 h-4" />
        <span className="hidden sm:inline">Imprimir PDF</span>
      </button>
    </div>
  )
}
