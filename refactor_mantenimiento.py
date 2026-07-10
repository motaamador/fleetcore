import os
import re

base_dir = "apps/web/src/components/mantenimiento"
actions_path = "apps/web/src/app/dashboard/mantenimiento/actions.ts"
page_path = "apps/web/src/app/dashboard/mantenimiento/page.tsx"

# 1. actions.ts
actions_content = """'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createMaintenanceAction(data: any) {
  const supabase = createClient()
  const { error } = await supabase.from('maintenance_records').insert(data)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/mantenimiento')
  return { success: true }
}

export async function updateMaintenanceAction(id: string, data: any) {
  const supabase = createClient()
  const { error } = await supabase.from('maintenance_records').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/mantenimiento')
  return { success: true }
}

export async function deleteMaintenanceAction(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('maintenance_records').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/mantenimiento')
  return { success: true }
}
"""
os.makedirs(os.path.dirname(actions_path), exist_ok=True)
with open(actions_path, "w") as f: f.write(actions_content)

# 2. EditMaintenanceButton.tsx
edit_btn = """'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { EditMaintenanceModal } from '@/components/mantenimiento/EditMaintenanceModal'

export function EditMaintenanceButton({ record, vehicles }: { record: any, vehicles: any[] }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const handleSuccess = useCallback(() => router.refresh(), [router])

  return (
    <>
      <button onClick={(e) => { e.stopPropagation(); setOpen(true) }} className="p-1.5 text-text-muted hover:text-primary hover:bg-primary-50 rounded-md transition-colors" title="Editar registro">
        <Pencil className="w-4 h-4" />
      </button>
      <EditMaintenanceModal open={open} onClose={() => setOpen(false)} onSuccess={handleSuccess} record={record} vehicles={vehicles} />
    </>
  )
}
"""
with open(f"{base_dir}/EditMaintenanceButton.tsx", "w") as f: f.write(edit_btn)

# 3. DeleteMaintenanceButton.tsx
delete_btn = """'use client'

import { useTransition } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteMaintenanceAction } from '@/app/dashboard/mantenimiento/actions'

export function DeleteMaintenanceButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!window.confirm(`¿Estás seguro de eliminar este registro de mantenimiento?`)) return
    startTransition(async () => {
      try { await deleteMaintenanceAction(id) }
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
with open(f"{base_dir}/DeleteMaintenanceButton.tsx", "w") as f: f.write(delete_btn)

# 4. Refactor NewMaintenanceModal.tsx
with open(f"{base_dir}/NewMaintenanceModal.tsx", "r") as f:
    new_modal = f.read()

new_modal = new_modal.replace("import { createClient } from '@/lib/supabase/client'", "import { createMaintenanceAction } from '@/app/dashboard/mantenimiento/actions'")

handleSubmit_old = """    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('maintenance_records').insert({
        vehicle_id:     form.vehicle_id,
        type:           form.type,
        status:         form.status,
        description:    form.description.trim(),
        workshop:       form.workshop.trim() || null,
        cost:           form.cost ? parseFloat(form.cost) : 0,
        currency:       form.currency,
        scheduled_date: form.scheduled_date,
        notes:          form.notes.trim() || null,
      })

      if (error) {
        console.error(error)
        setErrors({ description: `Error: ${error.message}` })
        return
      }

      setForm(INITIAL_FORM)
      onSuccess()
      onClose()
    })"""

handleSubmit_new = """    startTransition(async () => {
      try {
        await createMaintenanceAction({
          vehicle_id:     form.vehicle_id,
          type:           form.type,
          status:         form.status,
          description:    form.description.trim(),
          workshop:       form.workshop.trim() || null,
          cost:           form.cost ? parseFloat(form.cost) : 0,
          currency:       form.currency,
          scheduled_date: form.scheduled_date,
          notes:          form.notes.trim() || null,
        })
        setForm(INITIAL_FORM)
        onSuccess()
        onClose()
      } catch (err: any) {
        setErrors({ description: `Error: ${err.message}` })
      }
    })"""

new_modal = new_modal.replace(handleSubmit_old, handleSubmit_new)
with open(f"{base_dir}/NewMaintenanceModal.tsx", "w") as f: f.write(new_modal)

# 5. Create EditMaintenanceModal.tsx
edit_modal = new_modal.replace("NewMaintenanceModalProps", "EditMaintenanceModalProps")
edit_modal = edit_modal.replace("createMaintenanceAction", "updateMaintenanceAction")
edit_modal = edit_modal.replace("Nuevo Mantenimiento", "Editar Mantenimiento")
edit_modal = edit_modal.replace("Registrar Servicio", "Guardar Cambios")
edit_modal = edit_modal.replace("nuevo-mantenimiento-form", "editar-mantenimiento-form")
edit_modal = edit_modal.replace("export function NewMaintenanceModal({ open, onClose, onSuccess, vehicles }: EditMaintenanceModalProps) {", "export function EditMaintenanceModal({ open, onClose, onSuccess, vehicles, record }: EditMaintenanceModalProps) {")
edit_modal = edit_modal.replace("interface EditMaintenanceModalProps {\n  open: boolean\n  onClose: () => void\n  onSuccess: () => void\n  vehicles: Vehicle[]\n}", "interface EditMaintenanceModalProps {\n  open: boolean\n  onClose: () => void\n  onSuccess: () => void\n  vehicles: Vehicle[]\n  record: any\n}")
edit_modal = edit_modal.replace("import { useState, useTransition } from 'react'", "import { useEffect, useState, useTransition } from 'react'")

use_effect = """
  useEffect(() => {
    if (open && record) {
      setForm({
        vehicle_id: record.vehicle_id || '',
        type: record.type || 'preventivo',
        status: record.status || 'programado',
        description: record.description || '',
        workshop: record.workshop || '',
        cost: record.cost ? String(record.cost) : '',
        currency: record.currency || 'USD',
        scheduled_date: record.scheduled_date || new Date().toISOString().split('T')[0],
        notes: record.notes || ''
      })
    }
  }, [open, record])
