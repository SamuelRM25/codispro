import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Check if test users already exist
    const existingUsers = await db.user.findMany({
      where: {
        code: {
          in: ['ADMIN001', 'GERENTE002', 'OBRERO003', 'SUPERVISOR004']
        }
      }
    })

    if (existingUsers.length > 0) {
      return NextResponse.json({
        message: 'Los usuarios de prueba ya existen',
        users: existingUsers.map(u => ({ code: u.code, name: u.name, role: u.role }))
      })
    }

    // Create test users
    const users = await db.user.createMany({
      data: [
        {
          code: 'ADMIN001',
          name: 'Administrador',
          role: 'admin',
          isActive: true,
        },
        {
          code: 'GERENTE002',
          name: 'Gerente General',
          role: 'manager',
          isActive: true,
        },
        {
          code: 'OBRERO003',
          name: 'Juan Pérez',
          role: 'worker',
          isActive: true,
        },
        {
          code: 'SUPERVISOR004',
          name: 'María López',
          role: 'manager',
          isActive: true,
        },
      ],
    })

    return NextResponse.json({
      message: 'Usuarios de prueba creados exitosamente',
      users: [
        { code: 'ADMIN001', name: 'Administrador', role: 'admin' },
        { code: 'GERENTE002', name: 'Gerente General', role: 'manager' },
        { code: 'OBRERO003', name: 'Juan Pérez', role: 'worker' },
        { code: 'SUPERVISOR004', name: 'María López', role: 'manager' },
      ],
      codes: ['ADMIN001', 'GERENTE002', 'OBRERO003', 'SUPERVISOR004']
    })
  } catch (error) {
    console.error('Error creating test users:', error)
    return NextResponse.json(
      { error: 'Error al crear usuarios de prueba' },
      { status: 500 }
    )
  }
}
