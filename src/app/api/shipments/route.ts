import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const shipmentSchema = z.object({
  vehicleId: z.string(),
  driverId: z.string().optional(),
  projectId: z.string().optional(),
  userId: z.string(),
  notes: z.string().optional(),
  items: z.array(z.object({
    materialName: z.string().min(1),
    sentQuantity: z.number().min(0),
    unit: z.string().default('unidad'),
  })).min(1),
})

export async function GET() {
  try {
    const shipments = await db.shipment.findMany({
      include: {
        items: true,
        vehicle: { select: { name: true, plate: true } },
        driver: { select: { firstName: true, lastName: true } },
        project: { select: { name: true, code: true } },
        user: { select: { name: true } },
      },
      orderBy: { shipmentDate: 'desc' },
    })

    return NextResponse.json(shipments)
  } catch (error) {
    console.error('Error fetching shipments:', error)
    return NextResponse.json(
      { error: 'Error al obtener envíos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, ...rest } = shipmentSchema.parse(body)

    const shipment = await db.shipment.create({
      data: {
        ...rest,
        shipmentDate: new Date(),
        items: {
          create: items,
        },
      },
      include: {
        items: true,
      },
    })

    return NextResponse.json(shipment, { status: 201 })
  } catch (error) {
    console.error('Error creating shipment:', error)
    return NextResponse.json(
      { error: 'Error al crear envío' },
      { status: 500 }
    )
  }
}
