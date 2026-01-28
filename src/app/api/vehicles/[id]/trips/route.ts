import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const tripSchema = z.object({
  userId: z.string(),
  startDate: z.string(),
  origin: z.string().optional(),
  destination: z.string().optional(),
  distance: z.number().optional(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const trips = await db.vehicleTrip.findMany({
      where: { vehicleId: params.id },
      include: { user: true },
      orderBy: { startDate: 'desc' },
    })

    return NextResponse.json(trips)
  } catch (error) {
    console.error('Error fetching trips:', error)
    return NextResponse.json(
      { error: 'Error al obtener viajes' },
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
    const data = tripSchema.parse(body)

    const trip = await db.vehicleTrip.create({
      data: {
        ...data,
        vehicleId: id,
        startDate: new Date(data.startDate),
      },
    })

    await db.vehicle.update({
      where: { id: id },
      data: { status: 'in_use' },
    })

    return NextResponse.json(trip, { status: 201 })
  } catch (error) {
    console.error('Error creating trip:', error)
    return NextResponse.json(
      { error: 'Error al crear viaje' },
      { status: 500 }
    )
  }
}
