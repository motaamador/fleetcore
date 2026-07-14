import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: {
    template: '%s | FleetCore',
    default: 'FleetCore — Sistema de Gestión de Construcción y Fletes',
  },
  description: 'Plataforma administrativa para gestión de flota, fletes, inventario y facturación.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head />
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
