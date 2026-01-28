import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const loanSchema = z.object({
  workerId: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const loans = await db.toolLoan.findMany({
      where: { toolId: id },
      include: { worker: true, user: true },
      orderBy: { loanDate: 'desc' },
    })

    return NextResponse.json(loans)
  } catch (error) {
    console.error('Error fetching loans:', error)
    return NextResponse.json(
      { error: 'Error al obtener préstamos' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId } = body
    const data = loanSchema.parse(body)

    const loan = await db.toolLoan.create({
      data: {
        toolId: id,
        userId,
        workerId: data.workerId,
        notes: data.notes,
      },
    })

    await db.tool.update({
      where: { id },
      data: { status: 'in_use' },
    })

    return NextResponse.json(loan, { status: 201 })
  } catch (error) {
    console.error('Error creating loan:', error)
    return NextResponse.json(
      { error: 'Error al crear préstamo' },
      { status: 500 }
    )
  }
}
