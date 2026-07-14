'use server'

import { createClient } from '@/lib/supabase/server'
import { requireRole, handleActionError } from '@/lib/action-guard'
import { revalidatePath } from 'next/cache'

export async function simulateVehicleLocationsAction() {
  try {
    const { supabase } = await requireRole(['admin', 'dispatcher'])
    
    const { data: vehicles, error } = await supabase.from('vehicles').select('id, status')
    if (error) throw new Error(error.message)
    if (!vehicles || vehicles.length === 0) return { success: true }
    
    // Coordenadas base (Ej: Centro de Venezuela - Valencia/Maracay)
    const baseLat = 10.2
    const baseLng = -67.5
    
    // Actualizar coordenadas simuladas
    const promises = vehicles.filter(v => v.status !== 'inactive').map(v => {
      // Offset aleatorio para esparcir los camiones por el mapa
      const lat = baseLat + (Math.random() - 0.5) * 2 // +/- 1 grado
      const lng = baseLng + (Math.random() - 0.5) * 3 // +/- 1.5 grados
      
      return supabase.from('vehicles').update({
        current_lat: parseFloat(lat.toFixed(6)),
        current_lng: parseFloat(lng.toFixed(6)),
        last_location_update: new Date().toISOString()
      }).eq('id', v.id)
    })

    await Promise.all(promises)
    
    revalidatePath('/dashboard/mapa')
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}
