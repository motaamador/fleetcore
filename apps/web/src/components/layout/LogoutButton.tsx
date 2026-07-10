'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      window.location.href = '/auth/login'
    })
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="sidebar-link w-full text-danger hover:bg-danger-bg hover:text-danger disabled:opacity-50"
    >
      <LogOut className="w-4 h-4" />
      <span>{isPending ? 'Cerrando...' : 'Cerrar Sesión'}</span>
    </button>
  )
}
