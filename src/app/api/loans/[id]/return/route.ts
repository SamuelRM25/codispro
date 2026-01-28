import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const loan = await db.toolLoan.update({
      where: { id },
      data: { returnDate: new Date() },
      include: { tool: true },
    })

    await db.tool.update({
      where: { id: loan.toolId },
      data: { status: 'available' },
    })

    return NextResponse.json(loan)
  } catch (error) {
    console.error('Error returning tool:', error)
    return NextResponse.json(
      { error: 'Error al devolver herramienta' },
      { status: 500 }
    )
  }
}
