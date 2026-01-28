import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const pettyCashSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().min(0),
  category: z.string().optional(),
  description: z.string().min(1),
  date: z.string(),
  userId: z.string(),
  projectId: z.string().optional(),
  receipt: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    const month = searchParams.get('month')
    const projectId = searchParams.get('projectId')

    const where: any = {}
    if (type) where.type = type
    if (month) {
      const date = new Date(`${month}-01`)
      const startDate = date
      const endDate = new Date(date)
      endDate.setMonth(endDate.getMonth() + 1)
      where.date = { gte: startDate, lt: endDate }
    }
    if (projectId) where.projectId = projectId

    const transactions = await db.pettyCash.findMany({
      where,
      include: {
        user: { select: { name: true } },
        project: { select: { name: true, code: true } },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Error fetching petty cash:', error)
    return NextResponse.json(
      { error: 'Error al obtener transacciones' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = pettyCashSchema.parse(body)

    const transaction = await db.pettyCash.create({
      data: {
        ...data,
        date: new Date(data.date),
      },
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error('Error creating petty cash transaction:', error)
    return NextResponse.json(
      { error: 'Error al crear transacción' },
      { status: 500 }
    )
  }
}
