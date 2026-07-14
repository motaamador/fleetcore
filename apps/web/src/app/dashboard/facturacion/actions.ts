'use server'

import { revalidatePath } from 'next/cache'
import { requireRole, handleActionError } from '@/lib/action-guard'
import {
  InvoiceCreateSchema,
  InvoiceItemSchema,
  InvoiceStatusSchema,
} from '@/lib/schemas'
import { z } from 'zod'

const ALLOWED_WRITE = ['admin', 'finance'] as const
const PATH = '/dashboard/facturacion'

export async function createInvoiceAction(data: unknown, items: unknown[]) {
  try {
    const { supabase } = await requireRole([...ALLOWED_WRITE])
    const parsed = InvoiceCreateSchema.parse(data)

    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .insert(parsed)
      .select('id')
      .single()

    if (invError || !invoice) throw new Error(invError?.message || 'Error al crear factura')

    const validItems = z.array(InvoiceItemSchema).parse(items).filter(it => it.description.trim())
    if (validItems.length > 0) {
      const { error: itemsError } = await supabase.from('invoice_items').insert(
        validItems.map(it => ({
          invoice_id:  invoice.id,
          description: it.description.trim(),
          quantity:    it.quantity,
          unit_price:  it.unit_price,
        }))
      )
      if (itemsError) throw new Error(itemsError.message)
    }

    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}

export async function updateInvoiceAction(id: string, data: unknown, items: unknown[]) {
  try {
    const { supabase } = await requireRole([...ALLOWED_WRITE])
    // Solo se puede editar facturas en borrador
    const { data: current } = await supabase
      .from('invoices').select('status').eq('id', id).single()
    if (current && !['borrador', 'emitida'].includes(current.status)) {
      throw new Error('Solo se pueden editar facturas en estado borrador o emitida.')
    }

    const parsed = InvoiceCreateSchema.partial().parse(data)
    const { error: invError } = await supabase.from('invoices').update(parsed).eq('id', id)
    if (invError) throw new Error(invError.message)

    // Reemplazar ítems: eliminar los existentes e insertar los nuevos
    await supabase.from('invoice_items').delete().eq('invoice_id', id)

    const validItems = z.array(InvoiceItemSchema).parse(items).filter(it => it.description.trim())
    if (validItems.length > 0) {
      const { error: itemsError } = await supabase.from('invoice_items').insert(
        validItems.map(it => ({
          invoice_id:  id,
          description: it.description.trim(),
          quantity:    it.quantity,
          unit_price:  it.unit_price,
        }))
      )
      if (itemsError) throw new Error(itemsError.message)
    }

    revalidatePath(PATH)
    revalidatePath(`/dashboard/facturacion/${id}`)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}

export async function deleteInvoiceAction(id: string) {
  try {
    const { supabase } = await requireRole([...ALLOWED_WRITE])
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}

export async function updateInvoiceStatusAction(id: string, status: string) {
  try {
    const { supabase } = await requireRole([...ALLOWED_WRITE])
    const { status: validStatus } = InvoiceStatusSchema.parse({ status })
    const { error } = await supabase.from('invoices').update({ status: validStatus }).eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}
