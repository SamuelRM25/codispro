import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const toolSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  barcode: z.string().optional(),
  photo: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['available', 'in_use', 'maintenance', 'retired']).default('available'),
  location: z.string().optional(),
})

export async function GET() {
  try {
    const tools = await db.tool.findMany({
      include: {
        loans: {
          where: { returnDate: null },
          include: {
            worker: { select: { firstName: true, lastName: true } },
          },
          orderBy: { loanDate: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(tools)
  } catch (error) {
    console.error('Error fetching tools:', error)
    return NextResponse.json(
      { error: 'Error al obtener herramientas' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = toolSchema.parse(body)

    const tool = await db.tool.create({
      data,
    })

    return NextResponse.json(tool, { status: 201 })
  } catch (error) {
    console.error('Error creating tool:', error)
    return NextResponse.json(
      { error: 'Error al crear herramienta' },
      { status: 500 }
    )
  }
}
