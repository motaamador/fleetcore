import os
import re

base_dir = "apps/web/src/components/combustible"
actions_path = "apps/web/src/app/dashboard/combustible/actions.ts"
page_path = "apps/web/src/app/dashboard/combustible/page.tsx"

# 1. actions.ts
actions_content = """'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createFuelAction(data: any) {
  const supabase = createClient()
  const { error } = await supabase.from('fuel_records').insert(data)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/combustible')
  return { success: true }
}

export async function updateFuelAction(id: string, data: any) {
  const supabase = createClient()
  const { error } = await supabase.from('fuel_records').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/combustible')
  return { success: true }
}

export async function deleteFuelAction(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('fuel_records').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/combustible')
  return { success: true }
}
"""
os.makedirs(os.path.dirname(actions_path), exist_ok=True)
with open(actions_path, "w") as f: f.write(actions_content)

# 2. EditFuelButton.tsx
edit_btn = """'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { EditFuelModal } from '@/components/combustible/EditFuelModal'

export function EditFuelButton({ record, vehicles, drivers }: { record: any, vehicles: any[], drivers: any[] }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const handleSuccess = useCallback(() => router.refresh(), [router])

  return (
    <>
      <button onClick={(e) => { e.stopPropagation(); setOpen(true) }} className="p-1.5 text-text-muted hover:text-primary hover:bg-primary-50 rounded-md transition-colors" title="Editar registro">
        <Pencil className="w-4 h-4" />
      </button>
      <EditFuelModal open={open} onClose={() => setOpen(false)} onSuccess={handleSuccess} record={record} vehicles={vehicles} drivers={drivers} />
    </>
  )
}
"""
with open(f"{base_dir}/EditFuelButton.tsx", "w") as f: f.write(edit_btn)

# 3. DeleteFuelButton.tsx
delete_btn = """'use client'

import { useTransition } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteFuelAction } from '@/app/dashboard/combustible/actions'

export function DeleteFuelButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!window.confirm(`¿Estás seguro de eliminar este registro de combustible?`)) return
    startTransition(async () => {
      try { await deleteFuelAction(id) }
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
with open(f"{base_dir}/DeleteFuelButton.tsx", "w") as f: f.write(delete_btn)

# 4. Refactor NewFuelModal.tsx
with open(f"{base_dir}/NewFuelModal.tsx", "r") as f:
    new_modal = f.read()

new_modal = new_modal.replace("import { createClient } from '@/lib/supabase/client'", "import { createFuelAction } from '@/app/dashboard/combustible/actions'")

handleSubmit_old = """    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('fuel_records').insert({
        vehicle_id:   form.vehicle_id,
        driver_id:    form.driver_id || null,
        date:         form.date,
        liters:       parseFloat(form.liters),
        cost:         parseFloat(form.cost),
        currency:     form.currency,
        odometer:     form.odometer ? parseFloat(form.odometer) : null,
        station_name: form.station_name.trim() || null,
        notes:        form.notes.trim() || null,
      })

      if (error) {
        setErrors({ notes: `Error: ${error.message}` })
        return
      }

      setForm(INITIAL_FORM)
      onSuccess()
      onClose()
    })"""

handleSubmit_new = """    startTransition(async () => {
      try {
        await createFuelAction({
          vehicle_id:   form.vehicle_id,
          driver_id:    form.driver_id || null,
          date:         form.date,
          liters:       parseFloat(form.liters),
          cost:         parseFloat(form.cost),
          currency:     form.currency,
          odometer:     form.odometer ? parseFloat(form.odometer) : null,
          station_name: form.station_name.trim() || null,
          notes:        form.notes.trim() || null,
        })
        setForm(INITIAL_FORM)
        onSuccess()
        onClose()
      } catch (err: any) {
        setErrors({ notes: `Error: ${err.message}` })
      }
    })"""

new_modal = new_modal.replace(handleSubmit_old, handleSubmit_new)
with open(f"{base_dir}/NewFuelModal.tsx", "w") as f: f.write(new_modal)

# 5. Create EditFuelModal.tsx
edit_modal = new_modal.replace("NewFuelModalProps", "EditFuelModalProps")
edit_modal = edit_modal.replace("createFuelAction", "updateFuelAction")
edit_modal = edit_modal.replace("Registrar Carga de Combustible", "Editar Carga de Combustible")
edit_modal = edit_modal.replace("Registrar Carga", "Guardar Cambios")
edit_modal = edit_modal.replace("nuevo-combustible-form", "editar-combustible-form")
edit_modal = edit_modal.replace("export function NewFuelModal({ open, onClose, onSuccess, vehicles, drivers }: EditFuelModalProps) {", "export function EditFuelModal({ open, onClose, onSuccess, vehicles, drivers, record }: EditFuelModalProps) {")
edit_modal = edit_modal.replace("interface EditFuelModalProps {\n  open: boolean\n  onClose: () => void\n  onSuccess: () => void\n  vehicles: Vehicle[]\n  drivers: Driver[]\n}", "interface EditFuelModalProps {\n  open: boolean\n  onClose: () => void\n  onSuccess: () => void\n  vehicles: Vehicle[]\n  drivers: Driver[]\n  record: any\n}")
edit_modal = edit_modal.replace("import { useState, useTransition } from 'react'", "import { useEffect, useState, useTransition } from 'react'")

use_effect = """
  useEffect(() => {
    if (open && record) {
      setForm({
        vehicle_id: record.vehicle_id || '',
        driver_id: record.driver_id || '',
        date: record.date || new Date().toISOString().split('T')[0],
        liters: record.liters ? String(record.liters) : '',
        cost: record.cost ? String(record.cost) : '',
        currency: record.currency || 'USD',
        odometer: record.odometer ? String(record.odometer) : '',
        station_name: record.station_name || '',
        notes: record.notes || ''
      })
    }
  }, [open, record])
