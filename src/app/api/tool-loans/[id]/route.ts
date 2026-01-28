import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { returnDate, notes } = body

    const loan = await db.toolLoan.update({
      where: { id },
      data: {
        returnDate: returnDate ? new Date(returnDate) : new Date(),
        notes,
      },
    })

    // Update tool status back to available
    await db.tool.update({
      where: { id: loan.toolId },
      data: { status: 'available' },
    })

    return NextResponse.json(loan)
  } catch (error: any) {
    console.error('Error returning tool:', error)
    return NextResponse.json(
      { error: `Error al devolver herramienta: ${error.message || 'Error desconocido'}` },
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
    await db.toolLoan.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tool loan:', error)
    return NextResponse.json(
      { error: 'Error al eliminar préstamo' },
      { status: 500 }
    )
  }
}
