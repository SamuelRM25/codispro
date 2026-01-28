import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [
      users,
      workers,
      tools,
      toolLoans,
      vehicles,
      vehicleTrips,
      vehicleSpareParts,
      shipments,
      shipmentItems,
      pettyCash,
      projects,
      projectStaff,
      projectExpenses,
      payrollEntries,
      locationLogs,
    ] = await Promise.all([
      db.user.findMany(),
      db.worker.findMany(),
      db.tool.findMany(),
      db.toolLoan.findMany(),
      db.vehicle.findMany(),
      db.vehicleTrip.findMany(),
      db.vehicleSparePart.findMany(),
      db.shipment.findMany(),
      db.shipmentItem.findMany(),
      db.pettyCash.findMany(),
      db.project.findMany(),
      db.projectStaff.findMany(),
      db.projectExpense.findMany(),
      db.payrollEntry.findMany(),
      db.locationLog.findMany(),
    ])

    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      database: 'constructora-pro',
      data: {
        users,
        workers,
        tools,
        toolLoans,
        vehicles,
        vehicleTrips,
        vehicleSpareParts,
        shipments,
        shipmentItems,
        pettyCash,
        projects,
        projectStaff,
        projectExpenses,
        payrollEntries,
        locationLogs,
      },
      stats: {
        users: users.length,
        workers: workers.length,
        tools: tools.length,
        toolLoans: toolLoans.length,
        vehicles: vehicles.length,
        vehicleTrips: vehicleTrips.length,
        vehicleSpareParts: vehicleSpareParts.length,
        shipments: shipments.length,
        shipmentItems: shipmentItems.length,
        pettyCash: pettyCash.length,
        projects: projects.length,
        projectStaff: projectStaff.length,
        projectExpenses: projectExpenses.length,
        payrollEntries: payrollEntries.length,
        locationLogs: locationLogs.length,
      },
    }

    return NextResponse.json(backup)
  } catch (error) {
    console.error('Error creating backup:', error)
    return NextResponse.json(
      { error: 'Error al crear backup' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    if (action === 'restore') {
      return restoreBackup(data)
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (error) {
    console.error('Error processing backup action:', error)
    return NextResponse.json(
      { error: 'Error al procesar acción' },
      { status: 500 }
    )
  }
}

async function restoreBackup(backup: any) {
  try {
    const { version, timestamp, database, data } = backup

    if (database !== 'constructora-pro') {
      return NextResponse.json(
        { error: 'Backup inválido: base de datos incorrecta' },
        { status: 400 }
      )
    }

    await db.$transaction(async (tx) => {
      await tx.toolLoan.deleteMany({})
      await tx.locationLog.deleteMany({})
      await tx.payrollEntry.deleteMany({})
      await tx.projectExpense.deleteMany({})
      await tx.projectStaff.deleteMany({})
      await tx.pettyCash.deleteMany({})
      await tx.shipmentItem.deleteMany({})
      await tx.shipment.deleteMany({})
      await tx.vehicleSparePart.deleteMany({})
      await tx.vehicleTrip.deleteMany({})
      await tx.vehicle.deleteMany({})
      await tx.tool.deleteMany({})
      await tx.project.deleteMany({})
      await tx.worker.deleteMany({})
      await tx.user.deleteMany({})
    })

    await db.$transaction(async (tx) => {
      if (data.users?.length > 0) {
        await tx.user.createMany({ data: data.users, skipDuplicates: true })
      }
      if (data.workers?.length > 0) {
        await tx.worker.createMany({ data: data.workers, skipDuplicates: true })
      }
      if (data.tools?.length > 0) {
        await tx.tool.createMany({ data: data.tools, skipDuplicates: true })
      }
      if (data.toolLoans?.length > 0) {
        await tx.toolLoan.createMany({ data: data.toolLoans, skipDuplicates: true })
      }
      if (data.vehicles?.length > 0) {
        await tx.vehicle.createMany({ data: data.vehicles, skipDuplicates: true })
      }
      if (data.vehicleTrips?.length > 0) {
        await tx.vehicleTrip.createMany({ data: data.vehicleTrips, skipDuplicates: true })
      }
      if (data.vehicleSpareParts?.length > 0) {
        await tx.vehicleSparePart.createMany({ data: data.vehicleSpareParts, skipDuplicates: true })
      }
      if (data.shipments?.length > 0) {
        await tx.shipment.createMany({ data: data.shipments, skipDuplicates: true })
      }
      if (data.shipmentItems?.length > 0) {
        await tx.shipmentItem.createMany({ data: data.shipmentItems, skipDuplicates: true })
      }
      if (data.pettyCash?.length > 0) {
        await tx.pettyCash.createMany({ data: data.pettyCash, skipDuplicates: true })
      }
      if (data.projects?.length > 0) {
        await tx.project.createMany({ data: data.projects, skipDuplicates: true })
      }
      if (data.projectStaff?.length > 0) {
        await tx.projectStaff.createMany({ data: data.projectStaff, skipDuplicates: true })
      }
      if (data.projectExpenses?.length > 0) {
        await tx.projectExpense.createMany({ data: data.projectExpenses, skipDuplicates: true })
      }
      if (data.payrollEntries?.length > 0) {
        await tx.payrollEntry.createMany({ data: data.payrollEntries, skipDuplicates: true })
      }
      if (data.locationLogs?.length > 0) {
        await tx.locationLog.createMany({ data: data.locationLogs, skipDuplicates: true })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Backup restaurado exitosamente',
      restoredAt: new Date().toISOString(),
      stats: {
        users: data.users?.length || 0,
        workers: data.workers?.length || 0,
        tools: data.tools?.length || 0,
        vehicles: data.vehicles?.length || 0,
        projects: data.projects?.length || 0,
      },
    })
  } catch (error) {
    console.error('Error restoring backup:', error)
    return NextResponse.json(
      { error: 'Error al restaurar backup' },
      { status: 500 }
    )
  }
}
