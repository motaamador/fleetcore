import os
import re

base_dir = "apps/web/src/components/contratos"
actions_path = "apps/web/src/app/dashboard/contratos/actions.ts"
page_path = "apps/web/src/app/dashboard/contratos/page.tsx"

# 1. actions.ts
actions_content = """'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createContractAction(data: any) {
  const supabase = createClient()
  const { error } = await supabase.from('contracts').insert(data)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/contratos')
  return { success: true }
}

export async function updateContractAction(id: string, data: any) {
  const supabase = createClient()
  const { error } = await supabase.from('contracts').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/contratos')
  return { success: true }
}

export async function deleteContractAction(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('contracts').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/contratos')
  return { success: true }
}
"""
os.makedirs(os.path.dirname(actions_path), exist_ok=True)
with open(actions_path, "w") as f: f.write(actions_content)

# 2. EditContractButton.tsx
edit_btn = """'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { EditContractModal } from '@/components/contratos/EditContractModal'

export function EditContractButton({ contract, clients }: { contract: any, clients: any[] }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const handleSuccess = useCallback(() => router.refresh(), [router])

  return (
    <>
      <button onClick={(e) => { e.stopPropagation(); setOpen(true) }} className="p-1.5 text-text-muted hover:text-primary hover:bg-primary-50 rounded-md transition-colors" title="Editar contrato">
        <Pencil className="w-4 h-4" />
      </button>
      <EditContractModal open={open} onClose={() => setOpen(false)} onSuccess={handleSuccess} contract={contract} clients={clients} />
    </>
  )
}
"""
with open(f"{base_dir}/EditContractButton.tsx", "w") as f: f.write(edit_btn)

# 3. Modify DeleteContractButton.tsx (since it already exists)
with open(f"{base_dir}/DeleteContractButton.tsx", "r") as f:
    delete_btn = f.read()

delete_btn = delete_btn.replace("import { createClient } from '@/lib/supabase/client'", "import { deleteContractAction } from '@/app/dashboard/contratos/actions'")
handle_del_old = """    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('contracts').delete().eq('id', id)

      if (error) {
        alert(`No se pudo eliminar: ${error.message}`)
        return
      }
      
      router.refresh()
    })"""
handle_del_new = """    startTransition(async () => {
      try {
        await deleteContractAction(id)
      } catch (err: any) {
        alert(`No se pudo eliminar: ${err.message}`)
      }
    })"""
delete_btn = delete_btn.replace(handle_del_old, handle_del_new)
with open(f"{base_dir}/DeleteContractButton.tsx", "w") as f: f.write(delete_btn)

# 4. Refactor NewContractModal.tsx
with open(f"{base_dir}/NewContractModal.tsx", "r") as f:
    new_modal = f.read()

new_modal = new_modal.replace("import { createClient } from '@/lib/supabase/client'", "import { createContractAction } from '@/app/dashboard/contratos/actions'")

handleSubmit_old = """    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('contracts').insert({
        contract_num: form.contract_num.trim(),
        client_id:    form.client_id,
        title:        form.title.trim(),
        description:  form.description.trim() || null,
        start_date:   displayToISO(form.start_date_display),
        end_date:     displayToISO(form.end_date_display),
        amount:       form.amount ? parseFloat(form.amount) : 0,
        currency:     form.currency,
        status:       form.status,
      })

      if (error) {
        setErrors({ title: `Error: ${error.message}` })
        return
      }

      setForm(INITIAL_FORM)
      onSuccess()
      onClose()
    })"""

handleSubmit_new = """    startTransition(async () => {
      try {
        await createContractAction({
          contract_num: form.contract_num.trim(),
          client_id:    form.client_id,
          title:        form.title.trim(),
          description:  form.description.trim() || null,
          start_date:   displayToISO(form.start_date_display),
          end_date:     displayToISO(form.end_date_display),
          amount:       form.amount ? parseFloat(form.amount) : 0,
          currency:     form.currency,
          status:       form.status,
        })
        setForm(INITIAL_FORM)
        onSuccess()
        onClose()
      } catch (err: any) {
        setErrors({ title: `Error: ${err.message}` })
      }
    })"""

new_modal = new_modal.replace(handleSubmit_old, handleSubmit_new)
with open(f"{base_dir}/NewContractModal.tsx", "w") as f: f.write(new_modal)

