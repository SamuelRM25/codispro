import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const workerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dpi: z.string().optional(),
  photo: z.string().optional(),
  birthDate: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  position: z.string().optional(),
  hourlyRate: z.number().optional(),
})

export async function GET() {
  try {
    const workers = await db.worker.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(workers)
  } catch (error) {
    console.error('Error fetching workers:', error)
    return NextResponse.json(
      { error: 'Error al obtener trabajadores' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = workerSchema.parse(body)

    const worker = await db.worker.create({
      data: {
        ...data,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
      },
    })

    return NextResponse.json(worker, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos de trabajador inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating worker:', error)
    return NextResponse.json(
      { error: 'Error al crear trabajador' },
      { status: 500 }
    )
  }
}
