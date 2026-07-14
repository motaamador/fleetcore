'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import type { Vehicle } from '@fleetcore/types'

// Setup custom icon using HTML
const createCustomIcon = (status: string) => {
  const color = status === 'active' ? '#10b981' : status === 'in_maintenance' ? '#f59e0b' : '#3b82f6'
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.4);"></div>`,
    className: 'custom-leaflet-icon',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10]
  })
}

export default function MapComponent({ vehicles }: { vehicles: Vehicle[] }) {
  // Center roughly in Venezuela
  const defaultCenter: [number, number] = [10.15, -67.4] 

  return (
    <MapContainer center={defaultCenter} zoom={7} style={{ height: '100%', width: '100%', zIndex: 0 }}>
      {/* Usando CartoDB Voyager para un estilo moderno y claro */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      
      {vehicles.map(v => {
        if (v.current_lat === null || v.current_lng === null || v.current_lat === undefined || v.current_lng === undefined) return null
        return (
          <Marker key={v.id} position={[v.current_lat, v.current_lng]} icon={createCustomIcon(v.status)}>
            <Popup className="custom-popup">
              <div className="font-sans min-w-[150px]">
                <h3 className="font-bold text-slate-800 text-sm mb-0.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: v.status === 'active' ? '#10b981' : v.status === 'in_maintenance' ? '#f59e0b' : '#3b82f6' }} />
                  {v.plate_number}
                </h3>
                <p className="text-xs text-slate-500 mb-2">{v.make} {v.model}</p>
                <div className="text-[11px] bg-slate-50 p-2 rounded border border-slate-100 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estado:</span>
                    <span className="font-medium capitalize text-slate-700">{v.status.replace('_', ' ')}</span>
                  </div>
                  {v.last_location_update && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Actualizado:</span>
                      <span className="font-medium text-slate-700">
                        {new Date(v.last_location_update).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
