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
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-white/20 glass dark:glass-dark shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-700">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-accent to-primary" />
        <CardHeader className="space-y-6 text-center pt-10">
          <div className="flex justify-center">
            <div className="p-4 bg-white/60 dark:bg-black/40 rounded-[2.5rem] shadow-2xl border border-white/20 hover:scale-105 transition-transform duration-500">
              <img src="/logo.png" alt="CODISPRO" className="w-20 h-20 object-contain" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase transition-colors">
              CODISPRO
            </CardTitle>
            <CardDescription className="text-[10px] font-black uppercase tracking-[0.4em] text-primary dark:text-accent/80">
              Gestión Integral de Proyectos
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pb-10 px-8">
          {isAuthenticated && _hasHydrated ? (
            <div className="space-y-4 pt-4">
              <div className="p-4 rounded-2xl bg-primary/5 dark:bg-white/5 border border-primary/10 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Sesión activa como</p>
                <p className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">{useAuthStore.getState().user?.name}</p>
              </div>
              <Button
                onClick={() => router.push('/dashboard')}
                className="w-full gap-3 h-14 text-base font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all rounded-2xl bg-primary hover:bg-primary/90"
                size="lg"
              >
                Ingresar al Sistema
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => useAuthStore.getState().logout()}
                className="w-full h-12 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-destructive transition-colors"
              >
                Cerrar Sesión
              </Button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-8 pt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <label htmlFor="code" className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Código de Acceso
                  </label>
                  <span className="h-px flex-1 bg-slate-200 dark:bg-white/10 ml-4" />
                </div>
                <div className="group relative">
                  <Input
                    id="code"
                    type="password"
                    placeholder="••••••"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="h-20 text-center text-4xl font-black tracking-[0.6em] bg-white/40 dark:bg-black/20 border-white/20 rounded-3xl focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-200 dark:placeholder:text-slate-800"
                    maxLength={10}
                    autoFocus
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-16 text-base font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/25 hover:shadow-primary/40 transition-all rounded-3xl bg-primary hover:bg-primary/90"
                disabled={loading || !code.trim()}
              >
                {loading ? (
                  <Loader2 className="h-7 w-7 animate-spin" />
                ) : (
                  'Validar Acceso'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="fixed bottom-10 left-0 w-full text-center pointer-events-none">
        <p className="text-[9px] font-black text-slate-400 tracking-[0.5em] uppercase opacity-50">
          © 2025 CODISPRO Solutions • Enterprise Edition
        </p>
      </div>
    </div>
  )
}
