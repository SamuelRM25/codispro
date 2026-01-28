'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, TrendingUp, TrendingDown, Users, Wrench, Truck, Building2, Package, DollarSign, AlertTriangle, RefreshCw, Download } from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { toast } from 'sonner'

interface Metrics {
  summary: {
    totalWorkers: number
    activeWorkers: number
    totalTools: number
    toolsInUse: number
    toolsAvailable: number
    totalVehicles: number
    vehiclesInUse: number
    vehiclesAvailable: number
    totalProjects: number
    activeProjects: number
    completedProjects: number
    totalShipments: number
    pendingShipments: number
    completedShipments: number
  }
  financial: {
    income: number
    expenses: number
    balance: number
    transactionCount: number
  }
  alerts: {
    overdueTools: number
    pendingShipments: number
  }
  weeklyGrowth: {
    workers: number
    tools: number
    vehicles: number
    projects: number
  }
  projectProgress: Array<{
    name: string
    progress: number
    status: string
    budget: number | null
  }>
  recentShipments: Array<{
    id: string
    materialName: string
    sentQuantity: number
    receivedQuantity: number | null
    status: string
    vehicle: { plate: string; name: string }
    project: { name: string } | null
  }>
  overdueTools: Array<{
    tool: { name: string }
    worker: { firstName: string; lastName: string }
    loanDate: Date
  }>
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function AnalyticsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/dashboard/metrics')
      const data = await response.json()
      setMetrics(data)
    } catch (error) {
      toast.error('Error al cargar métricas')
    } finally {
      setLoading(false)
    }
  }

  const exportToExcel = async (type: string) => {
    try {
      const response = await fetch(`/api/reports/excel/${type}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('Exportado a Excel exitosamente')
    } catch (error) {
      toast.error('Error al exportar')
    }
  }

  if (!user || !metrics) return null

  const growthData = [
    { name: 'Trabajadores', value: metrics.weeklyGrowth.workers },
    { name: 'Herramientas', value: metrics.weeklyGrowth.tools },
    { name: 'Vehículos', value: metrics.weeklyGrowth.vehicles },
    { name: 'Proyectos', value: metrics.weeklyGrowth.projects },
  ]

  const statusData = [
    { name: 'Completados', value: metrics.summary.completedProjects },
    { name: 'Activos', value: metrics.summary.activeProjects },
    { name: 'Otros', value: metrics.summary.totalProjects - metrics.summary.activeProjects - metrics.summary.completedProjects },
  ]

  const utilizationData = [
    { name: 'Herramientas', uso: metrics.summary.toolsInUse, disponible: metrics.summary.toolsAvailable },
    { name: 'Vehículos', uso: metrics.summary.vehiclesInUse, disponible: metrics.summary.vehiclesAvailable },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Dashboard Avanzado</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Métricas KPI y análisis de datos
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToExcel('workers')}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchMetrics}
              disabled={loading}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Trabajadores"
            value={metrics.summary.totalWorkers}
            active={metrics.summary.activeWorkers}
            icon={Users}
            color="blue"
          />
          <KPICard
            title="Herramientas"
            value={metrics.summary.totalTools}
            active={metrics.summary.toolsInUse}
            icon={Wrench}
            color="orange"
          />
          <KPICard
            title="Vehículos"
            value={metrics.summary.totalVehicles}
            active={metrics.summary.vehiclesInUse}
            icon={Truck}
            color="green"
          />
          <KPICard
            title="Proyectos"
            value={metrics.summary.totalProjects}
            active={metrics.summary.activeProjects}
            icon={Building2}
            color="purple"
          />
        </div>

        {/* Alerts */}
        {(metrics.alerts.overdueTools > 0 || metrics.alerts.pendingShipments > 0) && (
          <Card className="border-yellow-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                <AlertTriangle className="w-5 h-5" />
                Alertas Activas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {metrics.alerts.overdueTools > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Wrench className="w-4 h-4" />
                  <span>
                    {metrics.alerts.overdueTools} herramientas sin devolver (más de 24h)
                  </span>
                </div>
              )}
              {metrics.alerts.pendingShipments > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Package className="w-4 h-4" />
                  <span>
                    {metrics.alerts.pendingShipments} envíos pendientes
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Ingresos (Mes)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-2xl font-bold text-green-600">
                  Q{metrics.financial.income.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Gastos (Mes)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <span className="text-2xl font-bold text-red-600">
                  Q{metrics.financial.expenses.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Balance (Mes)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span className={`text-2xl font-bold ${metrics.financial.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Q{metrics.financial.balance.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Growth */}
          <Card>
            <CardHeader>
              <CardTitle>Crecimiento Semanal</CardTitle>
              <CardDescription>Nuevos registros esta semana</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Project Status */}
          <Card>
            <CardHeader>
              <CardTitle>Estado de Proyectos</CardTitle>
              <CardDescription>Distribución por estado</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tool/Vehicle Utilization */}
          <Card>
            <CardHeader>
              <CardTitle>Utilización</CardTitle>
              <CardDescription>Herramientas y vehículos en uso</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={utilizationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="uso" stackId="a" fill="#3b82f6" name="En Uso" />
                  <Bar dataKey="disponible" stackId="a" fill="#10b981" name="Disponible" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Project Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Avance de Proyectos</CardTitle>
              <CardDescription>Porcentaje de completado</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.projectProgress.slice(0, 5)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="progress" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Shipments */}
        {metrics.recentShipments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Envíos Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metrics.recentShipments.slice(0, 5).map((shipment) => (
                  <div key={shipment.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{shipment.materialName}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {shipment.vehicle.name} ({shipment.vehicle.plate})
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{shipment.sentQuantity} {shipment.sentQuantity === 1 ? 'unidad' : 'unidades'}</p>
                      <p className="text-xs text-slate-500">
                        {shipment.project?.name || 'Sin proyecto'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

function KPICard({
  title,
  value,
  active,
  icon: Icon,
  color,
}: {
  title: string
  value: number
  active: number
  icon: any
  color: string
}) {
  const colorClasses = {
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
          {title}
        </CardTitle>
        <div className={`${colorClasses[color as keyof typeof colorClasses]} p-2 rounded-lg`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {active} activos
        </p>
      </CardContent>
    </Card>
  )
}
