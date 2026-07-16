'use client'

import { useState, useTransition } from 'react'
import { X, DollarSign, Loader2, Calendar, User, FileText, PlusCircle, MinusCircle, Truck, CheckCircle2 } from 'lucide-react'
import { createPayrollAction } from '@/app/dashboard/nominas/actions'
import { getTripBonusesByDriverAction } from '@/app/dashboard/fletes/actions'
import { toast } from 'sonner'

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Profile { id: string; full_name: string; role: string; cedula_identidad?: string }

interface NewPayrollModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  employees: Profile[]
}

interface FormData {
  profile_id:   string
  period_start: string
  period_end:   string
  base_salary:  string
  bonuses:      string
  deductions:   string
  currency:     string
  status:       string
  notes:        string
}

interface TripBonus {
  id: string
  origin: string
  destination: string
  bono_chofer: number
  bono_currency: string
  departure_time: string
}

const getFirstDayOfMonth = () => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
}

const getLastDayOfMonth = () => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]
}

const INITIAL_FORM: FormData = {
  profile_id:   '',
  period_start: getFirstDayOfMonth(),
  period_end:   getLastDayOfMonth(),
  base_salary:  '',
  bonuses:      '0',
  deductions:   '0',
  currency:     'USD',
  status:       'borrador',
  notes:        '',
}

const CURRENCIES = ['USD', 'EUR', 'VES']
const STATUS_OPTIONS = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'pagado',   label: 'Pagado' },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatNum(val: string): number { return parseFloat(val) || 0 }

