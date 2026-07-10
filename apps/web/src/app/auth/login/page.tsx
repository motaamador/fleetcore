'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Truck, Mail, Lock, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const nextPath     = searchParams.get('next') || '/dashboard'

  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [showPass,  setShowPass]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError('Por favor completa todos los campos.')
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (authError) {
      setError(
        authError.message.includes('Invalid login credentials')
          ? 'Correo o contraseña incorrectos. Verifica tus datos.'
          : authError.message
      )
      setLoading(false)
      return
    }

    // Login exitoso → redirigir
    router.push(nextPath)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">

      {/* Tarjeta de Login */}
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <Truck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Fleet<span className="text-primary-light">Core</span>
          </h1>
          <p className="text-sm text-text-muted mt-1">Sistema de Gestión de Flota y Construcción</p>
        </div>

        {/* Card */}
        <div className="card shadow-xl border border-border/60">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-text-primary">Iniciar Sesión</h2>
            <p className="text-sm text-text-muted mt-0.5">Ingresa con tu cuenta de administrador</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Error Banner */}
            {error && (
              <div className="flex items-start gap-2.5 bg-danger-bg border border-danger/20 rounded-lg p-3 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
                <p className="text-sm text-danger leading-snug">{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="label">
                <Mail className="w-3.5 h-3.5" />
                Correo Electrónico
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                className="input"
                placeholder="admin@fleetcore.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label className="label">
                <Lock className="w-3.5 h-3.5" />
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="input pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2 h-10"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Verificando...</>
              ) : (
                'Ingresar al Sistema'
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-xs text-text-muted text-center">
              ¿Sin cuenta? Contacta al administrador del sistema.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-text-muted text-center mt-6">
          FleetCore ERP © {new Date().getFullYear()} — Todos los derechos reservados
        </p>
      </div>

    </div>
  )
}
