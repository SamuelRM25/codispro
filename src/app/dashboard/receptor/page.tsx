'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Camera, Package, CheckCircle, AlertTriangle, Truck, Clock, LogOut } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const STATUS_STEPS = ['PENDING', 'VERIFIED', 'IN_TRANSIT', 'RECEIVED']
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Generado',
  VERIFIED: 'Verificado',
  IN_TRANSIT: 'En Ruta',
  RECEIVED: 'Entregado',
  DISCREPANCY: 'Discrepancia',
}

export default function ReceptorDashboard() {
  const router = useRouter()
  const { data: session } = useSession()
  const user = session?.user
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [shipments, setShipments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [receiving, setReceiving] = useState<any | null>(null) // shipment being received
  const [showCamera, setShowCamera] = useState(false)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [receivedItems, setReceivedItems] = useState<Record<string, { qty: string; notes: string }>>({})
  const [submitting, setSubmitting] = useState(false)

  const fetchShipments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/shipments')
      const data = await res.json()
      setShipments(data.filter((s: any) => s.status !== 'DISCREPANCY' || s.status !== 'RECEIVED'))
    } catch { toast.error('Error al cargar envíos') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchShipments() }, [fetchShipments])

  const openCamera = async () => {
    setShowCamera(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }
    } catch {
      toast.error('No se pudo acceder a la cámara')
      setShowCamera(false)
    }
  }

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return
    const canvas = canvasRef.current
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0)
    const blob = await (await fetch(canvas.toDataURL('image/jpeg', 0.85))).blob()
    const form = new FormData()
    form.append('file', blob, 'reception.jpg')
    const { url } = await (await fetch('/api/upload', { method: 'POST', body: form })).json()
    setCapturedPhoto(url)
    stopCamera()
    setShowCamera(false)
  }

  const startReceiving = (shipment: any) => {
    setReceiving(shipment)
    setCapturedPhoto(null)
    const initial: Record<string, { qty: string; notes: string }> = {}
    shipment.items.forEach((item: any) => {
      initial[item.id] = { qty: String(item.sentQuantity), notes: '' }
    })
    setReceivedItems(initial)
  }

  const handleConfirmReceive = async () => {
    if (!capturedPhoto) { toast.error('Debes tomar una foto de lo recibido'); return }
    if (!receiving) return
    setSubmitting(true)
    try {
      const items = receiving.items.map((item: any) => ({
        id: item.id,
        receivedQuantity: parseFloat(receivedItems[item.id]?.qty || '0'),
        receivedNotes: receivedItems[item.id]?.notes || null,
      }))
      const res = await fetch(`/api/shipments/${receiving.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'receive', photo: capturedPhoto, items }),
      })
      const updated = await res.json()
      if (updated.status === 'DISCREPANCY') {
        toast.error('⚠️ Recepción con discrepancia en cantidades. El admin será notificado.')
      } else {
        toast.success('✅ Recepción confirmada exitosamente')
      }
      setReceiving(null)
      fetchShipments()
    } catch { toast.error('Error al confirmar recepción') }
    finally { setSubmitting(false) }
  }

  const allShipments = Array.isArray(shipments) ? shipments : []

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans">
      {/* Header */}
      <div className="bg-[#1e293b] border-b border-slate-700 px-6 py-4 flex items-center gap-4">
        <div className="p-2 bg-emerald-600 rounded-xl">
          <Package className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black uppercase">Dashboard Receptor</h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{user?.name}</p>
        </div>
        <div className="ml-auto">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => { signOut(); router.push('/') }}
            className="text-slate-400 hover:text-white hover:bg-red-500/20 rounded-xl"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Camera */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="relative flex-1">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />
            <canvas ref={canvasRef} className="hidden" />
            <p className="absolute top-4 left-1/2 -translate-x-1/2 text-white font-black uppercase text-sm bg-black/60 px-4 py-2 rounded-full">
              📷 Fotografía lo que recibiste
            </p>
          </div>
          <div className="p-6 flex gap-3 bg-[#0f172a]">
            <Button onClick={capturePhoto} className="flex-1 bg-emerald-500 font-black rounded-xl py-4">
              <Camera className="w-5 h-5 mr-2" /> TOMAR FOTO
            </Button>
            <Button variant="outline" onClick={() => { stopCamera(); setShowCamera(false) }} className="rounded-xl border-slate-600 text-slate-300 px-6">
              CANCELAR
            </Button>
          </div>
        </div>
      )}

      {/* Receive Modal */}
      {receiving && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-[#1e293b] rounded-3xl w-full max-w-lg my-8 shadow-2xl overflow-hidden">
            <div className="p-6 space-y-5">
              <h2 className="text-xl font-black uppercase">📦 Registrar Recepción</h2>
              <p className="text-slate-400 text-sm">{receiving.vehicle?.name} · {receiving.vehicle?.plate}</p>

              {/* Items with quantities */}
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Cantidades Recibidas</Label>
                {receiving.items.map((item: any) => {
                  const received = parseFloat(receivedItems[item.id]?.qty || '0')
                  const mismatch = received !== item.sentQuantity
                  return (
                    <div key={item.id} className={`p-4 rounded-2xl border ${mismatch ? 'border-red-500/40 bg-red-500/10' : 'border-slate-700 bg-slate-800/50'}`}>
                      <div className="flex items-center gap-2 mb-3">
                        {mismatch ? <AlertTriangle className="w-4 h-4 text-red-400" /> : <CheckCircle className="w-4 h-4 text-emerald-400" />}
                        <span className="font-bold text-white">{item.materialName}</span>
                        <span className="ml-auto text-xs text-slate-400">Enviado: {item.sentQuantity} {item.unit}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-[10px] text-slate-500 uppercase font-bold">Recibido ({item.unit})</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={receivedItems[item.id]?.qty || ''}
                            onChange={e => setReceivedItems(prev => ({ ...prev, [item.id]: { ...prev[item.id], qty: e.target.value } }))}
                            className={`bg-slate-700 border-none text-white rounded-xl mt-1 ${mismatch ? 'ring-2 ring-red-500' : ''}`}
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-slate-500 uppercase font-bold">Notas</Label>
                          <Input
                            value={receivedItems[item.id]?.notes || ''}
                            onChange={e => setReceivedItems(prev => ({ ...prev, [item.id]: { ...prev[item.id], notes: e.target.value } }))}
                            placeholder="Opcional"
                            className="bg-slate-700 border-none text-white rounded-xl mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Photo */}
              <div>
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-2">Foto Obligatoria de Recepción</Label>
                {capturedPhoto ? (
                  <div className="relative">
                    <img src={capturedPhoto} alt="Recepción" className="w-full h-40 object-cover rounded-2xl" />
                    <Button variant="outline" size="sm" className="absolute top-2 right-2 rounded-xl bg-black/50 border-slate-600 text-white" onClick={() => setCapturedPhoto(null)}>
                      Retomar
                    </Button>
                  </div>
                ) : (
                  <Button onClick={openCamera} className="w-full bg-slate-700 hover:bg-slate-600 rounded-xl font-bold">
                    <Camera className="w-4 h-4 mr-2" /> 📸 FOTOGRAFIAR LO RECIBIDO
                  </Button>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleConfirmReceive}
                  disabled={!capturedPhoto || submitting}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 font-black rounded-xl py-4 text-base"
                >
                  {submitting ? 'CONFIRMANDO...' : '✅ CONFIRMAR RECEPCIÓN'}
                </Button>
                <Button variant="outline" onClick={() => setReceiving(null)} className="rounded-xl border-slate-600 text-slate-300 px-6">
                  CANCELAR
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 max-w-2xl mx-auto space-y-4">
        {loading ? (
          <div className="text-center py-16 text-slate-500">Cargando envíos...</div>
        ) : allShipments.length === 0 ? (
          <div className="text-center py-20">
            <Clock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-black text-white uppercase">Sin envíos pendientes</h2>
            <p className="text-slate-500 mt-2">No hay envíos en camino actualmente</p>
          </div>
        ) : (
          allShipments.map(shipment => {
            const currentStep = STATUS_STEPS.indexOf(shipment.status)
            return (
              <div key={shipment.id} className="bg-[#1e293b] rounded-3xl overflow-hidden shadow-xl">
                <div className={`h-2 ${shipment.status === 'RECEIVED' ? 'bg-emerald-500' : shipment.status === 'IN_TRANSIT' ? 'bg-amber-500' : shipment.status === 'DISCREPANCY' ? 'bg-red-500' : 'bg-slate-600'}`} />
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-slate-400" />
                        <span className="font-black text-white">{shipment.vehicle?.name} · {shipment.vehicle?.plate}</span>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">{shipment.project?.name || 'Sin proyecto'}</p>
                      <p className="text-xs text-slate-600">{format(new Date(shipment.shipmentDate), "dd MMM yyyy, HH:mm", { locale: es })}</p>
                    </div>
                    <Badge className={`font-bold uppercase text-xs ${shipment.status === 'RECEIVED' ? 'bg-emerald-500' : shipment.status === 'IN_TRANSIT' ? 'bg-amber-500' : shipment.status === 'DISCREPANCY' ? 'bg-red-500 text-white' : 'bg-slate-600'} text-white`}>
                      {STATUS_LABELS[shipment.status]}
                    </Badge>
                  </div>

                  {/* Progress bar */}
                  <div className="flex items-center gap-1">
                    {STATUS_STEPS.map((s, i) => (
                      <div key={s} className="flex-1 flex items-center gap-1">
                        <div className={`h-1.5 flex-1 rounded-full transition-all ${i <= currentStep ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                        {i < STATUS_STEPS.length - 1 && <div className={`w-2 h-2 rounded-full flex-shrink-0 ${i < currentStep ? 'bg-emerald-500' : 'bg-slate-700'}`} />}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                    {STATUS_STEPS.map(s => <span key={s}>{STATUS_LABELS[s]}</span>)}
                  </div>

                  {/* Items */}
                  <div className="space-y-1">
                    {shipment.items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-slate-300">{item.materialName}</span>
                        <span className="text-amber-400 font-bold">{item.sentQuantity} {item.unit}</span>
                      </div>
                    ))}
                  </div>

                  {shipment.departurePhoto && (
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Foto de Salida</p>
                      <img src={shipment.departurePhoto} alt="Salida" className="w-full h-32 object-cover rounded-xl" />
                    </div>
                  )}

                  {/* Action */}
                  {shipment.status === 'IN_TRANSIT' && (
                    <Button
                      onClick={() => startReceiving(shipment)}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 font-black rounded-xl py-4 text-base shadow-lg shadow-emerald-500/30"
                    >
                      📦 RECIBIR ENVÍO
                    </Button>
                  )}

                  {shipment.status === 'RECEIVED' && shipment.arrivalPhoto && (
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Foto de Recepción</p>
                      <img src={shipment.arrivalPhoto} alt="Recepción" className="w-full h-32 object-cover rounded-xl" />
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}