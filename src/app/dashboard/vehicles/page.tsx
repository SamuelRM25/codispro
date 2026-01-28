'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft,
  Plus,
  Truck,
  Calendar as CalendarIcon,
  Package,
  FileText,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function VehiclesPage() {
  const router = useRouter()
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isClient, setIsClient] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    plate: '',
    type: 'truck',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    status: 'available',
  })

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles')
      const data = await response.json()
      if (response.ok && Array.isArray(data)) {
        setVehicles(data)
      } else {
        setVehicles([])
        toast.error('Error al cargar vehículos')
      }
    } catch (error) {
      setVehicles([])
      toast.error('Error al cargar vehículos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient) {
      fetchVehicles()
    }
  }, [isClient])

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)
  const [sparePartDialogOpen, setSparePartDialogOpen] = useState(false)
  const [tripDialogOpen, setTripDialogOpen] = useState(false)
  const [sparePartData, setSparePartData] = useState({
    name: '',
    quantity: 1,
    unitPrice: 0,
    description: '',
  })
  const [tripData, setTripData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    origin: '',
    destination: '',
    purpose: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Error al crear vehículo')

      toast.success('Vehículo creado exitosamente')
      setDialogOpen(false)
      fetchVehicles()
      resetVehicleForm()
    } catch (error) {
      toast.error('Error al crear vehículo')
    }
  }

  const resetVehicleForm = () => {
    setFormData({
      name: '',
      plate: '',
      type: 'truck',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      status: 'available',
    })
  }

  const handleAddSparePart = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVehicleId) return

    try {
      const response = await fetch(`/api/vehicles/${selectedVehicleId}/spare-parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sparePartData),
      })

      if (!response.ok) throw new Error('Error al agregar repuesto')

      toast.success('Repuesto agregado')
      setSparePartDialogOpen(false)
      fetchVehicles()
    } catch (error) {
      toast.error('Error al agregar repuesto')
    }
  }

  const handleAddTrip = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVehicleId) return

    try {
      const response = await fetch(`/api/vehicles/${selectedVehicleId}/trips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...tripData,
          startDate: new Date(tripData.startDate).toISOString(),
          userId: 'default-user', // Should be dynamic
        }),
      })

      if (!response.ok) throw new Error('Error al registrar viaje')

      toast.success('Viaje registrado')
      setTripDialogOpen(false)
      fetchVehicles()
    } catch (error) {
      toast.error('Error al registrar viaje')
    }
  }

  const filteredVehicles = Array.isArray(vehicles) ? vehicles.filter(
    (v) =>
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.plate.toLowerCase().includes(searchTerm.toLowerCase())
  ) : []

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Vehículos</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Flota, repuestos y viajes
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <Tabs defaultValue="inventory" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="inventory">Flota</TabsTrigger>
            <TabsTrigger value="spare-parts">Repuestos</TabsTrigger>
            <TabsTrigger value="trips">Viajes</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-6">
            <div className="flex justify-between items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar vehículo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <Button onClick={() => setDialogOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nuevo Vehículo
                </Button>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nuevo Vehículo</DialogTitle>
                    <DialogDescription>
                      Registre una nueva unidad en la flota
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nombre/Descripción *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Camión Hino 1"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="plate">Placa *</Label>
                        <Input
                          id="plate"
                          value={formData.plate}
                          onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                          placeholder="P-123ABC"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="type">Tipo</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="truck">Camión</SelectItem>
                            <SelectItem value="machine">Maquinaria</SelectItem>
                            <SelectItem value="van">Panel/Van</SelectItem>
                            <SelectItem value="car">Pickup/Carro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="brand">Marca</Label>
                        <Input
                          id="brand"
                          value={formData.brand}
                          onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                          placeholder="Hino, Toyota, etc."
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">Guardar Vehículo</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Card
                className={`cursor-pointer transition-all ${!selectedVehicleId ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedVehicleId(null)}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Flota</CardTitle>
                  <Truck className="w-4 h-4 text-slate-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Array.isArray(vehicles) ? vehicles.length : 0}</div>
                  <p className="text-xs text-slate-500 mt-1">
                    {!selectedVehicleId ? 'Seleccionado: Todos' : 'Click para ver todos'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-green-600">Disponibles</CardTitle>
                  <Truck className="w-4 h-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {Array.isArray(vehicles) ? vehicles.filter((v) => v.status === 'available').length : 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-blue-600">En Viaje</CardTitle>
                  <Truck className="w-4 h-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {Array.isArray(vehicles) ? vehicles.filter((v) => v.status === 'in_use').length : 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center text-slate-500">Cargando...</div>
                ) : filteredVehicles.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">No hay vehículos</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vehículo</TableHead>
                          <TableHead>Placa</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Marca/Modelo</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredVehicles.map((vehicle) => (
                          <TableRow
                            key={vehicle.id}
                            className={`cursor-pointer transition-colors ${selectedVehicleId === vehicle.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
                            onClick={() => setSelectedVehicleId(vehicle.id)}
                          >
                            <TableCell>
                              <div className="font-medium">{vehicle.name}</div>
                            </TableCell>
                            <TableCell>{vehicle.plate}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{vehicle.type}</Badge>
                            </TableCell>
                            <TableCell>
                              {vehicle.brand} {vehicle.model} {vehicle.year}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  vehicle.status === 'available'
                                    ? 'bg-green-500 hover:bg-green-600'
                                    : vehicle.status === 'in_use'
                                      ? 'bg-blue-500 hover:bg-blue-600'
                                      : 'bg-orange-500 hover:bg-orange-600'
                                }
                              >
                                {vehicle.status === 'available'
                                  ? 'Disponible'
                                  : vehicle.status === 'in_use'
                                    ? 'En Uso'
                                    : 'Mantenimiento'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant={selectedVehicleId === vehicle.id ? "default" : "ghost"}
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedVehicleId(vehicle.id)
                                }}
                              >
                                {selectedVehicleId === vehicle.id ? 'Seleccionado' : 'Seleccionar'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="spare-parts">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-500" />
                  Repuestos y Facturas
                </CardTitle>
                <CardDescription>
                  Gestión de repuestos de la flota con control de facturas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 space-y-4">
                  <Package className="w-16 h-16 mx-auto text-slate-300" />
                  <p className="text-slate-500">
                    Selecciona un vehículo para ver sus repuestos
                  </p>
                  <Button
                    onClick={() => {
                      if (!selectedVehicleId) {
                        toast.error('Por favor, seleccione un vehículo de la lista primero')
                        return
                      }
                      setSparePartDialogOpen(true)
                    }}
                    className="gap-2"
                  // Removed disabled to handle click with toast message
                  >
                    <Plus className="w-4 h-4" />
                    Agregar Repuesto
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trips">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-purple-500" />
                  Calendario de Viajes
                </CardTitle>
                <CardDescription>
                  Historial de viajes de la flota
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 space-y-4">
                  <FileText className="w-16 h-16 mx-auto text-slate-300" />
                  <p className="text-slate-500">
                    Selecciona un vehículo para ver su historial de viajes
                  </p>
                  <Button
                    onClick={() => {
                      if (!selectedVehicleId) {
                        toast.error('Por favor, seleccione un vehículo de la lista primero')
                        return
                      }
                      setTripDialogOpen(true)
                    }}
                    className="gap-2"
                  // Removed disabled to handle click with toast message
                  >
                    <Plus className="w-4 h-4" />
                    Registrar Viaje
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Spare Parts Dialog */}
        <Dialog open={sparePartDialogOpen} onOpenChange={setSparePartDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Repuesto</DialogTitle>
              <DialogDescription>
                Registre un nuevo repuesto o mantenimiento para el vehículo seleccionado
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSparePart} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sp-name">Nombre/Concepto *</Label>
                <Input
                  id="sp-name"
                  value={sparePartData.name}
                  onChange={(e) => setSparePartData({ ...sparePartData, name: e.target.value })}
                  placeholder="Cambio de aceite, Filtro, etc."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sp-qty">Cantidad</Label>
                  <Input
                    id="sp-qty"
                    type="number"
                    value={sparePartData.quantity}
                    onChange={(e) => setSparePartData({ ...sparePartData, quantity: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sp-price">Precio Unitario</Label>
                  <Input
                    id="sp-price"
                    type="number"
                    step="0.01"
                    value={sparePartData.unitPrice}
                    onChange={(e) => setSparePartData({ ...sparePartData, unitPrice: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setSparePartDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Guardar Repuesto</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Trip Dialog */}
        <Dialog open={tripDialogOpen} onOpenChange={setTripDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Viaje</DialogTitle>
              <DialogDescription>
                Registre un nuevo viaje o salida de vehículo
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddTrip} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="trip-date">Fecha</Label>
                <Input
                  id="trip-date"
                  type="date"
                  value={tripData.startDate}
                  onChange={(e) => setTripData({ ...tripData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trip-origin">Origen</Label>
                  <Input
                    id="trip-origin"
                    value={tripData.origin}
                    onChange={(e) => setTripData({ ...tripData, origin: e.target.value })}
                    placeholder="Sede Central"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trip-dest">Destino</Label>
                  <Input
                    id="trip-dest"
                    value={tripData.destination}
                    onChange={(e) => setTripData({ ...tripData, destination: e.target.value })}
                    placeholder="Obra San Lucas"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="trip-purpose">Motivo</Label>
                <Input
                  id="trip-purpose"
                  value={tripData.purpose}
                  onChange={(e) => setTripData({ ...tripData, purpose: e.target.value })}
                  placeholder="Transporte de material"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setTripDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Registrar Viaje</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
