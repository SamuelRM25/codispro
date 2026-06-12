import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { USER_ROLES } from '@/lib/user-roles'
import { z } from 'zod'

const userSchema = z.object({
  code: z
    .string()
    .min(6, 'El código debe tener al menos 6 caracteres')
    .max(10, 'El código no puede tener más de 10 caracteres')
    .regex(/^[A-Za-z0-9]+$/, 'El código solo puede contener letras y números'),
  name: z.string().min(1, 'El nombre es requerido'),
  role: z.enum(USER_ROLES),
  isActive: z.boolean().optional(),
})

export async function GET() {
  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = userSchema.parse(body)

    const existing = await db.user.findUnique({ where: { code: data.code } })
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con ese código' },
        { status: 409 }
      )
    }

    const user = await db.user.create({
      data: {
        code: data.code,
        name: data.name,
        role: data.role,
        isActive: data.isActive ?? true,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos de usuario inválidos', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    )
  }
}
