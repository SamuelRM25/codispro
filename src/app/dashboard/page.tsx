'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Users,
  Wrench,
  Truck,
  Package,
  Building2,
  AlertTriangle,
  Sun,
  Clock,
  Activity,
  TrendingUp,
  Wind,
} from 'lucide-react'
import { TerminalManager } from '@/components/terminal-manager'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899']

export default function DashboardWidgetsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    setIsClient(true)
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
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
      }
    } catch (error) {
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isClient) {
      fetchStats()
    }
  }, [isClient])

  const toolsChartData = stats?.tools ? [
    { name: 'Disponibles', value: stats.tools?.available || 0 },
    { name: 'En Uso', value: stats.tools?.inUse || 0 },
  ] : []

  return (
    <div className="flex flex-col space-y-8 pb-10">

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic border-l-4 border-blue-600 pl-4">Panel de Inteligencia</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-tight pl-5">
            Estado Maestro de Operaciones. Bienvenido, <span className="font-bold text-slate-900 dark:text-white uppercase">{user?.name}</span>.
          </p>
        </div>

      </div>

      {/* TOP WIDGETS GRID: WEATHER & CLOCK & STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Real-time Clock Widget */}
        <Card className="border-none shadow-2xl bg-[#1e293b] text-white rounded-[2rem] overflow-hidden relative group h-full">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-700">
            <Clock className="w-32 h-32" />
          </div>
          <CardContent className="p-10 flex flex-col justify-between h-full min-h-[220px] relative z-10 text-white">
            <div>
              <p className="text-blue-400 font-black tracking-[0.2em] text-[10px] uppercase mb-2">HORA LOCAL EN TIEMPO REAL</p>
              {isClient ? (
                <div className="flex items-baseline gap-2">
                  <div className="text-5xl lg:text-6xl font-black tracking-tighter drop-shadow-md">
                    {time.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', hour12: true }).split(' ')[0]}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold opacity-80 leading-none">{time.toLocaleTimeString('es-GT', { hour12: true }).split(' ')[1].toUpperCase()}</span>
                    <span className="text-sm font-black text-blue-400 leading-none mt-1">.{time.getSeconds().toString().padStart(2, '0')}</span>
                  </div>
                </div>
              ) : (
                <div className="text-6xl font-black tracking-tighter">--:--</div>
              )}
            </div>
            {isClient && (
              <p className="text-sm font-black mt-6 text-slate-400 uppercase tracking-widest">
                {time.toLocaleDateString('es-GT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Weather Widget */}
        <Card className="border-none shadow-2xl bg-[#0f172a] text-white rounded-[2rem] overflow-hidden relative h-full">
          <div className="absolute top-0 right-0 p-8 opacity-20">
            <Sun className="w-32 h-32 text-orange-500 blur-sm" />
          </div>
          <CardContent className="p-10 flex flex-col justify-between h-full min-h-[220px] relative z-10 text-white">
            <div>
              <p className="text-orange-500 font-black tracking-[0.2em] text-[10px] uppercase mb-2">CLIMA / SEDE CENTRAL</p>
              <div className="flex items-center gap-4">
                <div className="p-4 bg-orange-500/10 rounded-3xl border border-orange-500/20">
                  <Sun className="w-12 h-12 text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
                </div>
                <div className="text-6xl font-black tracking-tighter text-white drop-shadow-md">
                  24°C
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-6">
              <span className="flex items-center gap-2 bg-slate-800 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border border-slate-700/50 text-slate-400">
                <Wind className="w-3 h-3" /> PARCIALMENTE SOLEADO
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Core Quick Stats - Overview */}
        {stats && (
          <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden min-h-[220px] h-full flex flex-col border border-slate-100 dark:border-white/5">
            <CardHeader className="p-10 pb-4">
              <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center justify-between">
                DISTRIBUCIÓN OPERATIVA <Activity className="w-4 h-4 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-10 pb-10 pt-4 flex-1 flex flex-col justify-center gap-8">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl"><Building2 className="w-6 h-6 text-blue-600" /></div>
                  <p className="font-black text-xs uppercase tracking-widest text-slate-500">Proyectos Activos</p>
                </div>
                <p className="font-black text-4xl text-slate-900 dark:text-white leading-none tracking-tighter">{stats.counts?.projects || 0}</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl"><Truck className="w-6 h-6 text-emerald-600" /></div>
                  <p className="font-black text-xs uppercase tracking-widest text-slate-500">Flota Logística</p>
                </div>
                <p className="font-black text-4xl text-slate-900 dark:text-white leading-none tracking-tighter">{stats.counts?.vehicles || 0}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* KPI SUMMARY CARDS */}
      {!loading && stats && stats.counts && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'PERSONAL ACTIVO', val: stats.counts.workers, icon: Users, col: 'text-blue-600', bg: 'bg-blue-600' },
            { label: 'EQUIPOS BODEGA', val: stats.counts.tools, icon: Wrench, col: 'text-orange-600', bg: 'bg-orange-600' },
            { label: 'ENVÍOS HOY', val: stats.counts.shipments, icon: Package, col: 'text-indigo-600', bg: 'bg-indigo-600' },
            { label: 'NOTIFICACIONES', val: stats.overdueToolLoans?.length || 0, icon: AlertTriangle, col: 'text-rose-600', bg: 'bg-rose-600' },
          ].map((kpi, i) => (
            <Card key={i} className="border-none shadow-xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden group hover:scale-[1.02] transition-all">
              <CardContent className="p-8 flex items-center gap-6">
                <div className={`p-5 rounded-2xl ${kpi.bg} shadow-lg shadow-black/10`}>
                  <kpi.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white leading-none mb-1">{kpi.val}</div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{kpi.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* FINANCIAL OVERVIEW SECTION */}
      {!loading && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Financial Card */}
          <Card className="lg:col-span-2 border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-10 pb-6 border-b border-slate-50 dark:border-white/5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black text-slate-900 dark:text-white uppercase italic">Flujo de Capital Directo</CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Análisis consolidado de caja chica</CardDescription>
              </div>
              <div className="h-12 w-12 bg-emerald-500/10 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent className="p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="p-8 rounded-[2rem] bg-emerald-500/5 border-2 border-emerald-500/10 relative overflow-hidden group">
                  <div className="absolute top-[-20px] right-[-20px] w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-4">INGRESOS DE CAPITAL</p>
                  <p className="text-4xl font-black text-emerald-700 dark:text-emerald-400 tracking-tighter">Q{(stats.pettyCash?.income || 0).toLocaleString()}</p>
                </div>
                <div className="p-8 rounded-[2rem] bg-rose-500/5 border-2 border-rose-500/10 relative overflow-hidden group">
                  <div className="absolute top-[-20px] right-[-20px] w-20 h-20 bg-rose-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                  <p className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em] mb-4">EGRESOS TOTALES</p>
                  <p className="text-4xl font-black text-rose-700 dark:text-rose-400 tracking-tighter">Q{(stats.pettyCash?.expense || 0).toLocaleString()}</p>
                </div>
              </div>
              <div className="p-8 bg-[#0f172a] rounded-[2rem] flex flex-col md:flex-row items-center justify-between text-white shadow-2xl shadow-black/30">
                <div className="mb-4 md:mb-0 text-center md:text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">SALDO DISPONIBLE EN CAJA</p>
                  <p className="text-4xl font-black tracking-tighter text-white">Q{(stats.pettyCash?.balance || 0).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest border-2 ${(stats.pettyCash?.balance || 0) >= 0 ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' : 'border-rose-500/50 text-rose-400 bg-rose-500/10'}`}>
                    {((stats.pettyCash?.balance || 0) >= 0) ? 'LIQUIDEZ ALTA' : 'CRÍTICO'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tools Status Chart Card */}
          <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden flex flex-col">
            <CardHeader className="p-10 pb-6 border-b border-slate-50 dark:border-white/5">
              <CardTitle className="text-xl font-black text-slate-900 dark:text-white uppercase italic">Inventario</CardTitle>
              <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Ubicación de activos</CardDescription>
            </CardHeader>
            <CardContent className="p-10 flex flex-col items-center justify-center gap-8 flex-1">
              <div className="w-full h-[220px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={toolsChartData}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={80}
                      paddingAngle={10} dataKey="value"
                      stroke="rgba(0,0,0,0)"
                    >
                      {toolsChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.2)', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text for the donut chart */}
                <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{(stats.counts?.tools || 0)}</p>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Equipos</p>
                </div>
              </div>
              <div className="w-full space-y-3">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Bodega Central</span>
                  </div>
                  <span className="font-black text-xl text-slate-900 dark:text-white leading-none">{stats.tools?.available || 0}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">En Destino / Obra</span>
                  </div>
                  <span className="font-black text-xl text-slate-900 dark:text-white leading-none">{stats.tools?.inUse || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* HARDWARE MANAGEMENT SECTION */}
      <div className="pt-10 border-t border-slate-100 dark:border-white/5">
        <TerminalManager />
      </div>

      {/* FOOTER SPACER */}
      <div className="h-4" />
    </div>
  )
}
