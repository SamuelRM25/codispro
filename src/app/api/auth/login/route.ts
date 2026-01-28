import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const loginSchema = z.object({
  code: z.string().min(1, 'El código es requerido'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = loginSchema.parse(body)

    const user = await db.user.findUnique({
      where: { code },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Código inválido' },
        { status: 401 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Usuario desactivado' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      id: user.id,
      code: user.code,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Error al iniciar sesión' },
      { status: 500 }
    )
  }
}
