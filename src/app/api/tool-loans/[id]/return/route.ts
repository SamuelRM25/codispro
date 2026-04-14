import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const loan = await db.toolLoan.findUnique({ where: { id } })
    if (!loan) {
      return NextResponse.json({ error: 'Préstamo no encontrado' }, { status: 404 })
    }

    // Mark as returned
    await db.toolLoan.update({
      where: { id },
      data: { returnDate: new Date() },
    })

    // Mark tool as available again
    await db.tool.update({
      where: { id: loan.toolId },
      data: { status: 'available' },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error returning tool:', error)
    return NextResponse.json({ error: 'Error al registrar devolución' }, { status: 500 })
  }
}
