'use client'

import { useState } from 'react'
import { Menu, X, Truck } from 'lucide-react'
import { SidebarNav } from './SidebarNav'
import { LogoutButton } from './LogoutButton'

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="md:hidden flex items-center mr-3 print:hidden">
      <button 
        onClick={() => setIsOpen(true)} 
        className="p-1.5 -ml-1.5 text-text-secondary hover:text-text-primary rounded-md hover:bg-background transition-colors"
      >
        <Menu className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Sidebar Drawer */}
          <div className="relative w-[280px] max-w-[85vw] h-full bg-sidebar-bg flex flex-col animate-slide-right shadow-2xl border-r border-sidebar-border">
            
            {/* Header del Drawer */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-sidebar-border bg-background">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
                  <Truck className="w-4 h-4 text-gray-900" />
                </div>
                <span className="text-lg font-bold text-white tracking-tight">
                  Fleet<span className="text-primary">Core</span>
                </span>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-background-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navegación (Cerramos el menú al hacer clic en cualquier link) */}
            <div onClick={() => setIsOpen(false)} className="flex-1 overflow-y-auto">
              <SidebarNav />
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-sidebar-border bg-background">
               <LogoutButton />
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
