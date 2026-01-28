'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HardHat, Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, login, _hasHydrated } = useAuthStore()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) return null

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión')
      }

      login(data)
      toast.success('Bienvenido, ' + data.name)
      router.push('/dashboard')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-2 bg-primary/5 rounded-2xl">
              <img src="/logo.png" alt="CODISPRO" className="w-24 h-24 object-contain" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">CODISPRO</CardTitle>
          <CardDescription className="text-base">
            Sistema de Gestión Integral
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAuthenticated && _hasHydrated ? (
            <div className="space-y-4">
              <p className="text-center text-slate-600 dark:text-slate-400">
                Has iniciado sesión como <span className="font-semibold">{useAuthStore.getState().user?.name}</span>
              </p>
              <Button
                onClick={() => router.push('/dashboard')}
                className="w-full gap-2"
                size="lg"
              >
                Continuar al Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => useAuthStore.getState().logout()}
                className="w-full"
              >
                Cerrar Sesión
              </Button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="code" className="text-sm font-medium">
                  Código de Acceso
                </label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Ingresa tu código"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="text-center text-2xl tracking-wider"
                  maxLength={10}
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !code.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  'Ingresar'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
