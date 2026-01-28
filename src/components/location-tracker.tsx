'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { io, Socket } from 'socket.io-client'
import { MapPin, Navigation, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'
import { toast } from 'sonner'

// Dynamic import for Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false })

interface Location {
  latitude: number
  longitude: number
  accuracy?: number
  timestamp: Date
}

interface ActiveLocation {
  userId: string
  latitude: number
  longitude: number
  timestamp: Date
  userName?: string
}

interface LocationTrackerProps {
  userId: string
  userName?: string
  vehicleId?: string
  enabled?: boolean
  showMap?: boolean
  onLocationUpdate?: (location: Location) => void
}

export default function LocationTracker({
  userId,
  userName,
  vehicleId,
  enabled = true,
  showMap = false,
  onLocationUpdate
}: LocationTrackerProps) {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const [activeLocations, setActiveLocations] = useState<ActiveLocation[]>([])
  const [trackingActive, setTrackingActive] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const watchIdRef = useRef<number | null>(null)

  // Leaflet icons need special handling in Next.js
  const customIcon = useMemo(() => {
    if (typeof window === 'undefined') return null
    const L = require('leaflet')
    return new L.Icon({
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    })
  }, [])

  useEffect(() => {
    setIsClient(true)
    if (!enabled) return

    // Connect to WebSocket - Using the local backend if available
    const socket = io('/?XTransformPort=3001', {
      transports: ['websocket', 'polling']
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Connected to location service')
      setTrackingActive(true)
      socket.emit('location:active')
    })

    socket.on('location:broadcast', (data) => {
      const location: ActiveLocation = {
        userId: data.userId,
        userName: data.userName,
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: new Date(data.timestamp)
      }

      setActiveLocations((prev) => {
        const existing = prev.findIndex((l) => l.userId === location.userId)
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = location
          return updated
        }
        return [...prev, location]
      })

      if (data.userId === userId) {
        setCurrentLocation({
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy,
          timestamp: new Date(data.timestamp)
        })

        if (onLocationUpdate) {
          onLocationUpdate({
            latitude: data.latitude,
            longitude: data.longitude,
            accuracy: data.accuracy,
            timestamp: new Date(data.timestamp)
          })
        }
      }
    })

    socket.on('location:active', (locations: ActiveLocation[]) => {
      setActiveLocations(locations.map((l) => ({
        ...l,
        timestamp: new Date(l.timestamp)
      })))
    })

    socket.on('disconnect', () => {
      setTrackingActive(false)
    })

    if (navigator.geolocation && 'watchPosition' in navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords
          socket.emit('location:update', {
            userId,
            userName,
            vehicleId,
            latitude,
            longitude,
            accuracy
          })

          setCurrentLocation({
            latitude,
            longitude,
            accuracy,
            timestamp: new Date()
          })
        },
        (error) => {
          console.error('Geolocation error:', error)
          let message = 'Error de ubicación'
          if (error.code === 1) {
            if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
              message = 'Error de seguridad: La ubicación requiere HTTPS o localhost.'
            } else {
              message = 'Permiso de ubicación denegado. Por favor, actívelo en su navegador.'
            }
          }
          else if (error.code === 2) message = 'Ubicación no disponible.'
          else if (error.code === 3) message = 'Tiempo de espera agotado.'
          toast.error(message)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    }

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
      socket.disconnect()
    }
  }, [userId, userName, vehicleId, enabled, onLocationUpdate])

  if (!isClient) return null

  return (
    <div className="space-y-4">
      {currentLocation && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-100 dark:border-blue-900">
          <Navigation className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div className="flex-1">
            <p className="text-sm font-medium">Ubicación actual</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
            </p>
          </div>
          {trackingActive && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-600 dark:text-green-400">Activo</span>
            </div>
          )}
        </div>
      )}

      {showMap && (
        <div className="aspect-video min-h-[400px] bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden relative border border-slate-200 dark:border-slate-800">
          {currentLocation ? (
            <MapContainer
              center={[currentLocation.latitude, currentLocation.longitude]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {customIcon && (
                <Marker position={[currentLocation.latitude, currentLocation.longitude]} icon={customIcon}>
                  <Popup>Mi ubicación</Popup>
                </Marker>
              )}
              {activeLocations.filter(l => l.userId !== userId).map((loc) => (
                customIcon && (
                  <Marker key={loc.userId} position={[loc.latitude, loc.longitude]} icon={customIcon}>
                    <Popup>{loc.userName || loc.userId}</Popup>
                  </Marker>
                )
              ))}
            </MapContainer>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-slate-400" />
                <p className="text-sm text-slate-500">Obteniendo coordenadas...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeLocations.length > 1 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Otros usuarios activos ({activeLocations.length - 1})
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {activeLocations.filter(l => l.userId !== userId).map((location) => (
              <div key={location.userId} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{location.userName || location.userId}</span>
                  <span className="text-xs text-slate-500">{new Date(location.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
