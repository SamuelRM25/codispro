'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { 
  Search, 
  Cpu, 
  Settings2, 
  ShieldCheck, 
  RefreshCcw, 
  Plus, 
  Trash2, 
  Wifi, 
  WifiOff,
  DoorOpen,
  Fingerprint
} from 'lucide-react'

export function TerminalManager() {
  const [scanning, setScanning] = useState(false)
  const [discovered, setDiscovered] = useState<any[]>([])
  const [terminals, setTerminals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showConfig, setShowConfig] = useState<any>(null)

  const fetchTerminals = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/hardware/hikvision/config')
      const data = await res.json()
      setTerminals(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error('Error al cargar terminales')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTerminals()
  }, [])

  const handleScan = async () => {
    setScanning(true)
    setDiscovered([])
    try {
      const res = await fetch('/api/hardware/hikvision/scan')
      const data = await res.json()
      if (data.devices) {
        setDiscovered(data.devices)
        if (data.devices.length === 0) toast.info('No se encontraron dispositivos en la red')
        else toast.success(`Se encontraron ${data.devices.length} dispositivos`)
      }
    } catch (err) {
      toast.error('Error durante el escaneo')
    } finally {
      setScanning(false)
    }
  }

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const payload = Object.fromEntries(formData)

    try {
      const method = showConfig.id ? 'PUT' : 'POST'
      const res = await fetch('/api/hardware/hikvision/config', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(showConfig.id ? { ...payload, id: showConfig.id } : payload)
      })

      if (res.ok) {
        toast.success(showConfig.id ? 'Terminal actualizada' : 'Terminal conectada con éxito')
        setShowConfig(null)
        fetchTerminals()
      } else {
        const errData = await res.json()
        toast.error(errData.error || 'Error al guardar configuración')
      }
    } catch (err) {
      toast.error('Error de red')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta terminal?')) return
    try {
      const res = await fetch(`/api/hardware/hikvision/config?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al eliminar terminal')
      toast.success('Terminal eliminada')
      fetchTerminals()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight border-l-4 border-blue-600 pl-4">Centro de Control Hikvision</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest pl-5 mt-1">Gestión de terminales de acceso DS-KAS261</p>
        </div>
        <Button 
          onClick={handleScan} 
          disabled={scanning}
          className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20"
        >
          {scanning ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
          {scanning ? 'ESCANEANDO RED...' : 'ESCANEAR DISPOSITIVOS'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Terminals List */}
        <div className="lg:col-span-2 space-y-6">
          {terminals.length === 0 && !loading && (
            <Card className="border-dashed border-2 bg-slate-50/50 dark:bg-slate-900/50">
              <CardContent className="p-10 text-center">
                <div className="bg-slate-200 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <WifiOff className="text-slate-400 w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-500 uppercase">Sin terminales configuradas</h3>
                <p className="text-sm text-slate-400 mt-1">Escanea la red para identificar tu terminal DS-KAS261</p>
              </CardContent>
            </Card>
          )}

          {terminals.map((t) => (
            <Card key={t.id} className="border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden group">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="p-5 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/30">
                      <Cpu className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{t.name}</h4>
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <Wifi className="w-3 h-3" /> ONLINE
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">{t.model || 'Hikvision DS-KAS261'} · {t.ip}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="rounded-xl border-slate-200 dark:border-slate-800 font-bold uppercase text-[10px]" onClick={() => setShowConfig(t)}>
                      <Settings2 className="w-3 h-3 mr-2" /> AJUSTES
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 font-bold uppercase text-[10px]" onClick={() => handleDelete(t.id)}>
                      <Trash2 className="w-3 h-3 mr-2" /> ELIMINAR
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-50 dark:border-white/5">
                   <div className="space-y-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">S/N Terminal</p>
                     <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{t.serialNumber || 'N/A'}</p>
                   </div>
                   <div className="space-y-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario</p>
                     <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{t.username}</p>
                   </div>
                   <div className="space-y-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Último Acceso</p>
                     <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Hoy, 10:24 AM</p>
                   </div>
                   <div className="flex items-center justify-end gap-2">
                      <Button size="icon" variant="ghost" className="rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Abrir Puerta">
                        <DoorOpen className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="rounded-full bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white transition-all shadow-sm" title="Capturar Huella">
                        <Fingerprint className="w-4 h-4" />
                      </Button>
                   </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sidebar: Scan results or Config form */}
        <div className="space-y-6">
          {showConfig ? (
            <Card className="border-none shadow-2xl bg-[#1e293b] text-white rounded-[2rem] overflow-hidden sticky top-6">
              <CardHeader className="p-8">
                <CardTitle className="text-lg font-black uppercase italic tracking-tight flex items-center gap-2">
                  <ShieldCheck className="text-blue-500 w-5 h-5" /> Configurar Terminal
                </CardTitle>
                <CardDescription className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Credenciales de Acceso</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <form onSubmit={handleSaveConfig} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Nombre Descriptivo</Label>
                    <Input name="name" defaultValue={showConfig.name} placeholder="Ej. Puerta Principal" className="bg-slate-800 border-none rounded-xl text-white placeholder:text-slate-600" required />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Dirección IP</Label>
                      <Input name="ip" defaultValue={showConfig.ip} placeholder="192.168.1.64" className="bg-slate-800 border-none rounded-xl text-white placeholder:text-slate-600" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Puerto</Label>
                      <Input name="port" defaultValue={showConfig.port || 80} placeholder="80" className="bg-slate-800 border-none rounded-xl text-white placeholder:text-slate-600" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Usuario ISAPI</Label>
                    <Input name="username" defaultValue={showConfig.username || 'admin'} placeholder="admin" className="bg-slate-800 border-none rounded-xl text-white placeholder:text-slate-600" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Contraseña</Label>
                    <Input name="password" type="password" defaultValue={showConfig.password} placeholder="••••••••" className="bg-slate-800 border-none rounded-xl text-white placeholder:text-slate-600" required />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Número de Serie (S/N)</Label>
                    <Input name="serialNumber" defaultValue={showConfig.serialNumber} placeholder="DS-Kxxxxxxx" className="bg-slate-800 border-none rounded-xl text-white placeholder:text-slate-600" required />
                  </div>

                  <input type="hidden" name="model" defaultValue={showConfig.model} />

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold">GUARDAR</Button>
                    <Button type="button" variant="outline" onClick={() => setShowConfig(null)} className="rounded-xl bg-transparent border-slate-700 text-slate-400 hover:text-white">CANCELAR</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : discovered.length > 0 ? (
            <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden">
               <CardHeader className="p-8 border-b border-slate-50 dark:border-white/5">
                 <CardTitle className="text-lg font-black uppercase italic tracking-tight">Dispositivos Detectados</CardTitle>
                 <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resultados del escaneo SADP</CardDescription>
               </CardHeader>
               <CardContent className="p-6">
                 <div className="space-y-4">
                   {discovered.map((d, i) => (
                     <div key={i} className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 group hover:bg-blue-600 transition-all duration-300">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-black text-slate-900 dark:text-white group-hover:text-white uppercase">{d.model}</p>
                          <Button 
                            size="sm" 
                            className="h-7 px-3 rounded-full bg-blue-600 group-hover:bg-white group-hover:text-blue-600 text-[9px] font-black uppercase"
                            onClick={() => setShowConfig({ name: d.model, ip: d.ip, port: d.port, serialNumber: d.serial, model: d.model })}
                          >
                            VINCULAR
                          </Button>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 group-hover:text-blue-100 truncate">{d.ip} · {d.mac}</p>
                     </div>
                   ))}
                 </div>
               </CardContent>
            </Card>
          ) : (
            <Card className="border-none shadow-xl bg-blue-50/50 dark:bg-blue-900/20 rounded-[2rem] overflow-hidden p-8">
              <div className="mb-6"><ShieldCheck className="w-10 h-10 text-blue-600 opacity-50" /></div>
              <h4 className="text-lg font-black text-blue-900 dark:text-blue-100 uppercase italic">Seguridad ISAPI</h4>
              <p className="text-xs text-blue-800/60 dark:text-blue-200/60 font-bold uppercase tracking-widest mt-2 leading-relaxed">
                Asegúrate de que la terminal tenga habilitado el protocolo ISAPI en su configuración avanzada de red.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
