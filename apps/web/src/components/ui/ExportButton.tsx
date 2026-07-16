'use client'

import { Download } from 'lucide-react'

interface ExportButtonProps {
  data: any[]
  filename: string
}

export function ExportButton({ data, filename }: ExportButtonProps) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert('No hay datos para exportar')
      return
    }

    // Extraer cabeceras (keys del primer objeto)
    const headers = Object.keys(data[0])
    
    // Convertir data a formato CSV (usando punto y coma para Excel en español)
    const csvContent = [
      headers.join(';'),
      ...data.map(row => 
        headers.map(header => {
          let cell = row[header] === null || row[header] === undefined ? '' : row[header]
          // Escapar comillas dobles y envolver en comillas si contiene punto y coma o saltos de línea
          cell = String(cell).replace(/"/g, '""')
          if (cell.search(/(";|;\n)/g) >= 0 || cell.includes(';')) {
            cell = `"${cell}"`
          }
          return cell
        }).join(';')
      )
    ].join('\n')

    // BOM para que Excel reconozca UTF-8 (tildes, ñ)
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF])
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' })
    
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <button 
      onClick={handleExport}
      className="btn-secondary flex items-center gap-2"
      title="Exportar a Excel (CSV)"
    >
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline">Exportar CSV</span>
    </button>
  )
}
