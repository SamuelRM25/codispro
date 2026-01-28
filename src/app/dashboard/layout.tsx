'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated, user, _hasHydrated } = useAuthStore()
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (hasMounted && _hasHydrated && !isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, _hasHydrated, hasMounted, router])

  if (!hasMounted || !_hasHydrated || !isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {children}
    </div>
  )
}
