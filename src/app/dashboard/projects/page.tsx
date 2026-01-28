'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Plus,
  Search,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Package,
  TrendingUp,
  Pencil,
} from 'lucide-react'
import { toast } from 'sonner'

interface Project {
  id: string
  name: string
  code: string
  description?: string
  address?: string
  startDate: string
  endDate?: string | null
  status: string
  progress: number
  budget?: number | null
  client?: string
  staff: Array<{ worker: { firstName: string; lastName: string } }>
  shipments: any[]
  expenses: any[]
}

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [open, setOpen] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    address: '',
    startDate: '',
    endDate: '',
    status: 'planning',
    budget: '',
    client: '',
  })

  const [editingProgress, setEditingProgress] = useState<{ id: string, progress: number } | null>(null)
  const [progressDialogOpen, setProgressDialogOpen] = useState(false)

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      const data = await response.json()
      setProjects(data)
    } catch (error) {
      toast.error('Error al cargar proyectos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const payload = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error()

      toast.success('Proyecto creado')
      setOpen(false)
      setFormData({
        name: '',
        code: '',
        description: '',
        address: '',
        startDate: '',
        endDate: '',
        status: 'planning',
        budget: '',
        client: '',
      })
      fetchProjects()
    } catch (error) {
      toast.error('Error al crear proyecto')
    }
  }

  const handleUpdateProgress = async () => {
    if (!editingProgress) return

    try {
      const response = await fetch(`/api/projects/${editingProgress.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: editingProgress.progress }),
      })

      if (!response.ok) throw new Error()

      toast.success('Progreso actualizado')
      setProgressDialogOpen(false)
      fetchProjects()
    } catch (error) {
      toast.error('Error al actualizar progreso')
    }
  }

  const filteredProjects = projects.filter((project) => {
    const search = searchTerm.toLowerCase()
    return (
      project.name.toLowerCase().includes(search) ||
      project.code.toLowerCase().includes(search) ||
      project.client?.toLowerCase().includes(search)
    )
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      planning: { label: 'Planificación', className: 'bg-gray-500 hover:bg-gray-600' },
      active: { label: 'Activo', className: 'bg-blue-500 hover:bg-blue-600' },
      on_hold: { label: 'Pausado', className: 'bg-yellow-500 hover:bg-yellow-600' },
      completed: { label: 'Completado', className: 'bg-green-500 hover:bg-green-600' },
      cancelled: { label: 'Cancelado', className: 'bg-red-500 hover:bg-red-600' },
    }
    const statusConfig = variants[status] || variants.planning
    return (
      <Badge className={statusConfig.className}>
        {statusConfig.label}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Proyectos</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Gestión integral de proyectos
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Proyecto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
                <DialogDescription>
                  Completa la información del proyecto
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2 col-span-2">
                    <Label>Nombre del Proyecto *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Código *</Label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cliente</Label>
                    <Input
                      value={formData.client}
                      onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de Inicio *</Label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de Fin Estimada</Label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">Planificación</SelectItem>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="on_hold">Pausado</SelectItem>
                        <SelectItem value="completed">Completado</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Presupuesto</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Descripción</Label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Dirección</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Crear Proyecto</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar proyecto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Cargando...</div>
        ) : filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-600 dark:text-slate-400">
                {searchTerm ? 'No se encontraron proyectos' : 'No hay proyectos registrados'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <span className="font-medium">{project.code}</span>
                        {project.client && ` • ${project.client}`}
                      </CardDescription>
                    </div>
                    {getStatusBadge(project.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.address && (
                    <p className="text-sm flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <MapPin className="w-4 h-4" />
                      {project.address}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Calendar className="w-4 h-4" />
                    {new Date(project.startDate).toLocaleDateString('es-GT')}
                    {project.endDate && ` - ${new Date(project.endDate).toLocaleDateString('es-GT')}`}
                  </div>

                  <div className="space-y-2 group relative">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Progreso
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{project.progress}%</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 transition-opacity"
                          onClick={() => {
                            setEditingProgress({ id: project.id, progress: project.progress })
                            setProgressDialogOpen(true)
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>

                  {project.budget && (
                    <p className="text-sm flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-slate-400" />
                      Presupuesto: Q{project.budget.toFixed(2)}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-600 dark:text-slate-400">
                        <Users className="w-4 h-4" />
                        <span className="text-lg font-bold">{project.staff.length}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Personal</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-600 dark:text-slate-400">
                        <Package className="w-4 h-4" />
                        <span className="text-lg font-bold">{project.shipments.length}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Envíos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Progress Dialog */}
        <Dialog open={progressDialogOpen} onOpenChange={setProgressDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Actualizar Progreso</DialogTitle>
              <DialogDescription>
                Ajuste el porcentaje de avance del proyecto
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Porcentaje: {editingProgress?.progress}%</Label>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editingProgress?.progress || 0}
                  onChange={(e) => setEditingProgress(prev => prev ? { ...prev, progress: parseInt(e.target.value) } : null)}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setProgressDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateProgress}>
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