// ── Componente ─────────────────────────────────────────────────────────────────
export function NewPayrollModal({ open, onClose, onSuccess, employees }: NewPayrollModalProps) {
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [isPending, startTransition] = useTransition()
  const [tripBonuses, setTripBonuses] = useState<TripBonus[]>([])
  const [bonusTotals, setBonusTotals] = useState<{ totalUSD: number; totalVES: number; count: number } | null>(null)
  const [isLoadingBonuses, setIsLoadingBonuses] = useState(false)

  if (!open) return null

  function set(field: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  // Cuando cambia el chofer o las fechas, buscar bonos de fletes automáticamente
  async function loadTripBonuses(driverId: string, start: string, end: string) {
    if (!driverId || !start || !end) return
    setIsLoadingBonuses(true)
    const res = await getTripBonusesByDriverAction(driverId, start, end)
    setIsLoadingBonuses(false)
    if (res && 'success' in res && res.success) {
      setTripBonuses((res as any).trips || [])
      setBonusTotals({ totalUSD: (res as any).totalUSD, totalVES: (res as any).totalVES, count: (res as any).count })
    } else {
      setTripBonuses([])
      setBonusTotals(null)
    }
  }

  function handleDriverChange(e: React.ChangeEvent<HTMLSelectElement>) {
    set('profile_id', e.target.value)
    if (e.target.value && form.period_start && form.period_end) {
      loadTripBonuses(e.target.value, form.period_start, form.period_end)
    }
  }

  function handlePeriodChange(field: 'period_start' | 'period_end', value: string) {
    set(field, value)
    const newStart = field === 'period_start' ? value : form.period_start
    const newEnd   = field === 'period_end'   ? value : form.period_end
    if (form.profile_id && newStart && newEnd) {
      loadTripBonuses(form.profile_id, newStart, newEnd)
    }
  }

  function applyTripBonuses() {
    if (!bonusTotals) return
    const totalUSD = bonusTotals.totalUSD
    const current  = formatNum(form.bonuses)
    set('bonuses', (current + totalUSD).toFixed(2))
    toast.success(`Se aplicaron $${totalUSD.toFixed(2)} USD de bonos de ${bonusTotals.count} viajes`)
  }

  // Cálculos en tiempo real
  const base = formatNum(form.base_salary)
  const bon  = formatNum(form.bonuses)
  const ded  = formatNum(form.deductions)
  const net  = base + bon - ded

  const sym = form.currency === 'USD' ? '$' : form.currency === 'EUR' ? '€' : 'Bs.'

  function validate(): boolean {
    const e: Partial<FormData> = {}
    if (!form.profile_id)   e.profile_id   = 'Selecciona un empleado o chofer'
    if (!form.period_start) e.period_start = 'Requerido'
    if (!form.period_end)   e.period_end   = 'Requerido'
    if (form.period_start > form.period_end) e.period_end = 'La fecha fin debe ser mayor'
    if (net < 0) e.deductions = 'Las deducciones no pueden superar el ingreso'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    startTransition(async () => {
      try {
        await createPayrollAction({
          profile_id:   form.profile_id,
          period_start: form.period_start,
          period_end:   form.period_end,
          base_salary:  base,
          bonuses:      bon,
          deductions:   ded,
          currency:     form.currency,
          status:       form.status,
          notes:        form.notes.trim() || null,
          payment_date: form.status === 'pagado' ? new Date().toISOString().split('T')[0] : null,
        })
        setForm(INITIAL_FORM)
        setTripBonuses([])
        setBonusTotals(null)
        onSuccess()
        onClose()
      } catch (err: any) {
        setErrors({ notes: `Error: ${err.message}` })
      }
    })
  }

  function handleClose() {
    setForm(INITIAL_FORM)
    setErrors({})
    setTripBonuses([])
    setBonusTotals(null)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={handleClose} />

      <aside className="fixed inset-y-0 right-0 w-full max-w-lg bg-surface border-l border-border shadow-2xl z-50 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary-700" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Registrar Pago</h2>
              <p className="text-xs text-text-muted">Nómina individual o pago de fletes</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-background-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form id="nueva-nomina-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Empleado */}
          <div>
            <label className="label">
              <User className="w-3.5 h-3.5" /> Personal / Chofer <span className="text-danger">*</span>
            </label>
            <select
              className={`input ${errors.profile_id ? 'border-danger' : ''}`}
              value={form.profile_id}
              onChange={handleDriverChange}
            >
              <option value="">— Seleccionar personal —</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} ({emp.role}) {emp.cedula_identidad ? `— C.I: ${emp.cedula_identidad}` : ''}
                </option>
              ))}
            </select>
            {errors.profile_id && <p className="text-xs text-danger mt-1">{errors.profile_id}</p>}
          </div>

          {/* Período */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label"><Calendar className="w-3.5 h-3.5" /> Inicio Período</label>
              <input
                type="date"
                className={`input ${errors.period_start ? 'border-danger' : ''}`}
                value={form.period_start}
                onChange={e => handlePeriodChange('period_start', e.target.value)}
              />
              {errors.period_start && <p className="text-xs text-danger mt-1">{errors.period_start}</p>}
            </div>
            <div>
              <label className="label"><Calendar className="w-3.5 h-3.5" /> Fin Período</label>
              <input
                type="date"
                className={`input ${errors.period_end ? 'border-danger' : ''}`}
                value={form.period_end}
                onChange={e => handlePeriodChange('period_end', e.target.value)}
              />
              {errors.period_end && <p className="text-xs text-danger mt-1">{errors.period_end}</p>}
            </div>
          </div>

          {/* ── Bonos de Fletes (Panel automático) ── */}
          {form.profile_id && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-background border-b border-border">
                <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  <Truck className="w-3.5 h-3.5" /> Bonos de Viajes en este Período
                </div>
                {isLoadingBonuses && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
              </div>

              <div className="p-3">
                {bonusTotals && bonusTotals.count > 0 ? (
                  <>
                    <div className="space-y-1.5 mb-3 max-h-28 overflow-y-auto">
                      {tripBonuses.map(t => (
                        <div key={t.id} className="flex justify-between items-center text-xs">
                          <span className="text-text-secondary truncate flex-1 pr-2">{t.origin} → {t.destination}</span>
                          <span className="font-medium text-success whitespace-nowrap">
                            +{t.bono_currency === 'VES' ? 'Bs.' : '$'} {t.bono_chofer.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="text-xs">
                        <span className="text-text-muted">{bonusTotals.count} viajes · </span>
                        {bonusTotals.totalUSD > 0 && <span className="font-semibold text-success">${bonusTotals.totalUSD.toFixed(2)} USD</span>}
                        {bonusTotals.totalUSD > 0 && bonusTotals.totalVES > 0 && <span className="text-text-muted"> + </span>}
                        {bonusTotals.totalVES > 0 && <span className="font-semibold text-success">Bs. {bonusTotals.totalVES.toFixed(2)}</span>}
                      </div>
                      <button type="button" onClick={applyTripBonuses} className="btn-secondary py-1 text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-success" /> Aplicar Bonos
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-text-muted text-center py-2">
                    {isLoadingBonuses ? 'Buscando viajes...' : 'Sin bonos de fletes en este período.'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Desglose Financiero */}
          <div className="space-y-4 pt-2 border-t border-border">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Desglose del Pago</h3>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="label text-text-primary">Sueldo Base / Pago Base</label>
                <input
                  type="number" step="0.01" min="0"
                  className="input font-medium"
                  placeholder="0.00"
                  value={form.base_salary}
                  onChange={e => set('base_salary', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Moneda</label>
                <select className="input" value={form.currency} onChange={e => set('currency', e.target.value)}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label text-success">
                  <PlusCircle className="w-3.5 h-3.5" /> Bonos / Comisiones
                </label>
                <input
                  type="number" step="0.01" min="0"
                  className="input"
                  placeholder="0.00"
                  value={form.bonuses}
                  onChange={e => set('bonuses', e.target.value)}
                />
              </div>
              <div>
                <label className="label text-danger">
                  <MinusCircle className="w-3.5 h-3.5" /> Deducciones / Adelantos
                </label>
                <input
                  type="number" step="0.01" min="0"
                  className={`input ${errors.deductions ? 'border-danger' : ''}`}
                  placeholder="0.00"
                  value={form.deductions}
                  onChange={e => set('deductions', e.target.value)}
                />
                {errors.deductions && <p className="text-xs text-danger mt-1">{errors.deductions}</p>}
              </div>
            </div>

            {/* Total Neto Card */}
            <div className="bg-primary-50 border border-primary-100 rounded-lg p-4 flex items-center justify-between mt-2">
              <span className="text-primary-700 font-semibold">Total Neto a Pagar</span>
              <span className="text-xl font-bold text-primary-900">
                {sym} {new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(net)}
              </span>
            </div>
          </div>

          {/* Configuración Final */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="col-span-2">
              <label className="label">Estado del Pago</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label"><FileText className="w-3.5 h-3.5" /> Concepto / Notas</label>
              <textarea
                rows={2}
                className="input resize-none"
                placeholder="Ej: Quincena 1 Julio + Bono de 3 fletes..."
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
              />
              {errors.notes && <p className="text-xs text-danger mt-1">{errors.notes}</p>}
            </div>
          </div>

        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-background flex items-center justify-end gap-3">
          <button type="button" onClick={handleClose} disabled={isPending} className="btn-secondary">
            Cancelar
          </button>
          <button form="nueva-nomina-form" type="submit" disabled={isPending} className="btn-primary flex items-center gap-2 min-w-[150px] justify-center">
            {isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
              : <><DollarSign className="w-4 h-4" /> Registrar Pago</>
            }
          </button>
        </div>

      </aside>
    </>
  )
}


