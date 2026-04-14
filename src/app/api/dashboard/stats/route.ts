import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const safeCount = async (model: any, where = {}) => {
      try { return await model.count({ where }); } catch (e) { console.error(`Count failed for model`, e); return 0; }
    }

    // Get all counts with fallbacks
    const [workersCount, toolsCount, vehiclesCount, projectsCount, shipmentsCount] = await Promise.all([
      safeCount(db.worker, { isActive: true }),
      safeCount(db.tool),
      safeCount(db.vehicle),
      safeCount(db.project),
      safeCount(db.shipment),
    ])

    // Get tools status with fallbacks
    const [availableTools, inUseTools] = await Promise.all([
      safeCount(db.tool, { status: 'available' }),
      safeCount(db.tool, { status: 'in_use' }),
    ])

    // Get projects by status with fallback
    let projectsByStatus = []
    try {
      projectsByStatus = await db.project.groupBy({ by: ['status'], _count: true })
    } catch (e) { console.error('Projects groupBy failed', e); }

    // Get vehicles by status with fallback
    let vehiclesByStatus = []
    try {
      vehiclesByStatus = await db.vehicle.groupBy({ by: ['status'], _count: true })
    } catch (e) { console.error('Vehicles groupBy failed', e); }

    // Get petty cash summary with fallbacks
    const getSum = async (type: string) => {
      try {
        const res = await db.pettyCash.aggregate({ where: { type }, _sum: { amount: true } })
        return res._sum.amount || 0
      } catch (e) { return 0; }
    }

    const [pettyCashIncome, pettyCashExpense] = await Promise.all([
      getSum('income'),
      getSum('expense')
    ])

    // Get recent shipments with fallback
    let recentShipments = []
    try {
      recentShipments = await db.shipment.findMany({
        take: 10,
        orderBy: { shipmentDate: 'desc' },
        include: {
          vehicle: { select: { name: true, plate: true } },
          driver: { select: { firstName: true, lastName: true } },
        },
      })
    } catch (e) { console.error('Shipments findMany failed', e); }

    // Get tools not returned with fallback
    let overdueToolLoans = []
    try {
      overdueToolLoans = await db.toolLoan.findMany({
        where: { returnDate: null },
        include: {
          tool: { select: { name: true } },
          worker: { select: { firstName: true, lastName: true } },
        },
        orderBy: { loanDate: 'desc' },
        take: 10,
      })
    } catch (e) { console.error('ToolLoans findMany failed', e); }

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
      projects: projectsByStatus.reduce((acc: any, item: any) => {
        acc[item.status] = item._count
        return acc
      }, {} as Record<string, number>),
      vehicles: vehiclesByStatus.reduce((acc: any, item: any) => {
        acc[item.status] = item._count
        return acc
      }, {} as Record<string, number>),
      pettyCash: {
        income: pettyCashIncome,
        expense: pettyCashExpense,
        balance: pettyCashIncome - pettyCashExpense,
      },
      recentShipments,
      overdueToolLoans,
    })
  } catch (error) {
    console.error('Fatal error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas del dashboard' },
      { status: 500 }
    )
  }
}
