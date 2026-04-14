'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Camera, Truck, MapPin, Package, CheckCircle, Clock, Navigation, LogOut } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

type ShipmentStatus = 'pending' | 'verified' | 'in_transit' | 'received' | 'discrepancy'

const STATUS_LABELS: Record<ShipmentStatus, string> = {
  pending: 'Pendiente',
  verified: 'Verificado',
  in_transit: 'En Ruta',
  received: 'Entregado',
  discrepancy: 'Discrepancia',
}

const STATUS_COLORS: Record<ShipmentStatus, string> = {
  pending: 'bg-slate-500',
  verified: 'bg-blue-500',
  in_transit: 'bg-amber-500',
  received: 'bg-emerald-500',
  discrepancy: 'bg-red-500',
}

export default function VehiculoDashboard() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const watchIdRef = useRef<number | null>(null)

  const [shipments, setShipments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCamera, setShowCamera] = useState(false)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [activeShipment, setActiveShipment] = useState<any | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [inTransit, setInTransit] = useState(false)

  const fetchShipments = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetch('/api/shipments')
      const data = await res.json()
      const mine = data.filter(
        (s: any) => s.status !== 'received' && s.status !== 'discrepancy'
      )
      setShipments(mine)
      const transit = mine.find((s: any) => s.status === 'in_transit')
      if (transit) { setActiveShipment(transit); setInTransit(true) }
    } catch { toast.error('Error al cargar envíos') }
    finally { setLoading(false) }
  }, [user])

  useEffect(() => { fetchShipments() }, [fetchShipments])

  // GPS tracking
  const startGPS = useCallback((shipmentId: string) => {
    if (!navigator.geolocation) return
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        try {
          await fetch('/api/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user?.id,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              shipmentId,
            }),
          })
        } catch { }
      },
      (err) => console.warn('GPS error:', err),
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 }
    )
  }, [user])

  const stopGPS = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [])

  useEffect(() => () => stopGPS(), [stopGPS])

  const openCamera = async () => {
    setShowCamera(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }
      })
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
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    const blob = await (await fetch(dataUrl)).blob()
    const formData = new FormData()
    formData.append('file', blob, 'departure.jpg')
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const { url } = await res.json()
    setCapturedPhoto(url)
    stopCamera()
    setShowCamera(false)
  }

  const handleStartTransit = async (shipment: any) => {
    if (!capturedPhoto) { toast.error('Debes tomar una foto de la carga primero'); return }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/shipments/${shipment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start_transit', photo: capturedPhoto }),
      })
      if (!res.ok) throw new Error()
      setActiveShipment(shipment)
      setInTransit(true)
      startGPS(shipment.id)
      toast.success('¡Ruta iniciada! El admin puede seguir tu ubicación.')
      fetchShipments()
    } catch { toast.error('Error al iniciar ruta') }
    finally { setSubmitting(false) }
  }

  // ────────────────────────────────────────────
  // EN RUTA — pantalla bloqueada
  // ────────────────────────────────────────────
  if (inTransit && activeShipment) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-white">
        <div className="relative mb-8">
          <div className="w-40 h-40 rounded-full bg-amber-500/10 border-4 border-amber-500/30 flex items-center justify-center animate-pulse">
            <Truck className="w-20 h-20 text-amber-400" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40 animate-bounce">
            <Navigation className="w-6 h-6 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tight text-white mb-2">En Ruta...</h1>
        <p className="text-slate-400 text-lg font-bold">
          {activeShipment.vehicle?.name} · {activeShipment.vehicle?.plate}
        </p>
        <p className="text-slate-600 text-sm mt-1">
          {activeShipment.project?.name || 'Sin proyecto'}
        </p>
        <div className="mt-8 p-6 bg-[#1e293b] rounded-3xl text-center max-w-xs w-full">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Enviando</p>
          {activeShipment.items?.map((item: any) => (
            <p key={item.id} className="text-white font-bold mt-1">
              {item.sentQuantity} {item.unit} de {item.materialName}
            </p>
          ))}
        </div>
        <p className="mt-6 text-xs text-slate-600">Tu ubicación GPS se está transmitiendo al admin</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans">
      {/* Header */}
      <div className="bg-[#1e293b] border-b border-slate-700 px-6 py-4 flex items-center gap-4">
        <div className="p-2 bg-blue-600 rounded-xl">
          <Truck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black uppercase">Dashboard Vehículo</h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{user?.name}</p>
        </div>
        <div className="ml-auto">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => { logout(); router.push('/') }}
            className="text-slate-400 hover:text-white hover:bg-red-500/20 rounded-xl"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Camera modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="relative flex-1">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 border-4 border-amber-400/40 pointer-events-none" />
            <p className="absolute top-4 left-1/2 -translate-x-1/2 text-white font-black uppercase text-sm bg-black/60 px-4 py-2 rounded-full">
              📸 Fotografía la carga que llevas
            </p>
          </div>
          <div className="p-6 flex gap-3 bg-[#0f172a]">
            <Button onClick={capturePhoto} className="flex-1 bg-amber-500 hover:bg-amber-600 font-black rounded-xl py-4">
              <Camera className="w-5 h-5 mr-2" /> TOMAR FOTO
            </Button>
            <Button variant="outline" onClick={() => { stopCamera(); setShowCamera(false) }} className="rounded-xl border-slate-600 text-slate-300 px-6">
              CANCELAR
            </Button>
          </div>
        </div>
      )}

      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {loading ? (
          <div className="text-center py-16 text-slate-500">Cargando envíos...</div>
        ) : shipments.length === 0 ? (
          <div className="text-center py-20">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-black text-white uppercase">Sin envíos pendientes</h2>
            <p className="text-slate-500 mt-2">El admin aún no ha generado un envío para ti</p>
          </div>
        ) : (
          shipments.map(shipment => (
            <div key={shipment.id} className="bg-[#1e293b] rounded-3xl overflow-hidden shadow-xl">
              {/* Status bar */}
              <div className={`h-2 ${STATUS_COLORS[shipment.status as ShipmentStatus] || 'bg-slate-600'}`} />
              <div className="p-6 space-y-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-black text-white uppercase">
                      {shipment.vehicle?.name} · {shipment.vehicle?.plate}
                    </h3>
                    <p className="text-sm text-slate-400">{shipment.project?.name || 'Sin proyecto'}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      {format(new Date(shipment.shipmentDate), "dd MMM yyyy, HH:mm", { locale: es })}
                    </p>
                  </div>
                  <Badge className={`${STATUS_COLORS[shipment.status as ShipmentStatus]} text-white font-bold uppercase text-xs`}>
                    {STATUS_LABELS[shipment.status as ShipmentStatus]}
                  </Badge>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {shipment.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-slate-800/50 rounded-xl">
                      <span className="text-white font-bold">{item.materialName}</span>
                      <span className="text-amber-400 font-black">{item.sentQuantity} {item.unit}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                {shipment.status === 'verified' && (
                  <div className="space-y-3 pt-2">
                    {capturedPhoto ? (
                      <div className="relative">
                        <img src={capturedPhoto} alt="Foto de carga" className="w-full h-40 object-cover rounded-2xl" />
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2 rounded-xl border-slate-600 bg-black/50 text-white"
                          onClick={() => setCapturedPhoto(null)}
                        >
                          Retomar
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={openCamera} className="w-full bg-slate-700 hover:bg-slate-600 rounded-xl font-bold">
                        <Camera className="w-4 h-4 mr-2" /> 📸 FOTO OBLIGATORIA DE LA CARGA
                      </Button>
                    )}
                    <Button
                      onClick={() => handleStartTransit(shipment)}
                      disabled={!capturedPhoto || submitting}
                      className="w-full bg-amber-500 hover:bg-amber-400 font-black rounded-xl py-4 text-lg shadow-lg shadow-amber-500/30"
                    >
                      <MapPin className="w-5 h-5 mr-2" />
                      {submitting ? 'INICIANDO...' : 'INICIAR RUTA'}
                    </Button>
                  </div>
                )}

                {shipment.status === 'pending' && (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-center">
                    <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <p className="text-blue-400 font-bold text-sm">Esperando verificación del admin...</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
