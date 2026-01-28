import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const shipmentUpdateSchema = z.object({
  receivedDate: z.string(),
  notes: z.string().optional(),
  items: z.array(z.object({
    id: z.string(),
    receivedQuantity: z.number().min(0),
  })),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = shipmentUpdateSchema.parse(body)

    // Get current shipment with items
    const currentShipment = await db.shipment.findUnique({
      where: { id },
      include: { items: true }
    })

    if (!currentShipment) {
      return NextResponse.json(
        { error: 'Envío no encontrado' },
        { status: 404 }
      )
    }

    // Determine status based on all items matching
    let hasDiscrepancy = false
    const itemUpdates = data.items.map(update => {
      const original = currentShipment.items.find(i => i.id === update.id)
      if (original && original.sentQuantity !== update.receivedQuantity) {
        hasDiscrepancy = true
      }
      return db.shipmentItem.update({
        where: { id: update.id },
        data: { receivedQuantity: update.receivedQuantity }
      })
    })

    const finalStatus = hasDiscrepancy ? 'discrepancy' : 'received'

    const shipment = await db.shipment.update({
      where: { id },
      data: {
        receivedDate: new Date(data.receivedDate),
        status: finalStatus,
        notes: data.notes,
      },
    })

    // Execute item updates
    await Promise.all(itemUpdates)

    return NextResponse.json(shipment)
  } catch (error) {
    console.error('Error updating shipment:', error)
    return NextResponse.json(
      { error: 'Error al actualizar envío' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.shipment.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting shipment:', error)
    return NextResponse.json(
      { error: 'Error al eliminar envío' },
      { status: 500 }
    )
  }
}