"""
edit_modal = edit_modal.replace("const [isPending, startTransition] = useTransition()\n", "const [isPending, startTransition] = useTransition()\n" + use_effect)

handleSubmit_update_old = """await updateFuelAction({"""
handleSubmit_update_new = """await updateFuelAction(record.id, {"""
edit_modal = edit_modal.replace(handleSubmit_update_old, handleSubmit_update_new)

with open(f"{base_dir}/EditFuelModal.tsx", "w") as f: f.write(edit_modal)

# 6. Refactor page.tsx
with open(page_path, "r") as f:
    page = f.read()

page = page.replace("import { NewFuelButton } from '@/components/combustible/NewFuelButton'", "import { NewFuelButton } from '@/components/combustible/NewFuelButton'\nimport { EditFuelButton } from '@/components/combustible/EditFuelButton'\nimport { DeleteFuelButton } from '@/components/combustible/DeleteFuelButton'\nimport { SearchInput } from '@/components/ui/SearchInput'")

if "export default async function CombustiblePage()" in page:
    page = page.replace("export default async function CombustiblePage() {", "export default async function CombustiblePage({ searchParams }: { searchParams?: { query?: string } }) {")
    
    query_old = """  // Obtener registros de combustible
  const { data: records, error: fetchError } = await supabase
    .from('fuel_records')
    .select(`
      *,
      vehicles(plate_number, make, model),
      profiles!driver_id(full_name)
    `)
    .order('date', { ascending: false })"""
    
    query_new = """  const query = searchParams?.query || ''
  
  let queryBuilder = supabase
    .from('fuel_records')
    .select(`
      *,
      vehicles!inner(plate_number, make, model),
      profiles!driver_id(full_name)
    `)
    
  if (query) {
    queryBuilder = queryBuilder.or(`station_name.ilike.%${query}%,vehicles.plate_number.ilike.%${query}%`)
  }
  
  const { data: records, error: fetchError } = await queryBuilder.order('date', { ascending: false })"""
    
    page = page.replace(query_old, query_new)

    toolbar = """      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SearchInput placeholder="Buscar por placa o estación..." />
        <button className="btn-secondary flex items-center gap-2">
          <Fuel className="w-4 h-4" />
          Filtros
        </button>
      </div>
"""
    page = page.replace("      {/* Tabla */}", toolbar + "\n      {/* Tabla */}")

    th_old = """                <th className="table-header text-right">Odómetro</th>
              </tr>"""
    th_new = """                <th className="table-header text-right">Odómetro</th>
                <th className="table-header text-right"></th>
              </tr>"""
    page = page.replace(th_old, th_new)

    td_old = """                    {/* Odómetro */}
                    <td className="table-cell text-right">
                      {record.odometer ? (
                        <p className="text-sm text-text-secondary font-mono">
                          {new Intl.NumberFormat('es-VE').format(record.odometer)} km
                        </p>
                      ) : <span className="text-text-muted">—</span>}
                    </td>

                  </tr>"""
    td_new = """                    {/* Odómetro */}
                    <td className="table-cell text-right">
                      {record.odometer ? (
                        <p className="text-sm text-text-secondary font-mono">
                          {new Intl.NumberFormat('es-VE').format(record.odometer)} km
                        </p>
                      ) : <span className="text-text-muted">—</span>}
                    </td>

                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <EditFuelButton record={record} vehicles={safeVehicles} drivers={safeDrivers} />
                        <DeleteFuelButton id={record.id} />
                      </div>
                    </td>
                  </tr>"""
    page = page.replace(td_old, td_new)

with open(page_path, "w") as f: f.write(page)

print("Refactored Combustible!")
