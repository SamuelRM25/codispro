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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
  Pencil,
  Trash2,
  Search,
  Wrench,
  Calendar as CalendarIcon,
  XCircle,
  ArrowRightLeft,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import ImageUpload from '@/components/image-upload'

interface Tool {
  id: string
  name: string
  description?: string
  barcode?: string
  photo?: string
  category?: string
  status: string
  location?: string
  loans?: any[]
}

interface ToolLoan {
  id: string
  toolId: string
  userId: string
  workerId?: string
  loanDate: string
  returnDate?: string
  notes?: string
  tool: { name: string; barcode?: string; category?: string }
  worker?: { firstName: string; lastName: string }
  user: { name: string }
}

export default function ToolsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [tools, setTools] = useState<Tool[]>([])
  const [loans, setLoans] = useState<ToolLoan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isClient, setIsClient] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loanDialogOpen, setLoanDialogOpen] = useState(false)
  const [editingTool, setEditingTool] = useState<Tool | null>(null)
  const [selectedWorker, setSelectedWorker] = useState<string>('')
  const [workers, setWorkers] = useState<any[]>([])

  const [toolFormData, setToolFormData] = useState({
    name: '',
    description: '',
    barcode: '',
    photo: '',
    category: '',
    location: '',
    status: 'available',
  })


  const fetchTools = async () => {
    try {
      const response = await fetch('/api/tools')
      const data = await response.json()
      if (response.ok && Array.isArray(data)) {
        setTools(data)
      } else {
        setTools([])
        toast.error('Error al cargar herramientas')
      }
    } catch (error) {
      setTools([])
      toast.error('Error al cargar herramientas')
    } finally {
      setLoading(false)
    }
  }

  const fetchLoans = async () => {
    try {
      const response = await fetch('/api/tool-loans')
      const data = await response.json()
      if (response.ok && Array.isArray(data)) {
        setLoans(data)
      }
    } catch (error) {
      console.error('Error fetching loans:', error)
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

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient) {
      fetchTools()
      fetchLoans()
      fetchWorkers()
    }
  }, [isClient])

  const handleToolSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingTool ? `/api/tools/${editingTool.id}` : '/api/tools'
      const method = editingTool ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toolFormData),
      })

      if (!response.ok) throw new Error('Error al guardar herramienta')

      toast.success(editingTool ? 'Herramienta actualizada' : 'Herramienta creada')
      setDialogOpen(false)
      setEditingTool(null)
      resetToolForm()
      fetchTools()
    } catch (error) {
      toast.error('Error al guardar herramienta')
    }
  }

  const handleLoanTool = async () => {
    if (!selectedWorker) {
      toast.error('Selecciona un trabajador')
      return
    }

    try {
      await fetch('/api/tool-loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: editingTool?.id,
          userId: user?.id,
          workerId: selectedWorker,
        }),
      })

      toast.success('Herramienta prestada')
      setLoanDialogOpen(false)
      setEditingTool(null)
      setSelectedWorker('')
      fetchTools()
      fetchLoans()
    } catch (error) {
      toast.error('Error al prestar herramienta')
    }
  }

  const handleReturnTool = async (loanId: string, toolId: string) => {
    try {
      await fetch(`/api/tool-loans/${loanId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnDate: new Date().toISOString() }),
      })

      toast.success('Herramienta devuelta')
      fetchTools()
      fetchLoans()
    } catch (error) {
      toast.error('Error al devolver herramienta')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta herramienta?')) return

    try {
      await fetch(`/api/tools/${id}`, { method: 'DELETE' })
      toast.success('Herramienta eliminada')
      fetchTools()
    } catch (error) {
      toast.error('Error al eliminar herramienta')
    }
  }

  const resetToolForm = () => {
    setToolFormData({
      name: '',
      description: '',
      barcode: '',
      photo: '',
      category: '',
      location: '',
      status: 'available',
    })
  }

  const filteredTools = tools.filter(
    (tool) =>
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.barcode?.includes(searchTerm) ||
      tool.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      available: 'bg-green-500',
      in_use: 'bg-blue-500',
      maintenance: 'bg-orange-500',
      retired: 'bg-slate-500',
    }
    return variants[status] || 'bg-slate-500'
  }

  const getActiveLoans = () => loans.filter((loan) => !loan.returnDate)
  const getReturnedLoans = () => loans.filter((loan) => loan.returnDate)

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
            <h1 className="text-2xl font-bold">Herramientas</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Inventario y control de préstamos
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <Tabs defaultValue="inventory" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="inventory">Inventario</TabsTrigger>
            <TabsTrigger value="loans">Préstamos</TabsTrigger>
            <TabsTrigger value="calendar">Calendario</TabsTrigger>
          </TabsList>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar herramienta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingTool(null)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Nueva Herramienta
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingTool ? 'Editar Herramienta' : 'Nueva Herramienta'}
                    </DialogTitle>
                    <DialogDescription>
                      Complete la información de la herramienta
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleToolSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre *</Label>
                      <Input
                        id="name"
                        value={toolFormData.name}
                        onChange={(e) => setToolFormData({ ...toolFormData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="barcode">Código de Barras</Label>
                        <Input
                          id="barcode"
                          value={toolFormData.barcode}
                          onChange={(e) => setToolFormData({ ...toolFormData, barcode: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Categoría</Label>
                        <Input
                          id="category"
                          value={toolFormData.category}
                          onChange={(e) => setToolFormData({ ...toolFormData, category: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descripción</Label>
                      <Textarea
                        id="description"
                        value={toolFormData.description}
                        onChange={(e) => setToolFormData({ ...toolFormData, description: e.target.value })}
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location">Ubicación en Bodega</Label>
                        <Input
                          id="location"
                          value={toolFormData.location}
                          onChange={(e) => setToolFormData({ ...toolFormData, location: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Estado</Label>
                        <Select
                          value={toolFormData.status}
                          onValueChange={(value) => setToolFormData({ ...toolFormData, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Disponible</SelectItem>
                            <SelectItem value="in_use">En Uso</SelectItem>
                            <SelectItem value="maintenance">Mantenimiento</SelectItem>
                            <SelectItem value="retired">Retirado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2 col-span-2">
                      <ImageUpload
                        label="Foto de la Herramienta"
                        value={toolFormData.photo}
                        onChange={(url) => setToolFormData({ ...toolFormData, photo: url })}
                      />
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">
                        {editingTool ? 'Actualizar' : 'Guardar'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <Wrench className="w-4 h-4 text-slate-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{tools.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-green-600">Disponibles</CardTitle>
                  <Check className="w-4 h-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {tools.filter((t) => t.status === 'available').length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-blue-600">En Uso</CardTitle>
                  <Wrench className="w-4 h-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {tools.filter((t) => t.status === 'in_use').length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-orange-600">Mantenimiento</CardTitle>
                  <Wrench className="w-4 h-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {tools.filter((t) => t.status === 'maintenance').length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tools Table */}
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center text-slate-500">
                    Cargando herramientas...
                  </div>
                ) : filteredTools.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    No hay herramientas registradas
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Herramienta</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead>Código Barras</TableHead>
                          <TableHead>Ubicación</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTools.map((tool) => (
                          <TableRow key={tool.id}>
                            <TableCell>
                              <div className="font-medium">{tool.name}</div>
                              {tool.description && (
                                <div className="text-xs text-slate-500">{tool.description}</div>
                              )}
                            </TableCell>
                            <TableCell>{tool.category || '-'}</TableCell>
                            <TableCell>{tool.barcode || '-'}</TableCell>
                            <TableCell>{tool.location || '-'}</TableCell>
                            <TableCell>
                              <Badge className={getStatusBadge(tool.status)}>
                                {tool.status === 'available'
                                  ? 'Disponible'
                                  : tool.status === 'in_use'
                                    ? 'En Uso'
                                    : tool.status === 'maintenance'
                                      ? 'Mantenimiento'
                                      : 'Retirado'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingTool(tool)
                                    setToolFormData({
                                      name: tool.name,
                                      description: tool.description || '',
                                      barcode: tool.barcode || '',
                                      photo: tool.photo || '',
                                      category: tool.category || '',
                                      location: tool.location || '',
                                      status: tool.status,
                                    })
                                    setDialogOpen(true)
                                  }}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingTool(tool)
                                    setLoanDialogOpen(true)
                                  }}
                                  disabled={tool.status !== 'available'}
                                >
                                  <ArrowRightLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(tool.id)}
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
          </TabsContent>

          {/* Loans Tab */}
          <TabsContent value="loans" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Loans */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-blue-500" />
                    Préstamos Activos ({getActiveLoans().length})
                  </CardTitle>
                  <CardDescription>
                    Herramientas actualmente prestadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {getActiveLoans().length === 0 ? (
                      <p className="text-center text-slate-500 py-8">
                        No hay préstamos activos
                      </p>
                    ) : (
                      getActiveLoans().map((loan) => (
                        <div key={loan.id} className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{loan.tool.name}</p>
                              <p className="text-sm text-slate-600">
                                {loan.worker
                                  ? `${loan.worker.firstName} ${loan.worker.lastName}`
                                  : 'Sin asignar'}
                              </p>
                              <p className="text-xs text-slate-500">
                                Desde: {format(new Date(loan.loanDate), 'dd MMM yyyy', { locale: es })}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleReturnTool(loan.id, loan.toolId)}
                              className="gap-2"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                              Devolver
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Returned Loans */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    Devoluciones ({getReturnedLoans().length})
                  </CardTitle>
                  <CardDescription>
                    Historial de devoluciones
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {getReturnedLoans().length === 0 ? (
                      <p className="text-center text-slate-500 py-8">
                        No hay devoluciones registradas
                      </p>
                    ) : (
                      getReturnedLoans().map((loan) => (
                        <div key={loan.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                          <div>
                            <p className="font-medium">{loan.tool.name}</p>
                            <p className="text-sm text-slate-600">
                              {loan.worker
                                ? `${loan.worker.firstName} ${loan.worker.lastName}`
                                : 'Sin asignar'}
                            </p>
                            <div className="text-xs text-slate-500 flex gap-4">
                              <span>
                                Prestado: {format(new Date(loan.loanDate), 'dd MMM yyyy', { locale: es })}
                              </span>
                              <span>
                                Devuelto: {format(new Date(loan.returnDate!), 'dd MMM yyyy', { locale: es })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Calendario de Préstamos
                </CardTitle>
                <CardDescription>
                  Visualiza todos los préstamos y devoluciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loans.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">
                      No hay préstamos registrados
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="font-medium text-lg">Préstamos Activos</h3>
                        {getActiveLoans().map((loan) => (
                          <div
                            key={loan.id}
                            className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-500"
                          >
                            <div className="font-medium">{loan.tool.name}</div>
                            <div className="text-sm text-slate-600">
                              {loan.worker
                                ? `${loan.worker.firstName} ${loan.worker.lastName}`
                                : 'Sin asignar'}
                            </div>
                            <div className="text-xs text-slate-500">
                              Desde: {format(new Date(loan.loanDate), 'dd MMM yyyy', { locale: es })}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-medium text-lg">Historial</h3>
                        {getReturnedLoans().slice(0, 5).map((loan) => (
                          <div
                            key={loan.id}
                            className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border-l-4 border-green-500"
                          >
                            <div className="font-medium">{loan.tool.name}</div>
                            <div className="text-sm text-slate-600">
                              {loan.worker
                                ? `${loan.worker.firstName} ${loan.worker.lastName}`
                                : 'Sin asignar'}
                            </div>
                            <div className="text-xs text-slate-500 flex gap-4">
                              <span>
                                Prestado: {format(new Date(loan.loanDate), 'dd MMM yyyy', { locale: es })}
                              </span>
                              <span>
                                Devuelto: {format(new Date(loan.returnDate!), 'dd MMM yyyy', { locale: es })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Loan Dialog */}
        <Dialog open={loanDialogOpen} onOpenChange={setLoanDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Prestar Herramienta</DialogTitle>
              <DialogDescription>
                Asigne la herramienta "{editingTool?.name}" a un trabajador
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Trabajador</Label>
                <Select value={selectedWorker} onValueChange={setSelectedWorker}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar trabajador" />
                  </SelectTrigger>
                  <SelectContent>
                    {workers.map((worker) => (
                      <SelectItem key={worker.id} value={worker.id}>
                        {worker.firstName} {worker.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLoanDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleLoanTool} disabled={!selectedWorker}>
                Confirmar Préstamo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
