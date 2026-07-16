'use client'
// src/components/admin/AdminSidebar.tsx

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ROLE_LABELS } from '@/types'
import type { UserRole } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = [
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    icon: '📊',
    roles: ['admin_geral', 'admin_comercial', 'financeiro', 'visualizador'],
  },
  {
    href: '/admin/empreendimentos',
    label: 'Empreendimentos',
    icon: '🏗️',
    roles: ['admin_geral', 'admin_comercial', 'financeiro', 'visualizador'],
  },
  {
    href: '/admin/unidades',
    label: 'Unidades',
    icon: '🏠',
    roles: ['admin_geral', 'admin_comercial', 'financeiro', 'visualizador'],
  },
  {
    href: '/admin/vendas',
    label: 'Vendas',
    icon: '💼',
    roles: ['admin_geral', 'admin_comercial', 'financeiro', 'visualizador'],
  },
  {
    href: '/admin/relatorios',
    label: 'Relatórios',
    icon: '📈',
    roles: ['admin_geral', 'admin_comercial', 'financeiro', 'visualizador'],
  },
  {
    href: '/admin/usuarios',
    label: 'Usuários',
    icon: '👥',
    roles: ['admin_geral'],
  },
]

interface Props {
  profile: {
    nome: string
    email: string
    role: string
  }
}

export function AdminSidebar({ profile }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  const visibleItems = NAV_ITEMS.filter(item =>
    item.roles.includes(profile.role as UserRole)
  )

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <div
      className={cn(
        'flex flex-col bg-slate-900 text-white transition-all duration-300 shrink-0',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo / Brand */}
      <div className="h-16 flex items-center px-4 border-b border-slate-700/50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/apple-icon.png" alt="Casa Forte" className="w-8 h-8 rounded-lg object-contain shrink-0" />
        {!collapsed && (
          <div className="ml-3 min-w-0">
            <div className="text-sm font-semibold text-white truncate">Casa Forte</div>
            <div className="text-xs text-slate-400 truncate">Tabelas de Vendas</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-slate-400 hover:text-white transition-colors"
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-0.5 px-2">
        {visibleItems.map(item => {
          const active =
            pathname === item.href ||
            (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                active
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              )}
              title={collapsed ? item.label : undefined}
            >
              <span className="text-base shrink-0">{item.icon}</span>
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User + signout */}
      <div className="p-3 border-t border-slate-700/50">
        {!collapsed && (
          <div className="px-2 pb-2">
            <div className="text-xs font-medium text-white truncate">{profile.nome}</div>
            <div className="text-xs text-slate-400 truncate">
              {ROLE_LABELS[profile.role as UserRole] ?? profile.role}
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <Link
            href="/"
            target="_blank"
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
            title="Ver site público"
          >
            <span>🔗</span>
            {!collapsed && <span>Site público</span>}
          </Link>
          <button
            onClick={handleSignOut}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-slate-300 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Sair"
          >
            <span>🚪</span>
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </div>
    </div>
  )
}
