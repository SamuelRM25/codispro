'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Camera, Package, CheckCircle, Clock, Search, User, Wrench, RotateCcw, LogOut } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Tool {
  id: string
  name: string
  barcode?: string
  category?: string
  status: string
  photo?: string
}

interface ActiveLoan {
  id: string
  loanDate: string
  photo?: string
  tool: { name: string; category?: string }
  worker?: { firstName: string; lastName: string }
}

type Step = 'idle' | 'camera' | 'identify' | 'worker' | 'confirm'

export default function BodegaDashboard() {
  const router = useRouter()
  const { data: session } = useSession()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const user = session?.user

  const [step, setStep] = useState<Step>('idle')
  const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([])
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [tools, setTools] = useState<Tool[]>([])
  const [workers, setWorkers] = useState<any[]>([])
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [selectedWorker, setSelectedWorker] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  const fetchActiveLoans = useCallback(async () => {
    try {
      const res = await fetch('/api/tool-loans')
      const data = await res.json()
      setActiveLoans(data.filter((l: any) => !l.returnDate))
    } catch { toast.error('Error al cargar prestamos') }
  }, [])

  const fetchTools = useCallback(async () => {
    try {
      const res = await fetch('/api/tools')
      const data = await res.json()
      setTools(Array.isArray(data) ? data : data.tools || [])
    } catch { }
  }, [])

  const fetchWorkers = useCallback(async () => {
    try {
      const res = await fetch('/api/workers')
      const data = await res.json()
      setWorkers(Array.isArray(data) ? data : data.workers || [])
    } catch { }
  }, [])

  useEffect(() => {
    fetchActiveLoans()
    fetchTools()
    fetchWorkers()
  }, [fetchActiveLoans, fetchTools, fetchWorkers])

  const startCamera = async () => {
    setStep('camera')
    setCapturedPhoto(null)
    setSelectedTool(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch (err) {
      toast.error('No se pudo acceder a la camara. Verifica los permisos.')
      setStep('idle')
    }
  }

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [])

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)

    const blob = await (await fetch(dataUrl)).blob()
    const formData = new FormData()
    formData.append('file', blob, 'loan-photo.jpg')
    const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
    const { url } = await uploadRes.json()
    setCapturedPhoto(url)
    stopCamera()
    setStep('identify')
    setSearchTerm('')
  }

  const filteredTools = tools.filter(t =>
    t.status === 'AVAILABLE' &&
    (t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleSubmitLoan = async () => {
    if (!selectedTool || !user) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/tool-loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: selectedTool.id,
          userId: user.id,
          workerId: selectedWorker || undefined,
          photo: capturedPhoto || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Error al registrar')
        return
      }
      toast.success(`Herramienta "${selectedTool.name}" registrada como prestada`)
      setStep('idle')
      setCapturedPhoto(null)
      setSelectedTool(null)
      setSelectedWorker('')
      fetchActiveLoans()
      fetchTools()
    } catch {
      toast.error('Error de red')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReturn = async (loanId: string, toolId: string) => {
    try {
      await fetch(`/api/tool-loans/${loanId}/return`, { method: 'PATCH' })
      toast.success('Herramienta devuelta')
      fetchActiveLoans()
      fetchTools()
    } catch {
      toast.error('Error al registrar devolucion')
    }
  }

  const cancel = () => {
    stopCamera()
    setStep('idle')
    setCapturedPhoto(null)
    setSelectedTool(null)
    setSelectedWorker('')
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans">
      {/* Header */}
      <div className="bg-[#1e293b] border-b border-slate-700 px-6 py-4 flex items-center gap-4">
        <div className="p-2 bg-amber-500 rounded-xl">
          <Package className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight">Dashboard Bodega</h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Control de herramientas &middot; {user?.name || 'Usuario'}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 font-bold uppercase">
            {activeLoans.length} En Prestamo
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-slate-400 hover:text-white hover:bg-red-500/20 rounded-xl"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto space-y-6">

        {/* MODAL FLOW */}
        {step !== 'idle' && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-[#1e293b] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">

              {/* STEP: CAMERA */}
              {step === 'camera' && (
                <div className="p-6 space-y-4">
                  <h2 className="text-lg font-black uppercase">Capturar Foto de Herramienta</h2>
                  <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
                    <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute inset-0 border-4 border-amber-400/40 rounded-2xl pointer-events-none" />
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={capturePhoto} className="flex-1 bg-amber-500 hover:bg-amber-600 font-black rounded-xl">
                      <Camera className="w-4 h-4 mr-2" /> TOMAR FOTO
                    </Button>
                    <Button variant="outline" onClick={cancel} className="rounded-xl border-slate-600 text-slate-300">CANCELAR</Button>
                  </div>
                </div>
              )}

              {/* STEP: IDENTIFY */}
              {step === 'identify' && (
                <div className="p-6 space-y-4">
                  <h2 className="text-lg font-black uppercase">Identificar Herramienta</h2>
                  {capturedPhoto && (
                    <img src={capturedPhoto} alt="Capturada" className="w-full h-40 object-cover rounded-2xl" />
                  )}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Buscar por nombre, codigo de barras..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-800 border-none text-white rounded-xl"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {filteredTools.length === 0 && (
                      <p className="text-center text-slate-500 py-4 text-sm">
                        {searchTerm ? 'No se encontraron herramientas disponibles con ese nombre' : 'Escribe para buscar...'}
                      </p>
                    )}
                    {filteredTools.map(tool => (
                      <button
                        key={tool.id}
                        onClick={() => { setSelectedTool(tool); setStep('worker') }}
                        className="w-full text-left p-4 rounded-2xl bg-slate-800 hover:bg-amber-500/20 border border-transparent hover:border-amber-500/40 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <Wrench className="w-5 h-5 text-amber-400 flex-shrink-0" />
                          <div>
                            <p className="font-bold text-white">{tool.name}</p>
                            <p className="text-xs text-slate-400">{tool.category || 'Sin categoria'} {tool.barcode ? ` - ${tool.barcode}` : ''}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <Button variant="outline" onClick={cancel} className="w-full rounded-xl border-slate-600 text-slate-300">CANCELAR</Button>
                </div>
              )}

              {/* STEP: WORKER */}
              {step === 'worker' && (
                <div className="p-6 space-y-4">
                  <h2 className="text-lg font-black uppercase">Seleccionar Trabajador</h2>
                  {selectedTool && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3">
                      <Wrench className="w-5 h-5 text-amber-400" />
                      <div>
                        <p className="font-bold text-amber-300">{selectedTool.name}</p>
                        <p className="text-xs text-amber-400/70">{selectedTool.category}</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2 block">Trabajador que llevara la herramienta</Label>
                    <select
                      value={selectedWorker}
                      onChange={e => setSelectedWorker(e.target.value)}
                      className="w-full p-3 bg-slate-800 text-white rounded-xl border-none outline-none"
                    >
                      <option value="">Sin asignar (uso general)</option>
                      {workers.filter(w => w.isActive).map(w => (
                        <option key={w.id} value={w.id}>{w.firstName} {w.lastName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={() => setStep('confirm')} className="flex-1 bg-amber-500 hover:bg-amber-600 font-black rounded-xl">
                      <User className="w-4 h-4 mr-2" /> CONTINUAR
                    </Button>
                    <Button variant="outline" onClick={cancel} className="rounded-xl border-slate-600 text-slate-300">CANCELAR</Button>
                  </div>
                </div>
              )}

              {/* STEP: CONFIRM */}
              {step === 'confirm' && selectedTool && (
                <div className="p-6 space-y-4">
                  <h2 className="text-lg font-black uppercase">Confirmar Prestamo</h2>
                  {capturedPhoto && (
                    <img src={capturedPhoto} alt="Referencia" className="w-full h-40 object-cover rounded-2xl" />
                  )}
                  <div className="p-4 bg-slate-700/50 rounded-2xl space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-sm">Herramienta</span>
                      <span className="font-bold text-white">{selectedTool.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-sm">Trabajador</span>
                      <span className="font-bold text-white">
                        {selectedWorker
                          ? workers.find(w => w.id === selectedWorker)?.firstName + ' ' + workers.find(w => w.id === selectedWorker)?.lastName
                          : 'Sin asignar'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-sm">Bodeguero</span>
                      <span className="font-bold text-white">{user?.name || 'Usuario'}</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleSubmitLoan} disabled={submitting} className="flex-1 bg-emerald-500 hover:bg-emerald-600 font-black rounded-xl">
                      {submitting ? 'REGISTRANDO...' : 'CONFIRMAR PRESTAMO'}
                    </Button>
                    <Button variant="outline" onClick={cancel} className="rounded-xl border-slate-600 text-slate-300">CANCELAR</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Action */}
        <button
          onClick={startCamera}
          className="w-full p-8 rounded-3xl bg-amber-500 hover:bg-amber-400 transition-all shadow-2xl shadow-amber-500/30 flex flex-col items-center gap-3 group"
        >
          <Camera className="w-12 h-12 text-white group-hover:scale-110 transition-transform" />
          <span className="text-2xl font-black uppercase text-white">Sacar Herramienta</span>
          <span className="text-amber-100/80 text-sm font-bold uppercase tracking-widest">Tocar para activar camara</span>
        </button>

        {/* Active Loans List */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-black uppercase tracking-tight text-slate-300">Herramientas en Prestamo</h2>
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 ml-auto">{activeLoans.length}</Badge>
          </div>

          {activeLoans.length === 0 ? (
            <Card className="border-none bg-[#1e293b]">
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <p className="text-slate-400 font-bold">Todas las herramientas estan en bodega</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeLoans.map(loan => (
                <Card key={loan.id} className="border-none bg-[#1e293b] overflow-hidden">
                  <CardContent className="p-5 flex items-center gap-4">
                    {loan.photo ? (
                      <img src={loan.photo} alt="Foto" className="w-16 h-16 rounded-2xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <Wrench className="w-7 h-7 text-slate-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-white truncate">{loan.tool.name}</p>
                      <p className="text-sm text-slate-400">
                        {loan.worker ? `${loan.worker.firstName} ${loan.worker.lastName}` : 'Sin asignar'}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {format(new Date(loan.loanDate), "dd MMM, HH:mm", { locale: es })}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl border-emerald-700 text-emerald-400 hover:bg-emerald-500 hover:text-white flex-shrink-0"
                      onClick={() => handleReturn(loan.id, '')}
                    >
                      <RotateCcw className="w-3 h-3 mr-1" /> Devolver
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}