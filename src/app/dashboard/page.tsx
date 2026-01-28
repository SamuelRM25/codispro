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
    color: 'bg-blue-500',
  },
  {
    id: 'tools',
    title: 'Herramientas',
    description: 'Inventario y control de préstamos',
    icon: Wrench,
    color: 'bg-orange-500',
  },
  {
    id: 'vehicles',
    title: 'Vehículos',
    description: 'Control de flota y repuestos',
    icon: Truck,
    color: 'bg-green-500',
  },
  {
    id: 'shipments',
    title: 'Envíos',
    description: 'Control de envíos de materiales',
    icon: Package,
    color: 'bg-purple-500',
  },
  {
    id: 'petty-cash',
    title: 'Caja Chica',
    description: 'Control de ingresos y egresos',
    icon: DollarSign,
    color: 'bg-yellow-500',
  },
  {
    id: 'projects',
    title: 'Proyectos',
    description: 'Gestión integral de proyectos',
    icon: Building2,
    color: 'bg-pink-500',
  },
  {
    id: 'location',
    title: 'Ubicación',
    description: 'Rastreo GPS en tiempo real',
    icon: MapPin,
    color: 'bg-red-500',
  },
  {
    id: 'calendar',
    title: 'Calendario',
    description: 'Vista de todas las actividades',
    icon: CalendarIcon,
    color: 'bg-cyan-500',
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
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <HardHat className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">CODISPRO</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Bienvenido, {user?.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchStats}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 space-y-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Panel de Control</h2>
          <p className="text-slate-600 dark:text-slate-400">
            Selecciona un módulo para comenzar
          </p>
        </div>

        {/* Alerts Section */}
        {!loading && stats && stats.overdueToolLoans.length > 0 && (
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-orange-700 dark:text-orange-400">
                <AlertTriangle className="w-5 h-5" />
                Herramientas Sin Devolver ({stats.overdueToolLoans.length})
              </CardTitle>
              <CardDescription>
                Herramientas que están prestadas y no han sido devueltas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {stats.overdueToolLoans.map((loan: any) => (
                  <div key={loan.id} className="p-3 bg-white dark:bg-slate-900 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{loan.tool.name}</p>
                        <p className="text-sm text-slate-600">
                          Prestado a: {loan.worker.firstName} {loan.worker.lastName}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push('/dashboard/tools')}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Module Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => {
            const Icon = module.icon
            return (
              <Card
                key={module.id}
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => router.push(`/dashboard/${module.id}`)}
              >
                <CardHeader>
                  <div className={`${module.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </div>

        {/* KPI Cards */}
        {!loading && stats && stats.counts && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Trabajadores
                </CardTitle>
                <Users className="w-4 h-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.counts.workers}</div>
                <p className="text-xs text-slate-500">Activos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Herramientas
                </CardTitle>
                <Wrench className="w-4 h-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.counts.tools}</div>
                <p className="text-xs text-slate-500">
                  {stats.tools?.available || 0} disponibles, {stats.tools?.inUse || 0} en uso
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Vehículos
                </CardTitle>
                <Truck className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.counts.vehicles}</div>
                <p className="text-xs text-slate-500">En flota</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Proyectos
                </CardTitle>
                <Building2 className="w-4 h-4 text-pink-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.counts.projects}</div>
                <p className="text-xs text-slate-500">Activos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Envíos
                </CardTitle>
                <Package className="w-4 h-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.counts.shipments}</div>
                <p className="text-xs text-slate-500">Total</p>
              </CardContent>
            </Card>
          </div>
        )}


        {/* Charts Section */}
        {!loading && stats && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Tools Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estado de Herramientas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={toolsChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {toolsChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Projects Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Proyectos por Estado</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={projectsChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Petty Cash */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-yellow-500" />
                  Caja Chica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Ingresos</span>
                    <span className="text-sm font-medium text-green-600">
                      Q{(stats.pettyCash?.income || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Egresos</span>
                    <span className="text-sm font-medium text-red-600">
                      Q{(stats.pettyCash?.expense || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Balance</span>
                      <span className={`text-lg font-bold ${(stats.pettyCash?.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Q{(stats.pettyCash?.balance || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-auto">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-slate-600 dark:text-slate-400">
          <p>© 2025 CODISPRO - Sistema de Gestión</p>
        </div>
      </footer>
    </div>
  )
}