"""
edit_modal = edit_modal.replace("const [isPending, startTransition] = useTransition()\n", "const [isPending, startTransition] = useTransition()\n" + use_effect)

handleSubmit_update_old = """await updateMaintenanceAction({"""
handleSubmit_update_new = """await updateMaintenanceAction(record.id, {"""
edit_modal = edit_modal.replace(handleSubmit_update_old, handleSubmit_update_new)

with open(f"{base_dir}/EditMaintenanceModal.tsx", "w") as f: f.write(edit_modal)

# 6. Refactor page.tsx
with open(page_path, "r") as f:
    page = f.read()

page = page.replace("import { NewMaintenanceButton } from '@/components/mantenimiento/NewMaintenanceButton'", "import { NewMaintenanceButton } from '@/components/mantenimiento/NewMaintenanceButton'\nimport { EditMaintenanceButton } from '@/components/mantenimiento/EditMaintenanceButton'\nimport { DeleteMaintenanceButton } from '@/components/mantenimiento/DeleteMaintenanceButton'\nimport { SearchInput } from '@/components/ui/SearchInput'")
page = page.replace("export const metadata: Metadata = { title: 'Mantenimiento | FleetCore' }", "export const metadata: Metadata = { title: 'Mantenimiento | FleetCore' }\nexport const dynamic = 'force-dynamic'")

if "export default async function MantenimientoPage()" in page:
    page = page.replace("export default async function MantenimientoPage() {", "export default async function MantenimientoPage({ searchParams }: { searchParams?: { query?: string } }) {")
    
    query_old = """  const [
    { data: records },
    { data: vehicles },
  ] = await Promise.all([
    supabase
      .from('maintenance_records')
      .select(`
        *,
        vehicles(plate_number, make, model, status)
      `)
      .order('scheduled_date', { ascending: false }),
    supabase
      .from('vehicles')
      .select('id, plate_number, make, model')
      .order('plate_number'),
  ])"""
    
    query_new = """  const query = searchParams?.query || ''
  
  let queryBuilder = supabase
      .from('maintenance_records')
      .select(`
        *,
        vehicles!inner(plate_number, make, model, status)
      `)
      
  if (query) {
    queryBuilder = queryBuilder.or(`description.ilike.%${query}%,vehicles.plate_number.ilike.%${query}%`)
  }
  
  const [
    { data: records },
    { data: vehicles },
  ] = await Promise.all([
    queryBuilder.order('scheduled_date', { ascending: false }),
    supabase
      .from('vehicles')
      .select('id, plate_number, make, model')
      .order('plate_number'),
  ])"""
    
    page = page.replace(query_old, query_new)

    toolbar = """      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SearchInput placeholder="Buscar por placa o descripción..." />
        <button className="btn-secondary flex items-center gap-2">
          <Wrench className="w-4 h-4" />
          Filtros
        </button>
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
                      <div className="flex items-center justify-end gap-1">
                        <EditMaintenanceButton record={record} vehicles={safeVehicles} />
                        <DeleteMaintenanceButton id={record.id} />
                      </div>
                    </td>
                  </tr>"""
    page = page.replace(td_old, td_new)

with open(page_path, "w") as f: f.write(page)

print("Refactored Mantenimiento!")
