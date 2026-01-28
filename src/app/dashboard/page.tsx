'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LayoutDashboard,
  Users,
  Wrench,
  Truck,
  Package,
  DollarSign,
  Building2,
  LogOut,
  HardHat,
  MapPin,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Download,
  Database,
  Calendar as CalendarIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const modules = [
  {
    id: 'workers',
    title: 'Trabajadores',
    description: 'Gestión del personal de la constructora',
    icon: Users,
    color: 'bg-primary',
  },
  {
    id: 'tools',
    title: 'Herramientas',
    description: 'Inventario y control de préstamos',
    icon: Wrench,
    color: 'bg-accent',
  },
  {
    id: 'vehicles',
    title: 'Vehículos',
    description: 'Control de flota y repuestos',
    icon: Truck,
    color: 'bg-primary/80',
  },
  {
    id: 'shipments',
    title: 'Envíos',
    description: 'Control de envíos de materiales',
    icon: Package,
    color: 'bg-accent/80',
  },
  {
    id: 'petty-cash',
    title: 'Caja Chica',
    description: 'Control de ingresos y egresos',
    icon: DollarSign,
    color: 'bg-primary/70',
  },
  {
    id: 'projects',
    title: 'Proyectos',
    description: 'Gestión integral de proyectos',
    icon: Building2,
    color: 'bg-accent/70',
  },
  {
    id: 'location',
    title: 'Ubicación',
    description: 'Rastreo GPS en tiempo real',
    icon: MapPin,
    color: 'bg-primary/60',
  },
  {
    id: 'calendar',
    title: 'Calendario',
    description: 'Vista de todas las actividades',
    icon: CalendarIcon,
    color: 'bg-accent/60',
  },
]

const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899']

