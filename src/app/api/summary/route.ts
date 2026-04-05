import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { endOfDay, startOfDay } from "date-fns";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    const dateFilter = {
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      }
    };

    const toolLoans = await db.toolLoan.findMany({
      where: dateFilter,
      include: { tool: true, user: true, worker: true },
      orderBy: { createdAt: 'desc' }
    });

    const pettyCash = await db.pettyCash.findMany({
      where: dateFilter,
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    });

    const shipments = await db.shipment.findMany({
      where: dateFilter,
      include: { user: true, vehicle: true, driver: true },
      orderBy: { createdAt: 'desc' }
    });

    const invoices = await db.invoice.findMany({
      where: dateFilter,
      include: { client: true, creator: true },
      orderBy: { createdAt: 'desc' }
    });

    // Accesos (Hikvision)
    const accessLogs = await db.accessLog.findMany({
      where: { timestamp: { gte: todayStart, lte: todayEnd } },
      include: { worker: true },
      orderBy: { timestamp: 'desc' }
    });

    return NextResponse.json({
      toolLoans, 
      pettyCash, 
      shipments, 
      invoices,
      accessLogs
    });
  } catch (error: any) {
    console.error("Error al obtener el resumen:", error);
    return NextResponse.json({ error: "Error al obtener resumen" }, { status: 500 });
  }
}
