import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const vehicleSchema = z.object({
  name: z.string().min(1),
  plate: z.string(),
  type: z.enum(['truck', 'machine', 'van', 'car']),
  brand: z.string().optional(),
  model: z.string().optional(),
  year: z.number().optional(),
  color: z.string().optional(),
  photo: z.string().optional(),
  status: z.enum(['available', 'in_use', 'maintenance', 'retired']).default('available'),
  mileage: z.number().optional(),
  fuelType: z.string().optional(),
})

export async function GET() {
  try {
    const vehicles = await db.vehicle.findMany({
      where: { status: { not: 'retired' } },
      include: {
        trips: {
          orderBy: { startDate: 'desc' },
          take: 1,
        },
        spareParts: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(vehicles)
  } catch (error) {
    console.error('Error fetching vehicles:', error)
    return NextResponse.json(
      { error: 'Error al obtener vehículos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = vehicleSchema.parse(body)

    const vehicle = await db.vehicle.create({
      data,
    })

    return NextResponse.json(vehicle, { status: 201 })
  } catch (error) {
    console.error('Error creating vehicle:', error)
    return NextResponse.json(
      { error: 'Error al crear vehículo' },
      { status: 500 }
    )
  }
}
