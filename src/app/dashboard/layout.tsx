'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
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
  Bell,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const ADMIN_MENU = [
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

const ROLE_DASHBOARDS: Record<string, string> = {
  BODEGA: '/dashboard/bodega',
  VEHICULO: '/dashboard/vehiculo',
  RECEPTOR: '/dashboard/receptor',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [hasMounted, setHasMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [notifOpen, setNotifOpen] = useState(false)
  const [selectedNotif, setSelectedNotif] = useState<any | null>(null)

  useEffect(() => { setHasMounted(true) }, [])

  const user = session?.user
  const role = user?.role as string

  useEffect(() => {
    if (!hasMounted || status === 'loading') return
    if (!session) {
      router.push('/')
      return
    }
    const roleRedirect = ROLE_DASHBOARDS[role]
    if (roleRedirect && pathname !== roleRedirect) {
      router.replace(roleRedirect)
    }
  }, [session, status, hasMounted, role, pathname, router])

  const fetchNotifications = useCallback(async () => {
    if (!user || role !== 'ADMIN') return
    try {
      const res = await fetch('/api/tool-loans/notifications')
      const data = await res.json()
      if (Array.isArray(data)) {
        const prev = notifications.length
        setNotifications(data)
        if (data.length > prev) {
          const newest = data[0]
          toast.info(`Nueva herramienta sacada: "${newest.tool?.name}" — ${newest.worker ? newest.worker.firstName + ' ' + newest.worker.lastName : 'Sin asignar'}`, {
            duration: 6000,
          })
        }
      }
    } catch { }
  }, [user, role, notifications.length])

  useEffect(() => {
    if (!user || role !== 'ADMIN') return
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 15000)
    return () => clearInterval(interval)
  }, [fetchNotifications, user, role])

  const markAllRead = async () => {
    await fetch('/api/tool-loans/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    })
    setNotifications([])
    setNotifOpen(false)
  }

  const markOneRead = async (id: string) => {
    await fetch('/api/tool-loans/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  if (!hasMounted || status === 'loading' || !session) return null

  const handleLogout = async () => {
    const { signOut } = await import('next-auth/react')
    await signOut({ callbackUrl: '/' })
  }

  if (ROLE_DASHBOARDS[role]) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f7fb] dark:bg-slate-950 font-sans">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#1e293b] text-slate-300 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 shrink-0 items-center justify-center border-b border-slate-700/50 bg-[#0f172a] px-6">
          <div className="flex items-center gap-3">
            <div className="p-1 bg-white/10 rounded-lg">
              <img src="/logo.png" alt="CODISPRO" className="w-8 h-8 object-contain drop-shadow-md" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white uppercase">CODISPRO</h1>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto py-4">
          <div className="px-6 mb-4 mt-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Menu Principal</p>
          </div>
          <nav className="flex-1 space-y-1 px-3">
            {ADMIN_MENU.map((item) => {
              const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/dashboard')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isActive ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-slate-800/50 hover:text-white'}`}
                >
                  <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-white'}`} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="border-t border-slate-700/50 p-4">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-600 text-white font-bold text-lg">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white truncate max-w-[120px]">{user.name}</span>
              <span className="text-xs text-slate-400 capitalize">{role}</span>
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-slate-300 hover:bg-red-500/10 hover:text-red-400 rounded-xl">
            <LogOut className="mr-3 h-5 w-5" />
            Cerrar Sesion
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white dark:bg-[#0f172a] px-6 shadow-sm z-30">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>

          <div className="flex flex-1 items-center justify-between lg:justify-end">
            <div className="lg:hidden font-bold">CODISPRO</div>
            <div className="flex items-center gap-4">
              {role === 'ADMIN' && (
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    onClick={() => setNotifOpen(o => !o)}
                  >
                    <Bell className="h-5 w-5" />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                        {notifications.length}
                      </span>
                    )}
                  </Button>

                  {notifOpen && (
                    <div className="absolute right-0 top-12 w-96 bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                        <span className="font-black text-sm uppercase text-slate-900 dark:text-white">Herramientas sacadas</span>
                        <div className="flex items-center gap-2">
                          {notifications.length > 0 && (
                            <button onClick={markAllRead} className="text-xs text-blue-500 hover:underline font-bold">Marcar todas</button>
                          )}
                          <button onClick={() => setNotifOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
                        </div>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-slate-500 text-sm">Sin notificaciones nuevas</div>
                        ) : (
                          notifications.map(n => (
                            <div key={n.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 cursor-pointer"
                              onClick={() => { setSelectedNotif(n); setNotifOpen(false) }}>
                              <div className="flex gap-3">
                                {n.photo ? (
                                  <img src={n.photo} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                                ) : (
                                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                    <Wrench className="w-5 h-5 text-amber-500" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{n.tool?.name}</p>
                                  <p className="text-xs text-slate-500">{n.worker ? `${n.worker.firstName} ${n.worker.lastName}` : 'Sin asignar'}</p>
                                  <p className="text-xs text-slate-400 mt-0.5">{n.user?.name}</p>
                                </div>
                                <button
                                  onClick={e => { e.stopPropagation(); markOneRead(n.id) }}
                                  className="text-slate-400 hover:text-slate-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {new Date().toLocaleDateString('es-GT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </header>

        {selectedNotif && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setSelectedNotif(null)}>
            <div className="bg-white dark:bg-[#1e293b] rounded-3xl max-w-md w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="font-black text-lg uppercase">Herramienta Sacada</h3>
                <button onClick={() => setSelectedNotif(null)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              {selectedNotif.photo && (
                <img src={selectedNotif.photo} alt="Foto" className="w-full h-52 object-cover rounded-2xl" />
              )}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Herramienta</span>
                  <span className="font-bold">{selectedNotif.tool?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Categoria</span>
                  <span className="font-bold">{selectedNotif.tool?.category || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Trabajador</span>
                  <span className="font-bold">{selectedNotif.worker ? `${selectedNotif.worker.firstName} ${selectedNotif.worker.lastName}` : 'Sin asignar'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Bodeguero</span>
                  <span className="font-bold">{selectedNotif.user?.name}</span>
                </div>
              </div>
              <Button
                className="w-full rounded-xl"
                onClick={() => { markOneRead(selectedNotif.id); setSelectedNotif(null) }}
              >
                Marcar como visto
              </Button>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto w-full p-4 md:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}