# 5. Create EditContractModal.tsx
edit_modal = new_modal.replace("NewContractModalProps", "EditContractModalProps")
edit_modal = edit_modal.replace("createContractAction", "updateContractAction")
edit_modal = edit_modal.replace("Nuevo Contrato", "Editar Contrato")
edit_modal = edit_modal.replace("Crear Contrato", "Guardar Cambios")
edit_modal = edit_modal.replace("nuevo-contrato-form", "editar-contrato-form")
edit_modal = edit_modal.replace("export function NewContractModal({ open, onClose, onSuccess, clients }: EditContractModalProps) {", "export function EditContractModal({ open, onClose, onSuccess, clients, contract }: EditContractModalProps) {")
edit_modal = edit_modal.replace("interface EditContractModalProps {\n  open: boolean\n  onClose: () => void\n  onSuccess: () => void\n  clients: Client[]\n}", "interface EditContractModalProps {\n  open: boolean\n  onClose: () => void\n  onSuccess: () => void\n  clients: Client[]\n  contract: any\n}")
edit_modal = edit_modal.replace("import { useState, useTransition } from 'react'", "import { useEffect, useState, useTransition } from 'react'")

use_effect = """
  useEffect(() => {
    if (open && contract) {
      setForm({
        contract_num: contract.contract_num || '',
        client_id: contract.client_id || '',
        title: contract.title || '',
        description: contract.description || '',
        start_date: contract.start_date || '',
        end_date: contract.end_date || '',
        start_date_display: isoToDisplay(contract.start_date),
        end_date_display: isoToDisplay(contract.end_date),
        amount: contract.amount ? String(contract.amount) : '',
        currency: contract.currency || 'USD',
        status: contract.status || 'draft'
      })
    }
  }, [open, contract])
"""
edit_modal = edit_modal.replace("const [isPending, startTransition] = useTransition()\n", "const [isPending, startTransition] = useTransition()\n" + use_effect)

handleSubmit_update_old = """await updateContractAction({"""
handleSubmit_update_new = """await updateContractAction(contract.id, {"""
edit_modal = edit_modal.replace(handleSubmit_update_old, handleSubmit_update_new)

with open(f"{base_dir}/EditContractModal.tsx", "w") as f: f.write(edit_modal)

# 6. Refactor page.tsx
with open(page_path, "r") as f:
    page = f.read()

page = page.replace("import { NewContractButton } from '@/components/contratos/NewContractButton'", "import { NewContractButton } from '@/components/contratos/NewContractButton'\nimport { EditContractButton } from '@/components/contratos/EditContractButton'\nimport { SearchInput } from '@/components/ui/SearchInput'")

if "export default async function ContratosPage()" in page:
    page = page.replace("export default async function ContratosPage() {", "export default async function ContratosPage({ searchParams }: { searchParams?: { query?: string } }) {")
    
    query_old = """  // 1. Obtener contratos con datos del cliente
  const { data: contracts } = await supabase
    .from('contracts')
    .select(`
      *,
      clients(name)
    `)
    .order('created_at', { ascending: false })"""
    
    query_new = """  const query = searchParams?.query || ''
  
  let queryBuilder = supabase
    .from('contracts')
    .select(`
      *,
      clients!inner(name)
    `)
    
  if (query) {
    queryBuilder = queryBuilder.or(`title.ilike.%${query}%,contract_num.ilike.%${query}%,clients.name.ilike.%${query}%`)
  }
  
  const { data: contracts } = await queryBuilder.order('created_at', { ascending: false })"""
    
    page = page.replace(query_old, query_new)

    toolbar = """      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SearchInput placeholder="Buscar contrato por título o cliente..." />
        <button className="btn-secondary flex items-center gap-2">
          <ScrollText className="w-4 h-4" />
          Filtros
        </button>
      </div>
"""
    page = page.replace("      {/* Tabla */}", toolbar + "\n      {/* Tabla */}")

    td_old = """                  {/* Acciones */}
                  <td className="table-cell text-right">
                    <DeleteContractButton id={contract.id} title={contract.title} />
                  </td>"""
    td_new = """                  {/* Acciones */}
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-1">
                      <EditContractButton contract={contract} clients={safeClients} />
                      <DeleteContractButton id={contract.id} title={contract.title} />
                    </div>
                  </td>"""
    page = page.replace(td_old, td_new)

with open(page_path, "w") as f: f.write(page)

print("Refactored Contratos!")
