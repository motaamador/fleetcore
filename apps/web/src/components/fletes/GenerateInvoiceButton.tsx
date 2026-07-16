'use client'

import { useTransition } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import { generateInvoiceFromTripAction } from '@/app/dashboard/fletes/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function GenerateInvoiceButton({ tripId, hasPrice }: { tripId: string; hasPrice: boolean }) {
  const [isPending, startTx] = useTransition()
  const router = useRouter()

  const handleGenerate = () => {
    if (!hasPrice) {
      toast.error('Este flete no tiene precio registrado. Edítalo y agrega el precio en "Costos del Viaje".')
      return
    }

    startTx(async () => {
      const res = await generateInvoiceFromTripAction(tripId)
      if (res && 'error' in res && res.error) {
        toast.error(res.error)
      } else {
        toast.success('✅ Factura borrador creada en Facturación')
        router.push('/dashboard/facturacion')
      }
    })
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={isPending}
      className={`p-1.5 rounded transition-colors ${
        hasPrice
          ? 'text-primary-700 hover:bg-primary-50 hover:text-primary'
          : 'text-text-muted opacity-40 cursor-not-allowed'
      }`}
      title={hasPrice ? 'Generar Factura al Cliente' : 'Sin precio — edita el flete para agregar precio'}
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileText className="w-4 h-4" />
      )}
    </button>
  )
}
