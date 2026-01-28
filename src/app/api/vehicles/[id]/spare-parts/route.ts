import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const sparePartSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  quantity: z.number().min(0),
  unitPrice: z.number().optional(),
  purchaseDate: z.string().optional(),
  invoicePhoto: z.string().optional(),
  supplier: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const spareParts = await db.vehicleSparePart.findMany({
      where: { vehicleId: params.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(spareParts)
  } catch (error) {
    console.error('Error fetching spare parts:', error)
    return NextResponse.json(
      { error: 'Error al obtener repuestos' },
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
    const data = sparePartSchema.parse(body)

    const sparePart = await db.vehicleSparePart.create({
      data: {
        ...data,
        vehicleId: id,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      },
    })

    return NextResponse.json(sparePart, { status: 201 })
  } catch (error) {
    console.error('Error creating spare part:', error)
    return NextResponse.json(
      { error: 'Error al crear repuesto' },
      { status: 500 }
    )
  }
}
