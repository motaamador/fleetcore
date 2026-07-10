import os

base_dir = "apps/web/src/components/facturacion"
actions_path = "apps/web/src/app/dashboard/facturacion/actions.ts"
page_path = "apps/web/src/app/dashboard/facturacion/page.tsx"

# 1. actions.ts
actions_content = """'use server'

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
"""
os.makedirs(os.path.dirname(actions_path), exist_ok=True)
with open(actions_path, "w") as f: f.write(actions_content)

# 2. DeleteInvoiceButton.tsx
delete_btn = """'use client'

import { useTransition } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteInvoiceAction } from '@/app/dashboard/facturacion/actions'

export function DeleteInvoiceButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!window.confirm(`¿Estás seguro de eliminar esta factura?`)) return
    startTransition(async () => {
      try { await deleteInvoiceAction(id) }
      catch (err: any) { alert(`Error al eliminar: ${err.message}`) }
    })
  }

  return (
    <button onClick={handleDelete} disabled={isPending} className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-bg rounded-md transition-colors disabled:opacity-50" title="Eliminar factura">
      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  )
}
"""
with open(f"{base_dir}/DeleteInvoiceButton.tsx", "w") as f: f.write(delete_btn)

# 3. Refactor NewInvoiceModal.tsx
with open(f"{base_dir}/NewInvoiceModal.tsx", "r") as f:
    new_modal = f.read()

new_modal = new_modal.replace("import { createClient } from '@/lib/supabase/client'", "import { createInvoiceAction } from '@/app/dashboard/facturacion/actions'")

handleSubmit_old = """    startTransition(async () => {
      const supabase = createClient()

      // 1. Crear la factura
      const { data: invoice, error: invError } = await supabase
        .from('invoices')
        .insert({
          invoice_num: '',   // El trigger lo genera automáticamente
          client_name: form.client_name.trim(),
          client_rif:  form.client_rif.trim()  || null,
          project_id:  form.project_id          || null,
          subtotal,
          tax_pct:     taxPct,
          currency:    form.currency,
          status:      'borrador',
          due_at:      form.due_date             || null,
          notes:       form.notes.trim()         || null,
        })
        .select('id')
        .single()

      if (invError || !invoice) {
        setErrors({ client_name: `Error: ${invError?.message}` })
        return
      }

      // 2. Insertar líneas de detalle
      const validItems = items.filter(it => it.description.trim())
      if (validItems.length > 0) {
        await supabase.from('invoice_items').insert(
          validItems.map(it => ({
            invoice_id:  invoice.id,
            description: it.description.trim(),
            quantity:    formatNum(it.quantity),
            unit_price:  formatNum(it.unit_price),
          }))
        )
      }

      setForm(INITIAL_FORM)
      setItems([newLineItem()])
      onSuccess()
      onClose()
    })"""

handleSubmit_new = """    startTransition(async () => {
      try {
        await createInvoiceAction({
          invoice_num: '',
          client_name: form.client_name.trim(),
          client_rif:  form.client_rif.trim()  || null,
          project_id:  form.project_id          || null,
          subtotal,
          tax_pct:     taxPct,
          currency:    form.currency,
          status:      'borrador',
          due_at:      form.due_date             || null,
          notes:       form.notes.trim()         || null,
        }, items.map(it => ({
            description: it.description.trim(),
            quantity: formatNum(it.quantity),
            unit_price: formatNum(it.unit_price),
        })))
        setForm(INITIAL_FORM)
        setItems([newLineItem()])
        onSuccess()
        handleClose()
      } catch (err: any) {
        setErrors({ client_name: `Error: ${err.message}` })
      }
    })"""

new_modal = new_modal.replace(handleSubmit_old, handleSubmit_new)
with open(f"{base_dir}/NewInvoiceModal.tsx", "w") as f: f.write(new_modal)

# 4. Refactor page.tsx
with open(page_path, "r") as f:
    page = f.read()

page = page.replace("import { NewInvoiceButton } from '@/components/facturacion/NewInvoiceButton'", "import { NewInvoiceButton } from '@/components/facturacion/NewInvoiceButton'\nimport { DeleteInvoiceButton } from '@/components/facturacion/DeleteInvoiceButton'\nimport { SearchInput } from '@/components/ui/SearchInput'")
page = page.replace("export const metadata: Metadata = { title: 'Facturación | FleetCore' }", "export const metadata: Metadata = { title: 'Facturación | FleetCore' }\nexport const dynamic = 'force-dynamic'")

if "export default async function FacturacionPage()" in page:
    page = page.replace("export default async function FacturacionPage() {", "export default async function FacturacionPage({ searchParams }: { searchParams?: { query?: string } }) {")
    
    query_old = """  const [
    { data: invoices },
    { data: projects },
  ] = await Promise.all([
    supabase
      .from('invoices')
      .select('*, projects(name)')
      .order('created_at', { ascending: false }),
    supabase
      .from('projects')
      .select('id, name')
      .order('name'),
  ])"""
    
    query_new = """  const query = searchParams?.query || ''
  let q = supabase
    .from('invoices')
    .select('*, projects(name)')
  if (query) {
    q = q.or(`client_name.ilike.%${query}%,invoice_num.ilike.%${query}%`)
  }

  const [
    { data: invoices },
    { data: projects },
  ] = await Promise.all([
    q.order('created_at', { ascending: false }),
    supabase
      .from('projects')
      .select('id, name')
      .order('name'),
  ])"""
    
    page = page.replace(query_old, query_new)

    toolbar = """      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SearchInput placeholder="Buscar por cliente o N° factura..." />
      </div>
"""
    page = page.replace("      {/* Tabla */}", toolbar + "\n      {/* Tabla */}")

    th_old = """                <th className="table-header">Estado</th>
              </tr>"""
    th_new = """                <th className="table-header">Estado</th>
                <th className="table-header text-right"></th>
              </tr>"""
    page = page.replace(th_old, th_new)

    td_old = """                    {/* Estado */}
                    <td className="table-cell">
                      <span className={`badge flex items-center gap-1.5 w-fit ${statusCfg.badge}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusCfg.label}
                      </span>
                    </td>

                  </tr>"""
    td_new = """                    {/* Estado */}
                    <td className="table-cell">
                      <span className={`badge flex items-center gap-1.5 w-fit ${statusCfg.badge}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusCfg.label}
                      </span>
                    </td>

                    <td className="table-cell text-right">
                      <DeleteInvoiceButton id={invoice.id} />
                    </td>
                  </tr>"""
    page = page.replace(td_old, td_new)

with open(page_path, "w") as f: f.write(page)

print("Refactored Facturacion!")
