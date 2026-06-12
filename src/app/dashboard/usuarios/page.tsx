'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Plus, Pencil, Trash2, Search, UserCog, UserCheck, UserX, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

type UserRole = 'ADMIN' | 'MANAGER' | 'WORKER' | 'BODEGA' | 'VEHICULO' | 'RECEPTOR'

interface User {
  id: string
  code: string
  name: string
  role: UserRole
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const USER_ROLES: { value: UserRole; label: string }[] = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'MANAGER', label: 'Gerente' },
  { value: 'WORKER', label: 'Trabajador' },
  { value: 'BODEGA', label: 'Bodega' },
  { value: 'VEHICULO', label: 'Vehículo' },
  { value: 'RECEPTOR', label: 'Receptor' },
]

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: 'bg-red-500/10 text-red-600 border-red-500/20',
  MANAGER: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  WORKER: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  BODEGA: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  VEHICULO: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  RECEPTOR: 'bg-green-500/10 text-green-600 border-green-500/20',
}

const emptyForm = {
  code: '',
  name: '',
  role: 'WORKER' as UserRole,
  isActive: true,
}

export default function UsuariosPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isClient, setIsClient] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [actionTarget, setActionTarget] = useState<{
    id: string
    type: 'deactivate' | 'delete'
  } | null>(null)

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/usuarios')
      const data = await response.json()
      if (response.ok && Array.isArray(data)) {
        setUsers(data)
      } else {
        setUsers([])
        toast.error('Error al cargar usuarios')
      }
    } catch (error) {
      setUsers([])
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient) {
      fetchUsers()
    }
  }, [isClient])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingUser
        ? `/api/usuarios/${editingUser.id}`
        : '/api/usuarios'
      const method = editingUser ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Error al guardar usuario')
      }

      toast.success(editingUser ? 'Usuario actualizado' : 'Usuario creado')
      setDialogOpen(false)
      setEditingUser(null)
      resetForm()
      fetchUsers()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar usuario')
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      code: user.code,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    })
    setDialogOpen(true)
  }

  const handleAction = async () => {
    if (!actionTarget) return
    const { id, type } = actionTarget
    const url =
      type === 'delete'
        ? `/api/usuarios/${id}?force=true`
        : `/api/usuarios/${id}`

    try {
      const response = await fetch(url, { method: 'DELETE' })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Error al procesar la acción')
      }
      toast.success(
        type === 'delete' ? 'Usuario eliminado' : 'Usuario desactivado'
      )
      setActionTarget(null)
      fetchUsers()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al procesar la acción'
      )
    }
  }

  const resetForm = () => {
    setFormData(emptyForm)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingUser(null)
    resetForm()
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.code.includes(searchTerm) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    inactive: users.filter((u) => !u.isActive).length,
    admins: users.filter((u) => u.role === 'ADMIN' && u.isActive).length,
  }

  const isSelf = (userId: string) => session?.user?.id === userId

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
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
            <h1 className="text-2xl font-bold">Usuarios</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Gestión de cuentas de acceso al sistema
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nombre, código o rol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingUser(null)} className="gap-2">
                <Plus className="w-4 h-4" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                </DialogTitle>
                <DialogDescription>
                  {editingUser
                    ? 'Modifica los datos de la cuenta de acceso'
                    : 'Crea una nueva cuenta de acceso al sistema'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Código de acceso *</Label>
                    <Input
                      id="code"
                      maxLength={10}
                      minLength={6}
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          code: e.target.value.toUpperCase().replace(/[^A-Za-z0-9]/g, ''),
                        })
                      }
                      placeholder="ABC123"
                      required
                    />
                    <p className="text-xs text-slate-500">
                      6 a 10 caracteres (letras y números)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Juan Pérez"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Rol *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role: value as UserRole })
                    }
                  >
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive" className="text-sm">Usuario activo</Label>
                    <p className="text-xs text-slate-500">
                      Los usuarios inactivos no pueden iniciar sesión
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                    disabled={isSelf(editingUser?.id ?? '') && formData.isActive}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingUser ? 'Actualizar' : 'Guardar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Total Usuarios
              </CardTitle>
              <UserCog className="w-4 h-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Activos
              </CardTitle>
              <UserCheck className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Desactivados
              </CardTitle>
              <UserX className="w-4 h-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-600">{stats.inactive}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Administradores
              </CardTitle>
              <ShieldCheck className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.admins}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-slate-500">
                Cargando usuarios...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                {searchTerm
                  ? 'No se encontraron usuarios'
                  : 'No hay usuarios registrados'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Creado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <code className="text-sm font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                            {user.code}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{user.name}</span>
                            {isSelf(user.id) && (
                              <Badge variant="outline" className="text-[10px]">Tú</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={ROLE_COLORS[user.role]}>
                            {USER_ROLES.find((r) => r.value === user.role)?.label ?? user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.isActive ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                              Activo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-slate-500/10 text-slate-600 border-slate-500/20">
                              Inactivo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: es })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(user)}
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            {user.isActive ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  setActionTarget({ id: user.id, type: 'deactivate' })
                                }
                                disabled={isSelf(user.id)}
                                title={
                                  isSelf(user.id)
                                    ? 'No puedes desactivar tu propia cuenta'
                                    : 'Desactivar usuario'
                                }
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  setActionTarget({ id: user.id, type: 'delete' })
                                }
                                disabled={isSelf(user.id)}
                                className="hover:bg-red-500/10"
                                title={
                                  isSelf(user.id)
                                    ? 'No puedes eliminar tu propia cuenta'
                                    : 'Eliminar permanentemente'
                                }
                              >
                                <Trash2 className="w-4 h-4 text-red-700 dark:text-red-500" />
                              </Button>
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

      <AlertDialog
        open={!!actionTarget}
        onOpenChange={(open) => !open && setActionTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionTarget?.type === 'delete'
                ? '¿Eliminar este usuario permanentemente?'
                : '¿Desactivar este usuario?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionTarget?.type === 'delete'
                ? 'Esta acción no se puede deshacer. El usuario y su información de acceso se eliminarán del sistema. Si tiene registros históricos (préstamos, facturas, viajes, etc.), no se podrá eliminar y quedará solo desactivado.'
                : 'El usuario no podrá iniciar sesión. Puedes eliminarlo permanentemente más tarde, o reactivarlo editándolo.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionTarget?.type === 'delete' ? 'Eliminar' : 'Desactivar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
