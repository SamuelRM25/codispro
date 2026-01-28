import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const projectSchema = z.object({
  name: z.string().min(1),
  code: z.string(),
  description: z.string().optional(),
  address: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).default('planning'),
  budget: z.number().optional(),
  progress: z.number().min(0).max(100).default(0),
  client: z.string().optional(),
})

export async function GET() {
  try {
    const projects = await db.project.findMany({
      include: {
        staff: {
          include: {
            worker: { select: { firstName: true, lastName: true } },
          },
          where: { endDate: null },
        },
        shipments: {
          orderBy: { shipmentDate: 'desc' },
          take: 5,
        },
        pettyCash: {
          orderBy: { date: 'desc' },
          take: 5,
        },
        _count: {
          select: { staff: true, shipments: true, pettyCash: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Error al obtener proyectos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = projectSchema.parse(body)

    const project = await db.project.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Error al crear proyecto' },
      { status: 500 }
    )
  }
}
