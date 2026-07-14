'use client'

import { useTransition } from 'react'
import { RefreshCcw, Loader2 } from 'lucide-react'
import { simulateVehicleLocationsAction } from '@/app/dashboard/mapa/actions'
import { toast } from 'sonner'

export function SimulatorButton() {
  const [isPending, startTx] = useTransition()

  const handleSimulate = () => {
    startTx(async () => {
      const res = await simulateVehicleLocationsAction()
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Coordenadas actualizadas')
      }
    })
  }

  return (
    <button 
      onClick={handleSimulate}
      disabled={isPending}
      className="btn-secondary flex items-center gap-2"
      title="Generar coordenadas aleatorias de GPS para demostración"
    >
      {isPending ? (
        <><Loader2 className="w-4 h-4 animate-spin text-primary" /> Simulando...</>
      ) : (
        <><RefreshCcw className="w-4 h-4 text-primary" /> Simular GPS</>
      )}
    </button>
  )
}
