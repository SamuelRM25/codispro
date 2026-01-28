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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Plus, Pencil, Trash2, Search, User, FileText, Calendar, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import ImageUpload from '@/components/image-upload'

interface Worker {
  id: string
  firstName: string
  lastName: string
  dpi?: string
  photo?: string
  birthDate?: string
  phone?: string
  address?: string
  position?: string
  hourlyRate?: number
  isActive: boolean
}

export default function WorkersPage() {
  const router = useRouter()
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isClient, setIsClient] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dpi: '',
    photo: '',
    birthDate: '',
    phone: '',
    address: '',
    position: '',
    hourlyRate: '',
  })

  const fetchWorkers = async () => {
    try {
      const response = await fetch('/api/workers')
      const data = await response.json()
      if (response.ok && Array.isArray(data)) {
        setWorkers(data)
      } else {
        setWorkers([])
        toast.error('Error al cargar trabajadores')
      }
    } catch (error) {
      setWorkers([])
      console.error('Error fetching workers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient) {
      fetchWorkers()
    }
  }, [isClient])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
      }

      const url = editingWorker
        ? `/api/workers/${editingWorker.id}`
        : '/api/workers'

      const method = editingWorker ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error('Error al guardar trabajador')

      toast.success(editingWorker ? 'Trabajador actualizado' : 'Trabajador creado')
      setDialogOpen(false)
      setEditingWorker(null)
      resetForm()
      fetchWorkers()
    } catch (error) {
      toast.error('Error al guardar trabajador')
    }
  }

  const handleEdit = (worker: Worker) => {
    setEditingWorker(worker)
    setFormData({
      firstName: worker.firstName,
      lastName: worker.lastName,
      dpi: worker.dpi || '',
      photo: worker.photo || '',
      birthDate: worker.birthDate ? worker.birthDate.split('T')[0] : '',
      phone: worker.phone || '',
      address: worker.address || '',
      position: worker.position || '',
      hourlyRate: worker.hourlyRate?.toString() || '',
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este trabajador?')) return

    try {
      await fetch(`/api/workers/${id}`, { method: 'DELETE' })
      toast.success('Trabajador eliminado')
      fetchWorkers()
    } catch (error) {
      toast.error('Error al eliminar trabajador')
    }
  }

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      dpi: '',
      photo: '',
      birthDate: '',
      phone: '',
      address: '',
      position: '',
      hourlyRate: '',
    })
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingWorker(null)
    resetForm()
  }

  const filteredWorkers = workers.filter(
    (worker) =>
      worker.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.dpi?.includes(searchTerm) ||
      worker.position?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getInitials = (firstName: string, lastName: string) =>
    `${firstName[0]}${lastName[0]}`.toUpperCase()

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
            <h1 className="text-2xl font-bold">Trabajadores</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Gestión del personal
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar trabajador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingWorker(null)} className="gap-2">
                <Plus className="w-4 h-4" />
                Nuevo Trabajador
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingWorker ? 'Editar Trabajador' : 'Nuevo Trabajador'}
                </DialogTitle>
                <DialogDescription>
                  Complete la información del trabajador
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dpi">DPI</Label>
                    <Input
                      id="dpi"
                      value={formData.dpi}
                      onChange={(e) => setFormData({ ...formData, dpi: e.target.value })}
                      placeholder="Opcional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <ImageUpload
                    label="Foto del Trabajador"
                    value={formData.photo}
                    onChange={(url) => setFormData({ ...formData, photo: url })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+502..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate">Tarifa por Día</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      step="0.01"
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Cargo/Posición</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Obrero, Supervisor, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Dirección completa"
                    rows={2}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingWorker ? 'Actualizar' : 'Guardar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Total Trabajadores
              </CardTitle>
              <User className="w-4 h-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workers.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Activos
              </CardTitle>
              <User className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {workers.filter(w => w.isActive).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Con DPI
              </CardTitle>
              <FileText className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {workers.filter(w => w.dpi).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Con Foto
              </CardTitle>
              <Calendar className="w-4 h-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {workers.filter(w => w.photo).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workers Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-slate-500">
                Cargando trabajadores...
              </div>
            ) : filteredWorkers.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                {searchTerm ? 'No se encontraron trabajadores' : 'No hay trabajadores registrados'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trabajador</TableHead>
                      <TableHead>DPI</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Telefono</TableHead>
                      <TableHead>Tarifa/Día</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWorkers.map((worker) => (
                      <TableRow key={worker.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={worker.photo} />
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {getInitials(worker.firstName, worker.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {worker.firstName} {worker.lastName}
                              </div>
                              {worker.birthDate && (
                                <div className="text-xs text-slate-500">
                                  {format(new Date(worker.birthDate), 'dd MMM yyyy', { locale: es })}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{worker.dpi || '-'}</TableCell>
                        <TableCell>{worker.position || '-'}</TableCell>
                        <TableCell>{worker.phone || '-'}</TableCell>
                        <TableCell>
                          {worker.hourlyRate ? `Q${worker.hourlyRate.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(worker)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(worker.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
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
    </div>
  )
}
