import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - obtener préstamos no notificados (para admin)
export async function GET() {
  try {
    const loans = await db.toolLoan.findMany({
      where: { notified: false, returnDate: null },
      include: {
        tool: { select: { id: true, name: true, category: true, photo: true } },
        worker: { select: { firstName: true, lastName: true } },
        user: { select: { name: true } },
      },
      orderBy: { loanDate: 'desc' },
    })
    return NextResponse.json(loans)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Error al obtener notificaciones' }, { status: 500 })
  }
}

// PUT - marcar uno o todos como notificados
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, markAll } = body

    if (markAll) {
      await db.toolLoan.updateMany({
        where: { notified: false },
        data: { notified: true },
      })
    } else if (id) {
      await db.toolLoan.update({
        where: { id },
        data: { notified: true },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json({ error: 'Error al actualizar notificación' }, { status: 500 })
  }
}
