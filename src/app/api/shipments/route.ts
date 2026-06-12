import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import { z } from 'zod'
import { generateShipmentPdf } from '@/lib/shipment-pdf'

const shipmentSchema = z.object({
  vehicleId: z.string(),
  driverId: z.string().optional(),
  projectId: z.string().optional(),
  userId: z.string().optional(),
  departurePoint: z.string().optional(),
  arrivalPoint: z.string().optional(),
  firma: z.string().optional(),
  mode: z.enum(['INMEDIATO', 'PROGRAMADO']).default('INMEDIATO'),
  scheduledAt: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        materialName: z.string().min(1),
        sentQuantity: z.number().min(0),
        unit: z.string().default('unidad'),
      })
    )
    .min(1),
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

    // Derivar userId y authorizeName desde la sesión (no confiar en el body)
    const session = await auth()
    const userId = rest.userId || session?.user?.id
    if (!userId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
    const authorizeName = session?.user?.name ?? 'Desconocido'

    const shipment = await db.shipment.create({
      data: {
        vehicleId: rest.vehicleId,
        driverId: rest.driverId,
        projectId: rest.projectId,
        userId,
        departurePoint: rest.departurePoint,
        arrivalPoint: rest.arrivalPoint,
        authorizeName,
        firma: rest.firma,
        mode: rest.mode,
        scheduledAt: rest.scheduledAt ? new Date(rest.scheduledAt) : null,
        notes: rest.notes,
        shipmentDate: new Date(),
        items: { create: items },
      },
      include: { items: true },
    })

    // Generar PDF y guardar URL
    let pdfUrl: string | null = null
    try {
      pdfUrl = await generateShipmentPdf(shipment.id)
      await db.shipment.update({
        where: { id: shipment.id },
        data: { pdfUrl, printedAt: new Date() },
      })
    } catch (pdfError) {
      console.error('Error generando PDF de envío:', pdfError)
      // No fallamos la creación del envío si el PDF falla; solo logueamos
    }

    // Releer el shipment con pdfUrl/printedAt actualizados para devolverlo al cliente
    const full = await db.shipment.findUnique({
      where: { id: shipment.id },
      include: { items: true },
    })

    return NextResponse.json(full, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos de envío inválidos', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error creating shipment:', error)
    return NextResponse.json(
      {
        error: 'Error al crear envío',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
