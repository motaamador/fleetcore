import os
import re

base_dir = "apps/web/src/components/clientes"
actions_path = "apps/web/src/app/dashboard/clientes/actions.ts"
page_path = "apps/web/src/app/dashboard/clientes/page.tsx"

# 1. actions.ts
actions_content = """'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createClientAction(data: any) {
  const supabase = createClient()
  const { error } = await supabase.from('clients').insert(data)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/clientes')
  return { success: true }
}

export async function updateClientAction(id: string, data: any) {
  const supabase = createClient()
  const { error } = await supabase.from('clients').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/clientes')
  return { success: true }
}

export async function deleteClientAction(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/clientes')
  return { success: true }
}
"""
os.makedirs(os.path.dirname(actions_path), exist_ok=True)
with open(actions_path, "w") as f: f.write(actions_content)

# 2. EditClientButton.tsx
edit_btn = """'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { EditClientModal } from '@/components/clientes/EditClientModal'

export function EditClientButton({ client }: { client: any }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const handleSuccess = useCallback(() => router.refresh(), [router])

  return (
    <>
      <button onClick={(e) => { e.stopPropagation(); setOpen(true) }} className="p-1.5 text-text-muted hover:text-primary hover:bg-primary-50 rounded-md transition-colors" title="Editar cliente">
        <Pencil className="w-4 h-4" />
      </button>
      <EditClientModal open={open} onClose={() => setOpen(false)} onSuccess={handleSuccess} client={client} />
    </>
  )
}
"""
with open(f"{base_dir}/EditClientButton.tsx", "w") as f: f.write(edit_btn)

# 3. DeleteClientButton.tsx
delete_btn = """'use client'

import { useTransition } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteClientAction } from '@/app/dashboard/clientes/actions'

export function DeleteClientButton({ id, name }: { id: string, name: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!window.confirm(`¿Estás seguro de eliminar el cliente "${name}"?`)) return
    startTransition(async () => {
      try { await deleteClientAction(id) }
      catch (err: any) { alert(`Error al eliminar: ${err.message}`) }
    })
  }

  return (
    <button onClick={handleDelete} disabled={isPending} className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-bg rounded-md transition-colors disabled:opacity-50" title="Eliminar">
      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  )
}
"""
with open(f"{base_dir}/DeleteClientButton.tsx", "w") as f: f.write(delete_btn)

# 4. Refactor NewClientModal.tsx
with open(f"{base_dir}/NewClientModal.tsx", "r") as f:
    new_modal = f.read()

new_modal = new_modal.replace("import { createClient } from '@/lib/supabase/client'", "import { createClientAction } from '@/app/dashboard/clientes/actions'")

handleSubmit_old = """    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('clients').insert({
        name: form.name.trim(),
        rif: form.rif.trim(),
        address: form.address.trim() || null,
        contact_person: form.contact_person.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
      })

      if (error) {
        setErrors({ name: `Error: ${error.message}` })
        return
      }

      setForm(INITIAL_FORM)
      onSuccess()
      onClose()
    })"""

handleSubmit_new = """    startTransition(async () => {
      try {
        await createClientAction({
          name: form.name.trim(),
          rif: form.rif.trim(),
          address: form.address.trim() || null,
          contact_person: form.contact_person.trim() || null,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
        })
        setForm(INITIAL_FORM)
        onSuccess()
        onClose()
      } catch (err: any) {
        setErrors({ name: `Error: ${err.message}` })
      }
    })"""

new_modal = new_modal.replace(handleSubmit_old, handleSubmit_new)
with open(f"{base_dir}/NewClientModal.tsx", "w") as f: f.write(new_modal)

