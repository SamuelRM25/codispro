import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7)
    const year = parseInt(month.split('-')[0])
    const monthNum = parseInt(month.split('-')[1])

    // Start and end of the month
    const startDate = new Date(year, monthNum - 1, 1)
    const endDate = new Date(year, monthNum, 0, 23, 59, 59)

    // Fetch all activities for the month
    const [toolLoans, vehicleTrips, shipments, pettyCash, projects] = await Promise.all([
      db.toolLoan.findMany({
        where: {
          OR: [
            { loanDate: { gte: startDate, lte: endDate } },
            { returnDate: { gte: startDate, lte: endDate } },
          ],
        },
        include: {
          tool: { select: { name: true, category: true } },
          worker: { select: { firstName: true, lastName: true } },
        },
      }),
      db.vehicleTrip.findMany({
        where: {
          OR: [
            { startDate: { gte: startDate, lte: endDate } },
            { endDate: { gte: startDate, lte: endDate } },
          ],
        },
        include: {
          vehicle: { select: { name: true, plate: true } },
          user: { select: { name: true } },
        },
      }),
      db.shipment.findMany({
        where: {
          shipmentDate: { gte: startDate, lte: endDate },
        },
        include: {
          vehicle: { select: { name: true, plate: true } },
          driver: { select: { firstName: true, lastName: true } },
          project: { select: { name: true, code: true } },
        },
      }),
      db.pettyCash.findMany({
        where: {
          date: { gte: startDate, lte: endDate },
        },
        include: {
          user: { select: { name: true } },
          project: { select: { name: true, code: true } },
        },
      }),
      db.project.findMany({
        where: {
          OR: [
            { startDate: { gte: startDate, lte: endDate } },
            { endDate: { gte: startDate, lte: endDate } },
          ],
        },
      }),
    ])

    // Format events for calendar
    const events = [
      ...toolLoans.map((loan: any) => ({
        id: `tool-loan-${loan.id}`,
        title: `Préstamo: ${loan.tool.name}`,
        type: 'tool-loan',
        date: loan.loanDate,
        endDate: loan.returnDate,
        description: `Préstado a: ${loan.worker.firstName} ${loan.worker.lastName}`,
        color: 'bg-orange-500',
      })),
      ...vehicleTrips.map((trip: any) => ({
        id: `vehicle-trip-${trip.id}`,
        title: `Viaje: ${trip.vehicle.name}`,
        type: 'vehicle-trip',
        date: trip.startDate,
        endDate: trip.endDate,
        description: `${trip.origin} → ${trip.destination}`,
        color: 'bg-green-500',
      })),
      ...shipments.map((shipment: any) => ({
        id: `shipment-${shipment.id}`,
        title: `Envío: ${shipment.materialName}`,
        type: 'shipment',
        date: shipment.shipmentDate,
        endDate: shipment.receivedDate,
        description: `A ${shipment.project?.name || 'Sin proyecto'} - ${shipment.vehicle.name}`,
        color: 'bg-blue-500',
      })),
      ...pettyCash.map((tx: any) => ({
        id: `petty-cash-${tx.id}`,
        title: `${tx.type === 'income' ? 'Ingreso' : 'Egreso'}: Q${tx.amount.toFixed(2)}`,
        type: 'petty-cash',
        date: tx.date,
        description: `${tx.description}${tx.project ? ` (${tx.project.name})` : ''}`,
        color: tx.type === 'income' ? 'bg-green-500' : 'bg-red-500',
      })),
      ...projects.map((project: any) => ({
        id: `project-start-${project.id}`,
        title: `Inicio: ${project.name}`,
        type: 'project',
        date: project.startDate,
        description: `Código: ${project.code}`,
        color: 'bg-purple-500',
      })),
    ]

    return NextResponse.json({
      events,
      month,
      stats: {
        toolLoans: toolLoans.length,
        vehicleTrips: vehicleTrips.length,
        shipments: shipments.length,
        pettyCash: pettyCash.length,
      },
    })
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    return NextResponse.json(
      { error: 'Error al obtener eventos del calendario' },
      { status: 500 }
    )
  }
}
