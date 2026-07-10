import os

base_dir = "apps/web/src/components/nominas"
actions_path = "apps/web/src/app/dashboard/nominas/actions.ts"
page_path = "apps/web/src/app/dashboard/nominas/page.tsx"

# 1. actions.ts
actions_content = """'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createPayrollAction(data: any) {
  const supabase = createClient()
  const { error } = await supabase.from('payroll_records').insert(data)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/nominas')
  return { success: true }
}

export async function updatePayrollAction(id: string, data: any) {
  const supabase = createClient()
  const { error } = await supabase.from('payroll_records').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/nominas')
  return { success: true }
}

export async function deletePayrollAction(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('payroll_records').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/nominas')
  return { success: true }
}
"""
os.makedirs(os.path.dirname(actions_path), exist_ok=True)
with open(actions_path, "w") as f: f.write(actions_content)

# 2. EditPayrollButton.tsx
edit_btn = """'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { EditPayrollModal } from '@/components/nominas/EditPayrollModal'

export function EditPayrollButton({ record, employees }: { record: any, employees: any[] }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const handleSuccess = useCallback(() => router.refresh(), [router])

  return (
    <>
      <button onClick={(e) => { e.stopPropagation(); setOpen(true) }} className="p-1.5 text-text-muted hover:text-primary hover:bg-primary-50 rounded-md transition-colors" title="Editar nómina">
        <Pencil className="w-4 h-4" />
      </button>
      <EditPayrollModal open={open} onClose={() => setOpen(false)} onSuccess={handleSuccess} record={record} employees={employees} />
    </>
  )
}
"""
with open(f"{base_dir}/EditPayrollButton.tsx", "w") as f: f.write(edit_btn)

# 3. DeletePayrollButton.tsx
delete_btn = """'use client'

import { useTransition } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { deletePayrollAction } from '@/app/dashboard/nominas/actions'

export function DeletePayrollButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!window.confirm(`¿Estás seguro de eliminar este registro de nómina?`)) return
    startTransition(async () => {
      try { await deletePayrollAction(id) }
      catch (err: any) { alert(`Error al eliminar: ${err.message}`) }
    })
  }

  return (
    <button onClick={handleDelete} disabled={isPending} className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-bg rounded-md transition-colors disabled:opacity-50" title="Eliminar nómina">
      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  )
}
"""
with open(f"{base_dir}/DeletePayrollButton.tsx", "w") as f: f.write(delete_btn)

# 4. Refactor NewPayrollModal.tsx
with open(f"{base_dir}/NewPayrollModal.tsx", "r") as f:
    new_modal = f.read()

new_modal = new_modal.replace("import { createClient } from '@/lib/supabase/client'", "import { createPayrollAction } from '@/app/dashboard/nominas/actions'")

handleSubmit_old = """    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('payroll_records').insert({
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
        onSuccess()
        onClose()
      } catch (err: any) {
        setErrors({ notes: `Error: ${err.message}` })
      }
    })"""

new_modal = new_modal.replace(handleSubmit_old, handleSubmit_new)
with open(f"{base_dir}/NewPayrollModal.tsx", "w") as f: f.write(new_modal)

# 5. Create EditPayrollModal.tsx
edit_modal = new_modal.replace("NewPayrollModalProps", "EditPayrollModalProps")
edit_modal = edit_modal.replace("createPayrollAction", "updatePayrollAction")
edit_modal = edit_modal.replace("Registrar Pago", "Guardar Cambios")
edit_modal = edit_modal.replace("nueva-nomina-form", "editar-nomina-form")
edit_modal = edit_modal.replace("export function NewPayrollModal({ open, onClose, onSuccess, employees }: EditPayrollModalProps) {", "export function EditPayrollModal({ open, onClose, onSuccess, employees, record }: EditPayrollModalProps) {")
edit_modal = edit_modal.replace("interface EditPayrollModalProps {\n  open: boolean\n  onClose: () => void\n  onSuccess: () => void\n  employees: Profile[]\n}", "interface EditPayrollModalProps {\n  open: boolean\n  onClose: () => void\n  onSuccess: () => void\n  employees: Profile[]\n  record: any\n}")
edit_modal = edit_modal.replace("import { useState, useTransition } from 'react'", "import { useEffect, useState, useTransition } from 'react'")

use_effect = """
  useEffect(() => {
    if (open && record) {
      setForm({
        profile_id: record.profile_id || '',
        period_start: record.period_start || getFirstDayOfMonth(),
        period_end: record.period_end || getLastDayOfMonth(),
        base_salary: record.base_salary ? String(record.base_salary) : '',
        bonuses: record.bonuses ? String(record.bonuses) : '0',
        deductions: record.deductions ? String(record.deductions) : '0',
        currency: record.currency || 'USD',
        status: record.status || 'borrador',
        notes: record.notes || ''
      })
    }
  }, [open, record])
"""
edit_modal = edit_modal.replace("const [isPending, startTransition] = useTransition()\n", "const [isPending, startTransition] = useTransition()\n" + use_effect)

handleSubmit_update_old = """await updatePayrollAction({"""
handleSubmit_update_new = """await updatePayrollAction(record.id, {"""
edit_modal = edit_modal.replace(handleSubmit_update_old, handleSubmit_update_new)

with open(f"{base_dir}/EditPayrollModal.tsx", "w") as f: f.write(edit_modal)


# 6. Refactor page.tsx
with open(page_path, "r") as f:
    page = f.read()

page = page.replace("import { NewPayrollButton } from '@/components/nominas/NewPayrollButton'", "import { NewPayrollButton } from '@/components/nominas/NewPayrollButton'\nimport { EditPayrollButton } from '@/components/nominas/EditPayrollButton'\nimport { DeletePayrollButton } from '@/components/nominas/DeletePayrollButton'\nimport { SearchInput } from '@/components/ui/SearchInput'")
page = page.replace("export const metadata: Metadata = { title: 'Nóminas y Pagos | FleetCore' }", "export const metadata: Metadata = { title: 'Nóminas y Pagos | FleetCore' }\nexport const dynamic = 'force-dynamic'")

if "export default async function NominasPage()" in page:
    page = page.replace("export default async function NominasPage() {", "export default async function NominasPage({ searchParams }: { searchParams?: { query?: string } }) {")
    
    query_old = """  // 1. Obtener registros de nómina
  const { data: records, error: fetchError } = await supabase
    .from('payroll_records')
    // Usar la relación específica porque hay dos referencias a profiles (profile_id y created_by)
    .select('*, profiles!payroll_records_profile_id_fkey(full_name, role, cedula_identidad)')
    .order('period_start', { ascending: false })"""
    
    query_new = """  const query = searchParams?.query || ''
  
  let queryBuilder = supabase
    .from('payroll_records')
    .select('*, profiles!payroll_records_profile_id_fkey!inner(full_name, role, cedula_identidad)')
    
  if (query) {
    queryBuilder = queryBuilder.or(`profiles.full_name.ilike.%${query}%`)
  }
  
  const { data: records, error: fetchError } = await queryBuilder.order('period_start', { ascending: false })"""
    
    page = page.replace(query_old, query_new)

    toolbar = """      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SearchInput placeholder="Buscar por personal..." />
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
                        <EditPayrollButton record={record} employees={safeEmployees} />
                        <DeletePayrollButton id={record.id} />
                      </div>
                    </td>
                  </tr>"""
    page = page.replace(td_old, td_new)

with open(page_path, "w") as f: f.write(page)

print("Refactored Nominas!")
