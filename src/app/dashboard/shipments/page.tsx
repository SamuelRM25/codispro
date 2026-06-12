'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
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
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft,
  Plus,
  Package,
  Truck,
  Check,
  XCircle,
  Search,
  AlertTriangle,
  Printer,
  Zap,
  CalendarClock,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useSession } from 'next-auth/react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface ShipmentItem {
  id: string
  materialName: string
  sentQuantity: number
  unit: string
  receivedQuantity?: number
  notes?: string
}

interface Shipment {
  id: string
  vehicleId: string
  driverId?: string
  projectId?: string
  shipmentDate: string
  items: ShipmentItem[]
  status: string
  notes?: string
  departurePoint?: string
  arrivalPoint?: string
  authorizeName?: string
  firma?: string
  mode?: 'INMEDIATO' | 'PROGRAMADO'
  scheduledAt?: string | null
  pdfUrl?: string | null
  printedAt?: string | null
  vehicle: { name: string; plate: string }
  driver?: { firstName: string; lastName: string }
  project?: { name: string; code: string }
  user?: { name: string }
}

export default function ShipmentsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const user = session?.user
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [workers, setWorkers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isClient, setIsClient] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)

  const [formData, setFormData] = useState({
    vehicleId: '',
    driverId: '',
    projectId: '',
    departurePoint: '',
    arrivalPoint: '',
    mode: 'INMEDIATO' as 'INMEDIATO' | 'PROGRAMADO',
    scheduledAt: '',
    firma: '',
    items: [
      { materialName: '', sentQuantity: '', unit: 'unidad' }
    ],
    notes: '',
  })

  const [receiveData, setReceiveData] = useState({
    receivedDate: '',
    items: [] as { id: string; materialName: string; sentQuantity: number; receivedQuantity: string; unit: string }[],
    notes: '',
  })

  const fetchShipments = async () => {
    try {
      const response = await fetch('/api/shipments')
      const data = await response.json()
      if (response.ok && Array.isArray(data)) {
        setShipments(data)
      } else {
        setShipments([])
        toast.error('Error al cargar envíos')
      }
    } catch (error) {
      setShipments([])
      toast.error('Error al cargar envíos')
    } finally {
      setLoading(false)
    }
  }

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles')
      const data = await response.json()
      if (response.ok && Array.isArray(data)) {
        setVehicles(data.filter((v: any) => v.status === 'AVAILABLE'))
      } else {
        setVehicles([])
        toast.error('Error al cargar vehículos')
      }
    } catch (error) {
      setVehicles([])
      toast.error('Error al cargar vehículos')
    }
  }

  const fetchWorkers = async () => {
    try {
      const response = await fetch('/api/workers')
      const data = await response.json()
      if (response.ok && Array.isArray(data)) {
        setWorkers(data)
      }
    } catch (error) {
      console.error('Error fetching workers:', error)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      const data = await response.json()
      if (response.ok && Array.isArray(data)) {
        setProjects(data)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient) {
      fetchShipments()
      fetchVehicles()
      fetchWorkers()
      fetchProjects()
    }
  }, [isClient])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const formattedItems = formData.items.map(item => ({
        ...item,
        sentQuantity: parseFloat(item.sentQuantity as string) || 0
      }))

      const response = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items: formattedItems,
          userId: user?.id,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Error saving shipment')
      }

      const created = await response.json()

      if (formData.mode === 'INMEDIATO' && created.pdfUrl) {
        // Abrir el PDF en una nueva pestaña
        window.open(created.pdfUrl, '_blank')
        toast.success('Envío registrado. Abriendo documento...')
      } else if (formData.mode === 'PROGRAMADO') {
        toast.success('Envío programado correctamente')
      } else {
        toast.success('Envío registrado')
      }

      // Optimistic update: agregar el envío al state directamente
      // para evitar problemas de caché/red que dejen la lista vacía
      const fullCreated = (created.items && created.vehicle) ? created : await fetch(`/api/shipments/${created.id}`).then(r => r.json()).catch(() => created)
      setShipments((prev) => [fullCreated, ...prev])

      setDialogOpen(false)
      resetForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al registrar envío')
    }
  }

  const handleReceive = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedShipment) return

    try {
      const formattedItems = receiveData.items.map(item => ({
        id: item.id,
        receivedQuantity: parseFloat(item.receivedQuantity) || 0,
      }))

      await fetch(`/api/shipments/${selectedShipment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...receiveData,
          items: formattedItems,
        }),
      })

      toast.success('Envío recibido')
      setReceiveDialogOpen(false)
      setSelectedShipment(null)
      fetchShipments()
    } catch (error) {
      toast.error('Error al recibir envío')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/shipments/${deleteId}`, { method: 'DELETE' })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Error al eliminar envío')
      }
      toast.success('Envío eliminado')
      setDeleteId(null)
      fetchShipments()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar envío')
    } finally {
      setDeleting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      vehicleId: '',
      driverId: '',
      projectId: '',
      departurePoint: '',
      arrivalPoint: '',
      mode: 'INMEDIATO',
      scheduledAt: '',
      firma: '',
      items: [{ materialName: '', sentQuantity: '', unit: 'unidad' }],
      notes: '',
    })
  }

  const addMaterialItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { materialName: '', sentQuantity: '', unit: 'unidad' }]
    })
  }

  const removeMaterialItem = (index: number) => {
    if (formData.items.length <= 1) return
    const newItems = [...formData.items]
    newItems.splice(index, 1)
    setFormData({ ...formData, items: newItems })
  }

  const updateMaterialItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setFormData({ ...formData, items: newItems })
  }

  const resetReceiveForm = () => {
    setReceiveData({
      receivedDate: '',
      items: [],
      notes: '',
    })
  }

  const updateReceiveItem = (index: number, value: string) => {
    const newItems = [...receiveData.items]
    newItems[index] = { ...newItems[index], receivedQuantity: value }
    setReceiveData({ ...receiveData, items: newItems })
  }

  const filteredShipments = shipments.filter((s) => {
    const term = searchTerm.toLowerCase()
    const matMatch = s.items?.some((item) =>
      (item.materialName ?? '').toLowerCase().includes(term)
    )
    const plateMatch = (s.vehicle?.plate ?? '').toLowerCase().includes(term)
    const projectMatch = (s.project?.name ?? '').toLowerCase().includes(term)
    return matMatch || plateMatch || projectMatch
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      PENDING: 'bg-yellow-500',
      VERIFIED: 'bg-blue-500',
      IN_TRANSIT: 'bg-blue-600',
      RECEIVED: 'bg-green-500',
      DISCREPANCY: 'bg-red-500',
    }
    return variants[status] || 'bg-slate-500'
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Envíos</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Control de materiales y verificación de cantidades
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar envío..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nuevo Envío
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nuevo Envío</DialogTitle>
                <DialogDescription>
                  Registre el envío de materiales a un proyecto
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="departurePoint">Punto de Salida *</Label>
                    <Input
                      id="departurePoint"
                      value={formData.departurePoint}
                      onChange={(e) => setFormData({ ...formData, departurePoint: e.target.value })}
                      placeholder="Ej: Bodega Central, Chiantla"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="arrivalPoint">Punto de Llegada *</Label>
                    <Input
                      id="arrivalPoint"
                      value={formData.arrivalPoint}
                      onChange={(e) => setFormData({ ...formData, arrivalPoint: e.target.value })}
                      placeholder="Ej: Proyecto OFC, Aldea X"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleId">Vehículo *</Label>
                    <Select
                      value={formData.vehicleId}
                      onValueChange={(value) => setFormData({ ...formData, vehicleId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar vehículo" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.name} - {vehicle.plate}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="driverId">Conductor</Label>
                    <Select
                      value={formData.driverId}
                      onValueChange={(value) => setFormData({ ...formData, driverId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar conductor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Sin asignar</SelectItem>
                        {workers.map((worker) => (
                          <SelectItem key={worker.id} value={worker.id}>
                            {worker.firstName} {worker.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectId">Proyecto</Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proyecto (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin proyecto</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name} ({project.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700">
                  <Label className="text-sm font-semibold">Tipo de Envío</Label>
                  <RadioGroup
                    value={formData.mode}
                    onValueChange={(value) =>
                      setFormData({ ...formData, mode: value as 'INMEDIATO' | 'PROGRAMADO' })
                    }
                    className="flex flex-col sm:flex-row gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="INMEDIATO" id="mode-inmediato" />
                      <Label htmlFor="mode-inmediato" className="flex items-center gap-2 cursor-pointer font-normal">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        Inmediato (imprime ahora)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="PROGRAMADO" id="mode-programado" />
                      <Label htmlFor="mode-programado" className="flex items-center gap-2 cursor-pointer font-normal">
                        <CalendarClock className="w-4 h-4 text-blue-500" />
                        Programado (queda pendiente)
                      </Label>
                    </div>
                  </RadioGroup>
                  {formData.mode === 'PROGRAMADO' && (
                    <div className="space-y-2 pt-2">
                      <Label htmlFor="scheduledAt">Fecha Programada *</Label>
                      <Input
                        id="scheduledAt"
                        type="date"
                        value={formData.scheduledAt}
                        onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Materiales a Enviar</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addMaterialItem} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Agregar Material
                    </Button>
                  </div>

                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg relative border dark:border-slate-700">
                      <div className="col-span-12 sm:col-span-5 space-y-2">
                        <Label>Material *</Label>
                        <Input
                          placeholder="Ej: Cemento, Varilla, Arena"
                          value={item.materialName}
                          onChange={(e) => updateMaterialItem(index, 'materialName', e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-3 space-y-2">
                        <Label>Cantidad *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={item.sentQuantity}
                          onChange={(e) => updateMaterialItem(index, 'sentQuantity', e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-3 space-y-2">
                        <Label>Unidad</Label>
                        <Select
                          value={item.unit}
                          onValueChange={(val) => updateMaterialItem(index, 'unit', val)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unidad">Unidades</SelectItem>
                            <SelectItem value="m3">m³</SelectItem>
                            <SelectItem value="ton">Toneladas</SelectItem>
                            <SelectItem value="kg">Kilogramos</SelectItem>
                            <SelectItem value="lb">Libras</SelectItem>
                            <SelectItem value="global">Global</SelectItem>
                            <SelectItem value="viaje">Viaje</SelectItem>
                            <SelectItem value="bolsa">Bolsa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {formData.items.length > 1 && (
                        <div className="col-span-12 sm:col-span-1 flex items-end justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeMaterialItem(index)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="w-5 h-5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firma">Firma (Nombre y Apellido de quien firma)</Label>
                  <Input
                    id="firma"
                    value={formData.firma}
                    onChange={(e) => setFormData({ ...formData, firma: e.target.value })}
                    placeholder="Ej: Juan Pérez"
                    required
                  />
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-blue-700 dark:text-blue-300 font-semibold">Autoriza:</span>
                    <span className="text-blue-900 dark:text-blue-100">
                      {user?.name ?? <span className="italic text-slate-500">Cargando sesión...</span>}
                    </span>
                  </div>
                  <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">
                    El usuario activo al guardar queda registrado como autorizante.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas Generales</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Observaciones adicionales sobre el envío..."
                    rows={2}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Registrar Envío</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Envíos</CardTitle>
              <Package className="w-4 h-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shipments.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-yellow-600">Pendientes</CardTitle>
              <Package className="w-4 h-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {shipments.filter((s) => s.status === 'PENDING').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-600">Enviados</CardTitle>
              <Truck className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {shipments.filter((s) => s.status === 'VERIFIED' || s.status === 'IN_TRANSIT').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-red-600">Discrepancias</CardTitle>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {shipments.filter((s) => s.status === 'DISCREPANCY').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shipments Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-slate-500">
                Cargando envíos...
              </div>
            ) : filteredShipments.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No hay envíos registrados
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Materiales</TableHead>
                      <TableHead>Vehículo</TableHead>
                      <TableHead>Proyecto</TableHead>
                      <TableHead>Modo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredShipments.map((shipment) => (
                      <TableRow key={shipment.id}>
                        <TableCell>
                          <div>{format(new Date(shipment.shipmentDate), 'dd MMM yyyy', { locale: es })}</div>
                          {shipment.scheduledAt && (
                            <div className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                              <CalendarClock className="w-3 h-3" />
                              Prog: {format(new Date(shipment.scheduledAt), 'dd/MM/yyyy', { locale: es })}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {shipment.items?.map((item, idx) => (
                              <div key={idx} className="flex flex-col gap-1 text-sm pb-1 border-b last:border-0 border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="font-normal shrink-0">
                                    {item.sentQuantity} {item.unit}
                                  </Badge>
                                  <span className="font-medium">{item.materialName}</span>
                                </div>
                                {shipment.status !== 'PENDING' && shipment.status !== 'SENT' && item.receivedQuantity !== undefined && (
                                  <div className="flex items-center gap-2 pl-2 text-xs">
                                    <Badge variant="outline" className={`font-normal ${item.receivedQuantity !== item.sentQuantity ? 'text-red-600 border-red-200 bg-red-50' : 'text-green-600 border-green-200 bg-green-50'}`}>
                                      Recibido: {item.receivedQuantity} {item.unit}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            ))}
                            {shipment.driver && (
                              <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                <Truck className="w-3 h-3" />
                                {shipment.driver.firstName} {shipment.driver.lastName}
                              </div>
                            )}
                            {shipment.authorizeName && (
                              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                <Check className="w-3 h-3 text-blue-500" />
                                Autoriza: {shipment.authorizeName}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>{shipment.vehicle.name}</div>
                          <div className="text-xs text-slate-500">{shipment.vehicle.plate}</div>
                        </TableCell>
                        <TableCell>
                          {shipment.project ? (
                            <>
                              <div>{shipment.project.name}</div>
                              <div className="text-xs text-slate-500">{shipment.project.code}</div>
                            </>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {shipment.mode === 'PROGRAMADO' ? (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/30">
                              <CalendarClock className="w-3 h-3 mr-1" />
                              Programado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/30">
                              <Zap className="w-3 h-3 mr-1" />
                              Inmediato
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(shipment.status)}>
                            {shipment.status === 'PENDING'
                              ? 'Pendiente'
                              : shipment.status === 'VERIFIED'
                                ? 'Verificado'
                                : shipment.status === 'IN_TRANSIT'
                                  ? 'En tránsito'
                                  : shipment.status === 'RECEIVED'
                                    ? 'Recibido'
                                    : shipment.status === 'DISCREPANCY'
                                      ? 'Discrepancia'
                                      : shipment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {shipment.pdfUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(shipment.pdfUrl!, '_blank')}
                                className="gap-1"
                                title="Abrir documento PDF"
                              >
                                <Printer className="w-4 h-4" />
                                Imprimir
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(shipment.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Eliminar envío"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          {shipment.status !== 'RECEIVED' && shipment.status !== 'DISCREPANCY' && (
                            <Dialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedShipment(shipment)
                                    setReceiveData({
                                      receivedDate: new Date().toISOString().split('T')[0],
                                      items: shipment.items.map(item => ({
                                        id: item.id,
                                        materialName: item.materialName,
                                        sentQuantity: item.sentQuantity,
                                        unit: item.unit,
                                        receivedQuantity: item.sentQuantity.toString(),
                                      })),
                                      notes: '',
                                    })
                                  }}
                                >
                                  Recibir
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Recibir Envío</DialogTitle>
                                  <DialogDescription>
                                    Verifique la cantidad recibida y registre la recepción
                                  </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleReceive} className="space-y-4">
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                      <Label className="font-semibold">Cantidades Recibidas</Label>
                                    </div>
                                    <div className="space-y-3">
                                      {receiveData.items.map((item, idx) => (
                                        <div key={item.id} className="grid grid-cols-12 gap-3 items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded border dark:border-slate-700">
                                          <div className="col-span-12 sm:col-span-6">
                                            <div className="font-medium text-sm">{item.materialName}</div>
                                            <div className="text-xs text-slate-500">
                                              Enviado: {item.sentQuantity} {item.unit}
                                            </div>
                                          </div>
                                          <div className="col-span-12 sm:col-span-6">
                                            <div className="flex items-center gap-2">
                                              <Input
                                                type="number"
                                                step="0.01"
                                                value={item.receivedQuantity}
                                                onChange={(e) => updateReceiveItem(idx, e.target.value)}
                                                className="h-8"
                                                required
                                              />
                                              <span className="text-xs text-slate-500 whitespace-nowrap">{item.unit}</span>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="receivedDate">Fecha Recepción *</Label>
                                    <Input
                                      id="receivedDate"
                                      type="date"
                                      value={receiveData.receivedDate}
                                      onChange={(e) =>
                                        setReceiveData({ ...receiveData, receivedDate: e.target.value })
                                      }
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="notes">Notas</Label>
                                    <Textarea
                                      id="notes"
                                      value={receiveData.notes}
                                      onChange={(e) => setReceiveData({ ...receiveData, notes: e.target.value })}
                                      rows={2}
                                    />
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => setReceiveDialogOpen(false)}
                                    >
                                      Cancelar
                                    </Button>
                                    <Button type="submit">Confirmar Recepción</Button>
                                  </DialogFooter>
                                </form>
                              </DialogContent>
                            </Dialog>
                          )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este envío?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el envío, sus materiales
              y el documento PDF generado. El vehículo, conductor y proyecto no se verán afectados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  )
}