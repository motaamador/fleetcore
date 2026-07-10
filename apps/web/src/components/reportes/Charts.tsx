'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts'

interface ChartProps {
  data: any[]
}

// ── Gráfica: Ingresos vs Gastos Mensuales ──────────────────────────────────────
export function MonthlyFinanceChart({ data }: ChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(val) => `$${val/1000}k`} />
          <Tooltip 
            cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '4 4' }}
            contentStyle={{ backgroundColor: '#1F2937', color: '#F9FAFB', borderRadius: '8px', border: '1px solid #374151', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)' }}
            formatter={(val: number) => [`$${new Intl.NumberFormat('en-US').format(val)}`, '']}
          />
          <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIngresos)" />
          <Area type="monotone" dataKey="gastos" name="Gastos (Nómina+Mantenimiento+Combustible)" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorGastos)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Gráfica: Viajes Completados por Obra ─────────────────────────────────────
export function TripsByProjectChart({ data }: ChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#D1D5DB', fontWeight: 500 }} width={120} />
          <Tooltip 
            cursor={{ fill: '#374151' }}
            contentStyle={{ backgroundColor: '#1F2937', color: '#F9FAFB', borderRadius: '8px', border: '1px solid #374151', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)' }}
          />
          <Bar dataKey="viajes" name="Fletes" fill="#FFB81C" radius={[0, 4, 4, 0]} barSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