# 5. Create EditClientModal.tsx from NewClientModal.tsx
edit_modal = new_modal.replace("NewClientModalProps", "EditClientModalProps")
edit_modal = edit_modal.replace("createClientAction", "updateClientAction")
edit_modal = edit_modal.replace("Nuevo Cliente", "Editar Cliente")
edit_modal = edit_modal.replace("Crear Cliente", "Guardar Cambios")
edit_modal = edit_modal.replace("nuevo-cliente-form", "editar-cliente-form")
edit_modal = edit_modal.replace("export function NewClientModal({ open, onClose, onSuccess }: EditClientModalProps) {", "export function EditClientModal({ open, onClose, onSuccess, client }: EditClientModalProps) {")
edit_modal = edit_modal.replace("interface EditClientModalProps {\n  open: boolean\n  onClose: () => void\n  onSuccess: () => void\n}", "interface EditClientModalProps {\n  open: boolean\n  onClose: () => void\n  onSuccess: () => void\n  client: any\n}")
edit_modal = edit_modal.replace("import { useState, useTransition } from 'react'", "import { useEffect, useState, useTransition } from 'react'")

use_effect = """
  useEffect(() => {
    if (open && client) {
      setForm({
        name: client.name || '',
        rif: client.rif || '',
        address: client.address || '',
        contact_person: client.contact_person || '',
        email: client.email || '',
        phone: client.phone || ''
      })
    }
  }, [open, client])
"""
edit_modal = edit_modal.replace("const [isPending, startTransition] = useTransition()\n", "const [isPending, startTransition] = useTransition()\n" + use_effect)

handleSubmit_update_old = """await updateClientAction({"""
handleSubmit_update_new = """await updateClientAction(client.id, {"""
edit_modal = edit_modal.replace(handleSubmit_update_old, handleSubmit_update_new)

with open(f"{base_dir}/EditClientModal.tsx", "w") as f: f.write(edit_modal)

# 6. Refactor page.tsx
with open(page_path, "r") as f:
    page = f.read()

page = page.replace("import { NewClientButton } from '@/components/clientes/NewClientButton'", "import { NewClientButton } from '@/components/clientes/NewClientButton'\nimport { EditClientButton } from '@/components/clientes/EditClientButton'\nimport { DeleteClientButton } from '@/components/clientes/DeleteClientButton'\nimport { SearchInput } from '@/components/ui/SearchInput'")
page = page.replace("export const metadata: Metadata = { title: 'Clientes y Empresas | FleetCore' }", "export const metadata: Metadata = { title: 'Clientes y Empresas | FleetCore' }\nexport const dynamic = 'force-dynamic'")

if "export default async function ClientesPage()" in page:
    page = page.replace("export default async function ClientesPage() {", "export default async function ClientesPage({ searchParams }: { searchParams?: { query?: string } }) {")
    
    query_old = """  const { data: dbClients, error } = await supabase
    .from('clients')
    .select('*, projects(count)')
    .order('created_at', { ascending: false })"""
    
    query_new = """  const query = searchParams?.query || ''
  let queryBuilder = supabase.from('clients').select('*, projects(count)')
  if (query) queryBuilder = queryBuilder.or(`name.ilike.%${query}%,rif.ilike.%${query}%`)
  const { data: dbClients, error } = await queryBuilder.order('created_at', { ascending: false })"""
    
    page = page.replace(query_old, query_new)
    
    search_old = """        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input type="text" placeholder="Buscar cliente o RIF..." className="input pl-9" />
        </div>"""
    search_new = """        <SearchInput placeholder="Buscar cliente o RIF..." />"""
    page = page.replace(search_old, search_new)

    th_old = """              <th className="table-header">Estado</th>
            </tr>"""
    th_new = """              <th className="table-header">Estado</th>
              <th className="table-header text-right"></th>
            </tr>"""
    page = page.replace(th_old, th_new)

    td_old = """                  </span>
                </td>
              </tr>"""
    td_new = """                  </span>
                </td>
                <td className="table-cell text-right">
                  <div className="flex items-center justify-end gap-1">
                    <EditClientButton client={client} />
                    <DeleteClientButton id={client.id} name={client.name} />
                  </div>
                </td>
              </tr>"""
    page = page.replace(td_old, td_new)

with open(page_path, "w") as f: f.write(page)

print("Refactored Clientes!")
