import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { Prisma, UserRole } from '@prisma/client'
import { USER_ROLES } from '@/lib/user-roles'

const userUpdateSchema = z.object({
  code: z
    .string()
    .min(6, 'El código debe tener al menos 6 caracteres')
    .max(10, 'El código no puede tener más de 10 caracteres')
    .regex(/^[A-Za-z0-9]+$/, 'El código solo puede contener letras y números')
    .optional(),
  name: z.string().min(1, 'El nombre es requerido').optional(),
  role: z.enum(USER_ROLES).optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await db.user.findUnique({ where: { id } })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Error al obtener usuario' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    const body = await request.json()
    const data = userUpdateSchema.parse(body)

    if (session?.user?.id === id && data.isActive === false) {
      return NextResponse.json(
        { error: 'No puedes desactivar tu propia cuenta' },
        { status: 403 }
      )
    }

    if (data.code) {
      const existing = await db.user.findFirst({
        where: { code: data.code, NOT: { id } },
      })
      if (existing) {
        return NextResponse.json(
          { error: 'Ya existe un usuario con ese código' },
          { status: 409 }
        )
      }
    }

    const user = await db.user.update({
      where: { id },
      data: {
        ...(data.code !== undefined && { code: data.code }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.role !== undefined && { role: data.role as UserRole }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos de usuario inválidos', details: error.issues },
        { status: 400 }
      )
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    const force = request.nextUrl.searchParams.get('force') === 'true'

    if (session?.user?.id === id) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia cuenta' },
        { status: 403 }
      )
    }

    const user = await db.user.findUnique({ where: { id } })
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    if (user.isActive && !force) {
      return NextResponse.json(
        { error: 'El usuario debe estar desactivado antes de eliminarse' },
        { status: 409 }
      )
    }

    if (user.isActive && force) {
      await db.user.update({
        where: { id },
        data: { isActive: false },
      })
    }

    try {
      await db.user.delete({ where: { id } })
      return NextResponse.json({ success: true })
    } catch (deleteError) {
      if (
        deleteError instanceof Prisma.PrismaClientKnownRequestError &&
        deleteError.code === 'P2003'
      ) {
        return NextResponse.json(
          {
            error:
              'No se puede eliminar: el usuario tiene registros históricos (préstamos, facturas, viajes, etc.). Quedará desactivado.',
          },
          { status: 409 }
        )
      }
      throw deleteError
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Error al eliminar usuario' },
      { status: 500 }
    )
  }
}
