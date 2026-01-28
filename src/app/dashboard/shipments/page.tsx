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
  ArrowLeft,
  Plus,
  Package,
  Truck,
  Check,
  XCircle,
  Search,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuthStore } from '@/stores/auth-store'

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
  vehicle: { name: string; plate: string }
  driver?: { firstName: string; lastName: string }
  project?: { name: string; code: string }
}

export default function ShipmentsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [workers, setWorkers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isClient, setIsClient] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)

  const [formData, setFormData] = useState({
    vehicleId: '',
    driverId: '',
    projectId: '',
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
        setVehicles(data.filter((v: any) => v.status === 'available'))
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

      if (!response.ok) throw new Error('Error saving shipment')

      toast.success('Envío registrado')
      setDialogOpen(false)
      resetForm()
      fetchShipments()
    } catch (error) {
      toast.error('Error al registrar envío')
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

  const resetForm = () => {
    setFormData({
      vehicleId: '',
      driverId: '',
      projectId: '',
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

  const filteredShipments = shipments.filter(
    (s) =>
      s.items?.some(item => item.materialName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      s.vehicle?.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.project?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-500',
      sent: 'bg-blue-500',
      received: 'bg-green-500',
      discrepancy: 'bg-red-500',
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
                    <Label htmlFor="vehicleId">Vehículo *</Label>
                    <Select
                      value={formData.vehicleId}
                      onValueChange={(value) => setFormData({ ...formData, vehicleId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
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
                        <SelectValue />
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
                {shipments.filter((s) => s.status === 'pending').length}
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
                {shipments.filter((s) => s.status === 'sent').length}
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
                {shipments.filter((s) => s.status === 'discrepancy').length}
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
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredShipments.map((shipment) => (
                      <TableRow key={shipment.id}>
                        <TableCell>
                          {format(new Date(shipment.shipmentDate), 'dd MMM yyyy', { locale: es })}
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
                                {shipment.status !== 'pending' && shipment.status !== 'sent' && item.receivedQuantity !== undefined && (
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
                          <Badge className={getStatusBadge(shipment.status)}>
                            {shipment.status === 'pending'
                              ? 'Pendiente'
                              : shipment.status === 'sent'
                                ? 'Enviado'
                                : shipment.status === 'received'
                                  ? 'Recibido'
                                  : 'Discrepancia'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {shipment.status !== 'received' && shipment.status !== 'discrepancy' && (
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
    </div >
  )
}
