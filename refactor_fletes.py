import os
import re

base_dir = "apps/web/src/components/fletes"
actions_path = "apps/web/src/app/dashboard/fletes/actions.ts"
page_path = "apps/web/src/app/dashboard/fletes/page.tsx"

# 1. actions.ts
actions_content = """'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTripAction(data: any, stops: any[]) {
  const supabase = createClient()
  const { data: tripData, error: tripError } = await supabase.from('trips').insert(data).select('id').single()
  if (tripError) throw new Error(tripError.message)
  
  if (stops && stops.length > 0) {
    const stopsToInsert = stops.map((stop, idx) => ({
      trip_id: tripData.id,
      stop_order: idx + 1,
      location: stop.location,
      stop_type: stop.stop_type,
      notes: stop.notes
    }))
    const { error: stopsError } = await supabase.from('trip_stops').insert(stopsToInsert)
    if (stopsError) throw new Error(stopsError.message)
  }
  
  revalidatePath('/dashboard/fletes')
  return { success: true }
}

export async function deleteTripAction(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('trips').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/fletes')
  return { success: true }
}
"""
os.makedirs(os.path.dirname(actions_path), exist_ok=True)
with open(actions_path, "w") as f: f.write(actions_content)

# 2. DeleteFleteButton.tsx
delete_btn = """'use client'

import { useTransition } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteTripAction } from '@/app/dashboard/fletes/actions'

export function DeleteFleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!window.confirm(`¿Estás seguro de eliminar este viaje?`)) return
    startTransition(async () => {
      try { await deleteTripAction(id) }
      catch (err: any) { alert(`Error al eliminar: ${err.message}`) }
    })
  }

  return (
    <button onClick={handleDelete} disabled={isPending} className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-bg rounded-md transition-colors disabled:opacity-50" title="Eliminar viaje">
      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  )
}
"""
with open(f"{base_dir}/DeleteFleteButton.tsx", "w") as f: f.write(delete_btn)

# 3. Refactor NewFleteModal.tsx
with open(f"{base_dir}/NewFleteModal.tsx", "r") as f:
    new_modal = f.read()

new_modal = new_modal.replace("import { createClient } from '@/lib/supabase/client'", "import { createTripAction } from '@/app/dashboard/fletes/actions'")

handleSubmit_old = """    startTransition(async () => {
      const supabase = createClient()
      
      // 1. Crear el Flete (Trip)
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .insert({
          project_id:  form.project_id || null, // null si es traslado interno
          vehicle_id:  form.vehicle_id,
          driver_id:   form.driver_id,
          origin:      form.origin.trim(),
          destination: form.destination.trim(),
          distance_km: form.distance_km ? parseFloat(form.distance_km) : null,
          status:      'scheduled' // Siempre programado por defecto
        })
        .select('id')
        .single()

      if (tripError || !tripData) {
        console.error('Error al crear flete:', tripError)
        setErrors({ general: 'Error al registrar el flete' })
        return
      }

      // 2. Si hay paradas, crearlas asociadas al trip_id
      if (stops.length > 0) {
        const stopsToInsert = stops.map((stop, idx) => ({
          trip_id:    tripData.id,
          stop_order: idx + 1,
          location:   stop.location.trim(),
          stop_type:  stop.stop_type,
          notes:      stop.notes.trim() || null
        }))

        const { error: stopsError } = await supabase
          .from('trip_stops')
          .insert(stopsToInsert)

        if (stopsError) {
          console.error('Error al guardar paradas:', stopsError)
          // Opcional: mostrar advertencia de que el viaje se creó pero las paradas fallaron
        }
      }

      handleClose()
      onSuccess()
    })"""

handleSubmit_new = """    startTransition(async () => {
      try {
        await createTripAction({
          project_id:  form.project_id || null,
          vehicle_id:  form.vehicle_id,
          driver_id:   form.driver_id,
          origin:      form.origin.trim(),
          destination: form.destination.trim(),
          distance_km: form.distance_km ? parseFloat(form.distance_km) : null,
          status:      'scheduled'
        }, stops)
        handleClose()
        onSuccess()
      } catch (err: any) {
        setErrors({ general: `Error: ${err.message}` })
      }
    })"""

new_modal = new_modal.replace(handleSubmit_old, handleSubmit_new)
with open(f"{base_dir}/NewFleteModal.tsx", "w") as f: f.write(new_modal)


# 4. Refactor page.tsx
with open(page_path, "r") as f:
    page = f.read()

page = page.replace("import { NewFleteButton } from '@/components/fletes/NewFleteButton'", "import { NewFleteButton } from '@/components/fletes/NewFleteButton'\nimport { DeleteFleteButton } from '@/components/fletes/DeleteFleteButton'\nimport { SearchInput } from '@/components/ui/SearchInput'")
page = page.replace("export const metadata: Metadata = { title: 'Fletes y Rutas | FleetCore' }", "export const metadata: Metadata = { title: 'Fletes y Rutas | FleetCore' }\nexport const dynamic = 'force-dynamic'")

if "export default async function FletesPage()" in page:
    page = page.replace("export default async function FletesPage() {", "export default async function FletesPage({ searchParams }: { searchParams?: { query?: string } }) {")
    
    query_old = """    supabase
      .from('trips')
      .select(`
        *,
        projects(id, name, location),
        vehicles(plate_number, make, model),
        profiles!driver_id(full_name),
        trip_stops(id, stop_order, location, stop_type, arrived_at, notes)
      `)
      .order('created_at', { ascending: false }),"""
    
    query_new = """    (async () => {
      const query = searchParams?.query || ''
      let q = supabase
        .from('trips')
        .select(`
          *,
          projects(id, name, location),
          vehicles!inner(plate_number, make, model),
          profiles!driver_id(full_name),
          trip_stops(id, stop_order, location, stop_type, arrived_at, notes)
        `)
      if (query) {
        q = q.or(`origin.ilike.%${query}%,destination.ilike.%${query}%,vehicles.plate_number.ilike.%${query}%`)
      }
      return q.order('created_at', { ascending: false })
    })(),"""
    
    page = page.replace(query_old, query_new)

    search_old = """        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar por origen, obra o conductor..."
            className="input pl-9"
          />
        </div>"""
    search_new = """        <SearchInput placeholder="Buscar por origen, destino o placa..." />"""
    page = page.replace(search_old, search_new)

    td_old = """                  {/* ── Acciones ── */}
                  <td className="table-cell text-right">
                    <button
                      className="p-1.5 text-text-muted hover:text-primary hover:bg-primary-50 rounded transition-colors"
                      title="Gestionar Flete"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>"""
    td_new = """                  {/* ── Acciones ── */}
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 text-text-muted hover:text-primary hover:bg-primary-50 rounded transition-colors" title="Gestionar Flete">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <DeleteFleteButton id={trip.id} />
                    </div>
                  </td>"""
    page = page.replace(td_old, td_new)

with open(page_path, "w") as f: f.write(page)

print("Refactored Fletes!")
