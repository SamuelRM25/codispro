import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    const existingAdmin = await db.user.findUnique({
      where: { code: 'ADMIN' },
    })

    if (!existingAdmin) {
      const admin = await db.user.create({
        data: {
          code: 'ADMIN',
          name: 'Administrador',
          role: 'admin',
          isActive: true,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Usuario admin creado con éxito',
        admin: {
          code: admin.code,
          name: admin.name,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'El usuario admin ya existe',
      admin: {
        code: existingAdmin.code,
        name: existingAdmin.name,
      },
    })
  } catch (error) {
    console.error('Error seeding admin:', error)
    return NextResponse.json(
      { error: 'Error al crear usuario admin' },
      { status: 500 }
    )
  }
}
