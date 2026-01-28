import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const toolLoanSchema = z.object({
  toolId: z.string(),
  userId: z.string(),
  workerId: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET() {
  try {
    const loans = await db.toolLoan.findMany({
      include: {
        tool: { select: { name: true, barcode: true, category: true } },
        user: { select: { name: true } },
        worker: { select: { firstName: true, lastName: true } },
      },
      orderBy: { loanDate: 'desc' },
    })

    return NextResponse.json(loans)
  } catch (error) {
    console.error('Error fetching tool loans:', error)
    return NextResponse.json(
      { error: 'Error al obtener préstamos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = toolLoanSchema.parse(body)

    // Check if tool is available
    const tool = await db.tool.findUnique({
      where: { id: data.toolId },
    })

    if (!tool) {
      return NextResponse.json(
        { error: 'Herramienta no encontrada' },
        { status: 404 }
      )
    }

    if (tool.status !== 'available') {
      return NextResponse.json(
        { error: 'Herramienta no está disponible' },
        { status: 400 }
      )
    }

    // Create loan and update tool status
    const loan = await db.toolLoan.create({
      data: {
        ...data,
        loanDate: new Date(),
      },
    })

    await db.tool.update({
      where: { id: data.toolId },
      data: { status: 'in_use' },
    })

    return NextResponse.json(loan, { status: 201 })
  } catch (error) {
    console.error('Error creating tool loan:', error)
    return NextResponse.json(
      { error: 'Error al crear préstamo' },
      { status: 500 }
    )
  }
}
