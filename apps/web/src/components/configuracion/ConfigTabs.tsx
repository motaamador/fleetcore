'use client'

import { useState } from 'react'
import { Users, Building2, Shield } from 'lucide-react'

const TABS = [
  { id: 'users',   label: 'Usuarios y Roles', icon: Users },
  { id: 'company', label: 'Empresa',          icon: Building2 },
  { id: 'system',  label: 'Sistema',          icon: Shield },
] as const

type TabId = (typeof TABS)[number]['id']

export function ConfigTabs({
  usersContent,
  companyContent,
  systemContent,
}: {
  usersContent:   React.ReactNode
  companyContent: React.ReactNode
  systemContent:  React.ReactNode
}) {
  const [active, setActive] = useState<TabId>('users')

  const content: Record<TabId, React.ReactNode> = {
    users:   usersContent,
    company: companyContent,
    system:  systemContent,
  }

  return (
    <div>
      {/* Tab Nav */}
      <div className="border-b border-border mb-6">
        <nav className="flex gap-1 -mb-px">
          {TABS.map(tab => {
            const Icon    = tab.icon
            const isActive = active === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${isActive
                    ? 'border-primary text-primary-700'
                    : 'border-transparent text-text-muted hover:text-text-secondary hover:border-border-strong'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="animate-fade-in">
        {content[active]}
      </div>
    </div>
  )
}