export default function DashboardPage() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/dashboard/stats')
      const data = await response.json()
      if (response.ok && data && !data.error) {
        setStats(data)
      } else {
        setStats(null)
        console.error('Stats error:', data.error)
      }
    } catch (error) {
      setStats(null)
      console.error('Fetch stats error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isClient) {
      fetchStats()
    }
  }, [isClient])

  const handleLogout = () => {
    logout()
    toast.success('Sesión cerrada')
    router.push('/')
  }

  const handleExportPDF = async (type: string) => {
    try {
      const response = await fetch(`/api/reports/pdf?type=${type}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte_${type}_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Reporte PDF generado')
    } catch (error) {
      toast.error('Error al generar reporte PDF')
    }
  }

  const handleBackup = async () => {
    try {
      const response = await fetch('/api/backup')
      const data = await response.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup_constructora_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Backup creado exitosamente')
    } catch (error) {
      toast.error('Error al crear backup')
    }
  }

  const projectsChartData = stats?.projects ? Object.entries(stats.projects).map(([status, count]) => ({
    name: status,
    value: count as number,
  })) : []

  const vehiclesChartData = stats?.vehicles ? Object.entries(stats.vehicles).map(([status, count]) => ({
    name: status,
    value: count as number,
  })) : []

  const toolsChartData = stats?.tools ? [
    { name: 'Disponibles', value: stats.tools?.available || 0 },
    { name: 'En Uso', value: stats.tools?.inUse || 0 },
  ] : []

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full glass dark:glass-dark border-b border-white/10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-1.5 bg-white/50 dark:bg-white/10 rounded-xl shadow-sm border border-white/20">
              <img src="/logo.png" alt="CODISPRO" className="w-10 h-10 object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter text-primary dark:text-white uppercase transition-colors">
                CODISPRO
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Constructora Proyectos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {user?.name}
              </p>
              <p className="text-[9px] font-bold text-primary dark:text-accent tracking-widest uppercase">
                Administrador
              </p>
            </div>

            <div className="h-8 w-px bg-slate-200 dark:bg-white/10 mx-2 hidden md:block" />

            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchStats}
                disabled={loading}
                className="hover:bg-primary/5 rounded-full"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-2 text-slate-500 hover:text-destructive font-bold transition-all rounded-full px-4"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-10 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-4xl font-black tracking-tight dark:text-white">Panel de Control</h2>
            <p className="text-base text-slate-500 dark:text-slate-400 font-medium tracking-tight">
              Bienvenido al centro de operaciones. Selecciona un módulo para gestionar.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-xl border-white/20 glass-dark text-white font-bold" onClick={handleBackup}>
              <Database className="w-4 h-4 mr-2" />
              Backup
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        {!loading && stats && stats.counts && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Trabajadores', val: stats.counts.workers, icon: Users, col: 'text-blue-500' },
              { label: 'Herramientas', val: stats.counts.tools, icon: Wrench, col: 'text-orange-500' },
              { label: 'Vehículos', val: stats.counts.vehicles, icon: Truck, col: 'text-green-500' },
              { label: 'Proyectos', val: stats.counts.projects, icon: Building2, col: 'text-pink-500' },
              { label: 'Envíos', val: stats.counts.shipments, icon: Package, col: 'text-purple-500' },
            ].map((kpi, i) => (
              <Card key={i} className="border-none glass dark:glass-dark shadow-md overflow-hidden group hover:scale-[1.02] transition-transform">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{kpi.label}</p>
                    <kpi.icon className={`w-4 h-4 ${kpi.col} opacity-50`} />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-3xl font-black">{kpi.val}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Alerts Section (Subtle) */}
        {!loading && stats && stats.overdueToolLoans.length > 0 && (
          <div className="p-4 border-l-4 border-orange-500 rounded-2xl glass-dark bg-orange-500/5 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-orange-600 dark:text-orange-400">
                <AlertTriangle className="w-5 h-5" />
                <p className="font-bold">
                  {stats.overdueToolLoans.length} herramientas tienen el plazo de devolución vencido
                </p>
              </div>
              <Button variant="link" onClick={() => router.push('/dashboard/tools')} className="text-orange-600 dark:text-orange-400 font-black p-0">
                Revisar Ahora <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Module Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((module) => {
            const Icon = module.icon
            return (
              <Card
                key={module.id}
                className="group relative h-48 border-white/5 dark:border-white/10 glass dark:glass-dark hover:border-primary/50 transition-all duration-500 cursor-pointer overflow-hidden rounded-3xl"
                onClick={() => router.push(`/dashboard/${module.id}`)}
              >
                <div className={`absolute -right-4 -top-4 w-24 h-24 ${module.color} opacity-[0.03] group-hover:opacity-[0.08] rounded-full blur-2xl transition-all duration-500 group-hover:scale-150`} />
                <CardHeader className="h-full flex flex-col justify-between p-6">
                  <div className={`w-14 h-14 rounded-2xl ${module.color} flex items-center justify-center shadow-2xl shadow-primary/20 group-hover:scale-110 transition-transform duration-500`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black tracking-tight group-hover:text-primary transition-colors">{module.title}</CardTitle>
                    <CardDescription className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
                      {module.id === 'petty-cash' ? 'Finanzas' : 'Operaciones'}
                    </CardDescription>
                  </div>
                </CardHeader>
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-primary" />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Charts Section (Minimal) */}
        {!loading && stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 pb-12">
            <Card className="border-none glass dark:glass-dark rounded-3xl overflow-hidden shadow-2xl">
              <CardHeader className="p-8 pb-2">
                <CardTitle className="text-xl font-black">Estado de Herramientas</CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={toolsChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {toolsChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none glass dark:glass-dark rounded-3xl overflow-hidden shadow-2xl">
              <CardHeader className="p-8 pb-2">
                <div className="flex items-center justify-between w-full">
                  <CardTitle className="text-xl font-black">Caja Chica</CardTitle>
                  <div className={`${(stats.pettyCash?.balance || 0) >= 0 ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'} px-4 py-1.5 rounded-full text-sm font-black`}>
                    Q{(stats.pettyCash?.balance || 0).toFixed(2)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/20">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Ingresos</p>
                    <p className="text-2xl font-black text-green-600">Q{(stats.pettyCash?.income || 0).toFixed(2)}</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/20">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Egresos</p>
                    <p className="text-2xl font-black text-red-600">Q{(stats.pettyCash?.expense || 0).toFixed(2)}</p>
                  </div>
                </div>
                <Button className="w-full h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20" onClick={() => router.push('/dashboard/petty-cash')}>
                  Ver Detalles de Caja <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 bg-transparent py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
            © 2025 CODISPRO Solutions • Enterprise Edition
          </p>
        </div>
      </footer>
    </div>
  )
}
