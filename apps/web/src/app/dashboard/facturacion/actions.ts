'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createInvoiceAction(data: any, items: any[]) {
  const supabase = createClient()
  
  const { data: invoice, error: invError } = await supabase
    .from('invoices')
    .insert(data)
    .select('id')
    .single()

  if (invError || !invoice) {
    throw new Error(invError?.message || 'Error al crear factura')
  }

  const validItems = items.filter(it => it.description.trim())
  if (validItems.length > 0) {
    const { error: itemsError } = await supabase.from('invoice_items').insert(
      validItems.map(it => ({
        invoice_id: invoice.id,
        description: it.description.trim(),
        quantity: it.quantity,
        unit_price: it.unit_price,
      }))
    )
    if (itemsError) throw new Error(itemsError.message)
  }

  revalidatePath('/dashboard/facturacion')
  return { success: true }
}

export async function deleteInvoiceAction(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('invoices').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/facturacion')
  return { success: true }
}

export async function updateInvoiceStatusAction(id: string, status: string) {
  const supabase = createClient()
  const { error } = await supabase.from('invoices').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/facturacion')
  return { success: true }
}
