import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get all counts
    const [workersCount, toolsCount, vehiclesCount, projectsCount, shipmentsCount] = await Promise.all([
      db.worker.count({ where: { isActive: true } }),
      db.tool.count(),
      db.vehicle.count(),
      db.project.count(),
      db.shipment.count(),
    ])

    // Get tools status
    const [availableTools, inUseTools] = await Promise.all([
      db.tool.count({ where: { status: 'available' } }),
      db.tool.count({ where: { status: 'in_use' } }),
    ])

    // Get projects by status
    const projectsByStatus = await db.project.groupBy({
      by: ['status'],
      _count: true,
    })

    // Get vehicles by status
    const vehiclesByStatus = await db.vehicle.groupBy({
      by: ['status'],
      _count: true,
    })

    // Get petty cash summary
    const pettyCashIncome = await db.pettyCash.aggregate({
      where: { type: 'income' },
      _sum: { amount: true },
    })

    const pettyCashExpense = await db.pettyCash.aggregate({
      where: { type: 'expense' },
      _sum: { amount: true },
    })

    // Get recent shipments
    const recentShipments = await db.shipment.findMany({
      take: 10,
      orderBy: { shipmentDate: 'desc' },
      include: {
        vehicle: { select: { name: true, plate: true } },
        driver: { select: { firstName: true, lastName: true } },
      },
    })

    // Get tools not returned (loans without return date)
    const overdueToolLoans = await db.toolLoan.findMany({
      where: { returnDate: null },
      include: {
        tool: { select: { name: true } },
        worker: { select: { firstName: true, lastName: true } },
      },
      orderBy: { loanDate: 'desc' },
      take: 10,
    })

    return NextResponse.json({
      counts: {
        workers: workersCount,
        tools: toolsCount,
        vehicles: vehiclesCount,
        projects: projectsCount,
        shipments: shipmentsCount,
      },
      tools: {
        available: availableTools,
        inUse: inUseTools,
      },
      projects: projectsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count
        return acc
      }, {} as Record<string, number>),
      vehicles: vehiclesByStatus.reduce((acc, item) => {
        acc[item.status] = item._count
        return acc
      }, {} as Record<string, number>),
      pettyCash: {
        income: pettyCashIncome._sum.amount || 0,
        expense: pettyCashExpense._sum.amount || 0,
        balance: (pettyCashIncome._sum.amount || 0) - (pettyCashExpense._sum.amount || 0),
      },
      recentShipments,
      overdueToolLoans,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}
