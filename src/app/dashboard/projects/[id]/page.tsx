'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  Users,
  Package,
  DollarSign,
  TrendingUp,
  Plus,
  Calendar,
  BarChart3,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuthStore } from '@/stores/auth-store'

export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuthStore()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const [addStaffDialog, setAddStaffDialog] = useState(false)
  const [workers, setWorkers] = useState<any[]>([])

  const [staffFormData, setStaffFormData] = useState({
    workerId: '',
    role: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    salary: '',
  })

  const fetchProjectDetail = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`)
      const data = await response.json()
      setProject(data)
    } catch (error) {
      toast.error('Error al cargar detalles del proyecto')
    } finally {
      setLoading(false)
    }
  }

  const fetchWorkers = async () => {
    try {
      const response = await fetch('/api/workers')
      const data = await response.json()
      setWorkers(data)
    } catch (error) {
      console.error('Error fetching workers:', error)
    }
  }

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient && params.id) {
      fetchProjectDetail()
      fetchWorkers()
    }
  }, [isClient, params.id])

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await fetch(`/api/projects/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addStaff',
          data: {
            ...staffFormData,
            salary: parseFloat(staffFormData.salary),
          },
        }),
      })

      toast.success('Trabajador asignado al proyecto')
      setAddStaffDialog(false)
      resetStaffForm()
      fetchProjectDetail()
    } catch (error) {
      toast.error('Error al asignar trabajador')
    }
  }

  const handleUpdateProgress = async (newProgress: number) => {
    try {
      await fetch(`/api/projects/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateProgress',
          data: { projectId: params.id, progress: newProgress },
        }),
      })

      toast.success('Progreso actualizado')
      fetchProjectDetail()
    } catch (error) {
      toast.error('Error al actualizar progreso')
    }
  }

  const resetStaffForm = () => {
    setStaffFormData({
      workerId: '',
      role: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      salary: '',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-500">Cargando detalles del proyecto...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-slate-500">Proyecto no encontrado</p>
      </div>
    )
  }

  const totalBudget = project.budget || 0
  const progressPercent = project.progress || 0
  const spentAmount = (totalBudget * progressPercent) / 100

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/projects')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Código: {project.code}
            </p>
          </div>
          <Badge variant="outline">{project.status}</Badge>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
        {/* Project Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Progreso</CardTitle>
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">{progressPercent}%</div>
              <Progress value={progressPercent} className="h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Presupuesto</CardTitle>
              <DollarSign className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Q{totalBudget.toFixed(2)}
              </div>
              <p className="text-xs text-slate-500">Gastado: Q{spentAmount.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Personal</CardTitle>
              <Users className="w-4 h-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {project._count?.staff || 0}
              </div>
              <p className="text-xs text-slate-500">Trabajadores asignados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Envíos</CardTitle>
              <Package className="w-4 h-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {project._count?.shipments || 0}
              </div>
              <p className="text-xs text-slate-500">Envíos realizados</p>
            </CardContent>
          </Card>
        </div>

        {/* Project Info */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Proyecto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600 mb-1">Dirección</p>
                <p className="font-medium">{project.address || 'No especificada'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Cliente</p>
                <p className="font-medium">{project.client || 'No especificado'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Fecha Inicio</p>
                <p className="font-medium">
                  {format(new Date(project.startDate), 'dd MMM yyyy', { locale: es })}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Fecha Fin</p>
                <p className="font-medium">
                  {project.endDate
                    ? format(new Date(project.endDate), 'dd MMM yyyy', { locale: es })
                    : 'En curso'}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Descripción</p>
              <p className="font-medium">{project.description || 'Sin descripción'}</p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateProgress(Math.min(100, progressPercent + 10))}
              >
                +10% Progreso
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateProgress(Math.min(100, progressPercent + 25))}
              >
                +25% Progreso
              </Button>
              <Button
                size="sm"
                onClick={() => handleUpdateProgress(100)}
              >
                Completar Proyecto
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue="staff" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="staff">Personal</TabsTrigger>
            <TabsTrigger value="shipments">Envíos</TabsTrigger>
            <TabsTrigger value="petty-cash">Caja Chica</TabsTrigger>
            <TabsTrigger value="expenses">Gastos</TabsTrigger>
          </TabsList>

          {/* Staff Tab */}
          <TabsContent value="staff" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Personal del Proyecto</h2>
                <p className="text-sm text-slate-600">
                  Gestión de trabajadores asignados
                </p>
              </div>
              <Dialog open={addStaffDialog} onOpenChange={setAddStaffDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Asignar Trabajador
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Asignar Trabajador al Proyecto</DialogTitle>
                    <DialogDescription>
                      Selecciona el trabajador y define su rol
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddStaff} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="workerId">Trabajador *</Label>
                      <Select
                        value={staffFormData.workerId}
                        onValueChange={(value) => setStaffFormData({ ...staffFormData, workerId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
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

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="role">Cargo/Rol</Label>
                        <Select
                          value={staffFormData.role}
                          onValueChange={(value) => setStaffFormData({ ...staffFormData, role: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="supervisor">Supervisor</SelectItem>
                            <SelectItem value="obrero">Obrero</SelectItem>
                            <SelectItem value="maestro">Maestro</SelectItem>
                            <SelectItem value="ayudante">Ayudante</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="salary">Salario</Label>
                        <Input
                          id="salary"
                          type="number"
                          step="0.01"
                          value={staffFormData.salary}
                          onChange={(e) => setStaffFormData({ ...staffFormData, salary: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Fecha Inicio *</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={staffFormData.startDate}
                          onChange={(e) => setStaffFormData({ ...staffFormData, startDate: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate">Fecha Fin</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={staffFormData.endDate}
                          onChange={(e) => setStaffFormData({ ...staffFormData, endDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setAddStaffDialog(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit">Asignar</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                {project.staff?.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    No hay trabajadores asignados
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 dark:bg-slate-900">
                        <tr>
                          <th className="text-left p-3">Trabajador</th>
                          <th className="text-left p-3">Cargo</th>
                          <th className="text-left p-3">Fecha Inicio</th>
                          <th className="text-left p-3">Fecha Fin</th>
                          <th className="text-left p-3">Salario</th>
                        </tr>
                      </thead>
                      <tbody>
                        {project.staff?.map((staff: any) => (
                          <tr key={staff.id} className="border-t">
                            <td className="p-3">
                              <div className="font-medium">
                                {staff.worker.firstName} {staff.worker.lastName}
                              </div>
                              <div className="text-xs text-slate-500">{staff.worker.phone}</div>
                            </td>
                            <td className="p-3">{staff.role || '-'}</td>
                            <td className="p-3">
                              {format(new Date(staff.startDate), 'dd MMM yyyy', { locale: es })}
                            </td>
                            <td className="p-3">
                              {staff.endDate
                                ? format(new Date(staff.endDate), 'dd MMM yyyy', { locale: es })
                                : 'Activo'}
                            </td>
                            <td className="p-3">
                              {staff.salary ? `Q${staff.salary.toFixed(2)}` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shipments Tab */}
          <TabsContent value="shipments" className="space-y-6">
            <h2 className="text-xl font-bold">Envíos del Proyecto</h2>
            <Card>
              <CardContent className="p-0">
                {project.shipments?.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    No hay envíos registrados
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 dark:bg-slate-900">
                        <tr>
                          <th className="text-left p-3">Fecha</th>
                          <th className="text-left p-3">Material</th>
                          <th className="text-left p-3">Cantidad</th>
                          <th className="text-left p-3">Vehículo</th>
                          <th className="text-left p-3">Conductor</th>
                          <th className="text-left p-3">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {project.shipments?.map((shipment: any) => (
                          <tr key={shipment.id} className="border-t">
                            <td className="p-3">
                              {format(new Date(shipment.shipmentDate), 'dd MMM yyyy', { locale: es })}
                            </td>
                            <td className="p-3 font-medium">{shipment.materialName}</td>
                            <td className="p-3">
                              <div>{shipment.sentQuantity}</div>
                              {shipment.receivedQuantity && (
                                <div className="text-xs text-slate-500">
                                  Recibido: {shipment.receivedQuantity}
                                </div>
                              )}
                            </td>
                            <td className="p-3">
                              <div>{shipment.vehicle.name}</div>
                              <div className="text-xs text-slate-500">{shipment.vehicle.plate}</div>
                            </td>
                            <td className="p-3">
                              {shipment.driver
                                ? `${shipment.driver.firstName} ${shipment.driver.lastName}`
                                : '-'}
                            </td>
                            <td className="p-3">
                              <Badge
                                variant="outline"
                                className={
                                  shipment.status === 'received'
                                    ? 'bg-green-500 text-white'
                                    : shipment.status === 'discrepancy'
                                      ? 'bg-red-500 text-white'
                                      : 'bg-blue-500 text-white'
                                }
                              >
                                {shipment.status === 'received'
                                  ? 'Recibido'
                                  : shipment.status === 'discrepancy'
                                    ? 'Discrepancia'
                                    : 'Enviado'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Petty Cash Tab */}
          <TabsContent value="petty-cash" className="space-y-6">
            <h2 className="text-xl font-bold">Movimientos de Caja Chica</h2>
            <Card>
              <CardContent className="p-0">
                {project.pettyCash?.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    No hay movimientos registrados
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 dark:bg-slate-900">
                        <tr>
                          <th className="text-left p-3">Fecha</th>
                          <th className="text-left p-3">Tipo</th>
                          <th className="text-left p-3">Categoría</th>
                          <th className="text-left p-3">Descripción</th>
                          <th className="text-left p-3">Monto</th>
                          <th className="text-left p-3">Usuario</th>
                        </tr>
                      </thead>
                      <tbody>
                        {project.pettyCash?.map((tx: any) => (
                          <tr key={tx.id} className="border-t">
                            <td className="p-3">
                              {format(new Date(tx.date), 'dd MMM yyyy', { locale: es })}
                            </td>
                            <td className="p-3">
                              <Badge variant={tx.type === 'income' ? 'default' : 'destructive'}>
                                {tx.type === 'income' ? 'Ingreso' : 'Egreso'}
                              </Badge>
                            </td>
                            <td className="p-3">{tx.category || '-'}</td>
                            <td className="p-3">{tx.description}</td>
                            <td className={`p-3 font-medium ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                              }`}>
                              {tx.type === 'income' ? '+' : '-'}Q{tx.amount.toFixed(2)}
                            </td>
                            <td className="p-3">{tx.user.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-6">
            <h2 className="text-xl font-bold">Gastos del Proyecto</h2>
            <Card>
              <CardContent className="p-0">
                {project.expenses?.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    No hay gastos registrados
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 dark:bg-slate-900">
                        <tr>
                          <th className="text-left p-3">Fecha</th>
                          <th className="text-left p-3">Categoría</th>
                          <th className="text-left p-3">Descripción</th>
                          <th className="text-left p-3">Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {project.expenses?.map((expense: any) => (
                          <tr key={expense.id} className="border-t">
                            <td className="p-3">
                              {format(new Date(expense.date), 'dd MMM yyyy', { locale: es })}
                            </td>
                            <td className="p-3">{expense.category}</td>
                            <td className="p-3">{expense.description}</td>
                            <td className="p-3 font-medium text-red-600">
                              Q{expense.amount.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
