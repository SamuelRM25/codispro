import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const verifySchema = z.object({
  userId: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = verifySchema.parse(body)

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        code: true,
        name: true,
        role: true,
        isActive: true,
      },
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json(
      { error: 'Error al verificar sesión' },
      { status: 500 }
    )
  }
}
