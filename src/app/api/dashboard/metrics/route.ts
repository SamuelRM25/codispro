import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get current date
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())

    // Parallel queries for performance
    const [
      totalWorkers,
      activeWorkers,
      totalTools,
      toolsInUse,
      toolsAvailable,
      totalVehicles,
      vehiclesInUse,
      vehiclesAvailable,
      totalProjects,
      activeProjects,
      completedProjects,
      totalShipments,
      pendingShipments,
      completedShipments,
      recentTransactions,
      overdueTools,
      workersCount,
      toolsCount,
      vehiclesCount,
      projectsCount,
    ] = await Promise.all([
      db.worker.count(),
      db.worker.count({ where: { isActive: true } }),
      db.tool.count(),
      db.tool.count({ where: { status: 'in_use' } }),
      db.tool.count({ where: { status: 'available' } }),
      db.vehicle.count(),
      db.vehicle.count({ where: { status: 'in_use' } }),
      db.vehicle.count({ where: { status: 'available' } }),
      db.project.count(),
      db.project.count({ where: { status: 'active' } }),
      db.project.count({ where: { status: 'completed' } }),
      db.shipment.count(),
      db.shipment.count({ where: { status: 'pending' } }),
      db.shipment.count({ where: { status: 'received' } }),
      db.pettyCash.count({ where: { date: { gte: startOfMonth } } }),
      db.toolLoan.findMany({
        where: {
          returnDate: null,
          loanDate: {
            lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) // Over 24 hours
          }
        },
        include: { tool: true, worker: true }
      }),
      db.worker.count({ where: { createdAt: { gte: startOfWeek } } }),
      db.tool.count({ where: { createdAt: { gte: startOfWeek } } }),
      db.vehicle.count({ where: { createdAt: { gte: startOfWeek } } }),
      db.project.count({ where: { createdAt: { gte: startOfWeek } } }),
    ])

    // Financial data for this month
    const monthTransactions = await db.pettyCash.findMany({
      where: { date: { gte: startOfMonth } },
      orderBy: { date: 'asc' }
    })

    const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)

    // Get project progress data
    const projects = await db.project.findMany({
      select: {
        name: true,
        progress: true,
        status: true,
        budget: true,
      }
    })

    // Get recent shipments
    const recentShipments = await db.shipment.findMany({
      take: 10,
      orderBy: { shipmentDate: 'desc' },
      include: {
        vehicle: { select: { plate: true, name: true } },
        project: { select: { name: true } },
      }
    })

    return NextResponse.json({
      summary: {
        totalWorkers,
        activeWorkers,
        totalTools,
        toolsInUse,
        toolsAvailable,
        totalVehicles,
        vehiclesInUse,
        vehiclesAvailable,
        totalProjects,
        activeProjects,
        completedProjects,
        totalShipments,
        pendingShipments,
        completedShipments,
      },
      financial: {
        income,
        expenses,
        balance: income - expenses,
        transactionCount: monthTransactions.length,
      },
      alerts: {
        overdueTools: overdueTools.length,
        pendingShipments,
      },
      weeklyGrowth: {
        workers: workersCount,
        tools: toolsCount,
        vehicles: vehiclesCount,
        projects: projectsCount,
      },
      projectProgress: projects,
      recentShipments,
      overdueTools,
    })
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    return NextResponse.json(
      { error: 'Error al obtener métricas' },
      { status: 500 }
    )
  }
}
