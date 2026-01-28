'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns'
import { es } from 'date-fns/locale'

interface CalendarEvent {
  id: string
  title: string
  type: string
  date: string
  endDate?: string
  description: string
  color: string
}

export default function CalendarPage() {
  const router = useRouter()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const [selectedType, setSelectedType] = useState<string>('all')

  const fetchEvents = async (date: Date) => {
    setLoading(true)
    try {
      const month = date.toISOString().slice(0, 7)
      const response = await fetch(`/api/calendar?month=${month}`)
      const data = await response.json()
      setEvents(data.events || [])
    } catch (error) {
      toast.error('Error al cargar eventos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient) {
      fetchEvents(currentDate)
    }
  }, [isClient, currentDate])

  const filteredEvents = events.filter(e =>
    selectedType === 'all' || e.type === selectedType
  )

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  })

  const previousMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() - 1)
    setCurrentDate(newDate)
  }

  const nextMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + 1)
    setCurrentDate(newDate)
  }

  const getEventsForDay = (date: Date) => {
    return filteredEvents.filter(e =>
      isSameDay(new Date(e.date), date) ||
      (e.endDate && isSameDay(new Date(e.endDate), date))
    )
  }

  const monthName = format(currentDate, 'MMMM yyyy', { locale: es })
  const typeColors: Record<string, string> = {
    'tool-loan': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
    'vehicle-trip': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    'shipment': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    'petty-cash': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
    'project': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100',
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Calendario Integrado</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Todas las actividades de la constructora
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-medium px-2">{monthName}</span>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Calendario de Actividades</CardTitle>
              <div className="flex gap-2">
                {['all', 'tool-loan', 'vehicle-trip', 'shipment', 'petty-cash', 'project'].map(type => (
                  <Button
                    key={type}
                    variant={selectedType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedType(type)}
                  >
                    {type === 'all' && 'Todas'}
                    {type === 'tool-loan' && 'Herramientas'}
                    {type === 'vehicle-trip' && 'Viajes'}
                    {type === 'shipment' && 'Envíos'}
                    {type === 'petty-cash' && 'Caja'}
                    {type === 'project' && 'Proyectos'}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="p-8 text-center text-slate-500">Cargando...</div>
              ) : (
                <div className="grid grid-cols-7 gap-2">
                  {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                    <div key={day} className="text-center text-sm font-medium p-2 bg-slate-100 dark:bg-slate-800">
                      {day}
                    </div>
                  ))}
                  {daysInMonth.map(day => {
                    const dayEvents = getEventsForDay(day)
                    const isCurrentMonth = isSameMonth(day, currentDate)
                    return (
                      <div
                        key={day.toISOString()}
                        className={`min-h-24 p-2 border border-slate-200 dark:border-slate-800 rounded ${!isCurrentMonth ? 'opacity-50' : ''
                          }`}
                      >
                        <div className="text-sm font-medium mb-1">
                          {format(day, 'd')}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map(event => (
                            <div
                              key={event.id}
                              className={`text-xs p-1 rounded truncate ${typeColors[event.type] || 'bg-slate-100'}`}
                              title={event.description}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-slate-500">
                              +{dayEvents.length - 3} más
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Leyenda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-500 rounded" />
                  <span className="text-sm">Préstamos de Herramientas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded" />
                  <span className="text-sm">Viajes de Vehículos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded" />
                  <span className="text-sm">Envíos de Materiales</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-500 rounded" />
                  <span className="text-sm">Movimientos de Caja Chica</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-pink-500 rounded" />
                  <span className="text-sm">Proyectos</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estadísticas del Mes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Préstamos</span>
                  <Badge>{events.filter(e => e.type === 'tool-loan').length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Viajes</span>
                  <Badge>{events.filter(e => e.type === 'vehicle-trip').length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Envíos</span>
                  <Badge>{events.filter(e => e.type === 'shipment').length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Movimientos Caja</span>
                  <Badge>{events.filter(e => e.type === 'petty-cash').length}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
