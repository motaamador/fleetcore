export interface BcvResponse {
  fuente: string
  ultimaActualizacion: string
  tasas: {
    dollar: string
    euro: string
  }
}

/**
 * Obtiene la tasa del BCV actual desde nexove.net.
 * Utiliza ISR (revalidate) para almacenar en caché el resultado por 1 hora
 * y no agotar las peticiones a la API.
 */
export async function getBcvRate(): Promise<number | null> {
  try {
    const apiKey = process.env.BCV_API_KEY
    if (!apiKey) {
      console.warn('Falta BCV_API_KEY en las variables de entorno.')
      return null
    }

    const res = await fetch('https://www.nexove.net/api/bcv', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      next: { revalidate: 3600 }, // Caché por 3600 segundos (1 hora)
    })

    if (!res.ok) {
      console.error(`Error al consultar API BCV: ${res.status} ${res.statusText}`)
      return null
    }

    const data: BcvResponse = await res.json()
    
    // El string viene con coma "727,45", lo convertimos a número
    if (data.tasas && data.tasas.dollar) {
      const rateStr = data.tasas.dollar.replace(',', '.')
      const rate = parseFloat(rateStr)
      if (!isNaN(rate)) {
        return rate
      }
    }
    
    return null
  } catch (error) {
    console.error('Excepción al consultar API BCV:', error)
    return null
  }
}
