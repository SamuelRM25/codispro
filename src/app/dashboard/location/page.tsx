'use client'

import { useAuthStore } from '@/stores/auth-store'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, MapPin, Truck, Activity, Clock } from 'lucide-react'
import LocationTracker from '@/components/location-tracker'
import { useEffect, useState } from 'react'

export default function LocationPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [trackingEnabled, setTrackingEnabled] = useState(true)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient || !user) {
    return null
  }

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
          <div>
            <h1 className="text-2xl font-bold">Ubicación en Tiempo Real</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Rastreo GPS de camiones y vehículos
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Tracker */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Mi Ubicación
                </CardTitle>
                <CardDescription>
                  Tu ubicación se rastrea en tiempo real cuando estás activo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LocationTracker
                  userId={user.id}
                  enabled={trackingEnabled}
                  showMap={true}
                  onLocationUpdate={(location) => {
                    console.log('Location updated:', location)
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="w-5 h-5" />
                  Estado del Rastreo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium">Rastreo Activo</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setTrackingEnabled(!trackingEnabled)}
                  >
                    {trackingEnabled ? 'Pausar' : 'Activar'}
                  </Button>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Truck className="w-4 h-4" />
                    <span>Vehículo: Asignado en ruta</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span>Última actualización: hace 1 minuto</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="w-5 h-5" />
                  Información
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <p>• El rastreo funciona en segundo plano</p>
                <p>• Tu ubicación se actualiza automáticamente</p>
                <p>• Los administradores pueden ver tu ubicación</p>
                <p>• Los datos se mantienen por 7 días</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
