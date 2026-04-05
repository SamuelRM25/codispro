'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  Wrench,
  Truck,
  Package,
  DollarSign,
  Building2,
  Calendar as CalendarIcon,
  FileText,
  LogOut,
  Menu,
  Activity,
  ListOrdered
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/summary', label: 'Resumen Diario', icon: Activity },
  { href: '/dashboard/invoices', label: 'Facturas', icon: FileText },
  { href: '/dashboard/workers', label: 'Trabajadores', icon: Users },
  { href: '/dashboard/tools', label: 'Herramientas', icon: Wrench },
  { href: '/dashboard/vehicles', label: 'Vehículos', icon: Truck },
  { href: '/dashboard/shipments', label: 'Envíos', icon: Package },
  { href: '/dashboard/petty-cash', label: 'Caja Chica', icon: DollarSign },
  { href: '/dashboard/projects', label: 'Proyectos', icon: Building2 },
  { href: '/dashboard/calendar', label: 'Calendario', icon: CalendarIcon },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user, _hasHydrated, logout } = useAuthStore()
  const [hasMounted, setHasMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (hasMounted && _hasHydrated && !isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, _hasHydrated, hasMounted, router])

  if (!hasMounted || !_hasHydrated || !isAuthenticated || !user) {
    return null
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f7fb] dark:bg-slate-950 font-sans">
      {/* Sidebar background overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#1e293b] text-slate-300 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 shrink-0 items-center justify-center border-b border-slate-700/50 bg-[#0f172a] px-6">
          <div className="flex items-center gap-3">
             <div className="p-1 bg-white/10 rounded-lg">
               <img src="/logo.png" alt="CODISPRO" className="w-8 h-8 object-contain drop-shadow-md" />
             </div>
             <div>
                <h1 className="text-xl font-bold tracking-tight text-white uppercase">CODISPRO</h1>
             </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto py-4">
          <div className="px-6 mb-4 mt-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Menú Principal</p>
          </div>
          <nav className="flex-1 space-y-1 px-3">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/dashboard')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-white'
                    }`}
                  />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="border-t border-slate-700/50 p-4">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-600 text-white font-bold text-lg">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white truncate max-w-[120px]">{user.name}</span>
              <span className="text-xs text-slate-400">Administrador</span>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-slate-300 hover:bg-red-500/10 hover:text-red-400 rounded-xl"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white dark:bg-[#0f172a] px-6 shadow-sm z-30">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          
          <div className="flex flex-1 items-center justify-between lg:justify-end">
             <div className="lg:hidden font-bold">CODISPRO</div>
             <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{new Date().toLocaleDateString('es-GT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
             </div>
          </div>
        </header>

        {/* Dynamic page content */}
        <main className="flex-1 overflow-y-auto w-full p-4 md:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
