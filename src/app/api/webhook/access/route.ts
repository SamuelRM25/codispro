import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// API que recibe los eventos de "Acceso Concedido" de la terminal HikVision (vía ISAPI o webhooks configurados)
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Data format depends on the specific HikVision pushing format.
    // Example: { "workerId": "123", "door": "Almacen Central", "status": "success" }
    
    // We try to match the workerId from Hikvision to our Worker model in Codispro
    const workerId = data.workerId;
    let internalWorkerId: string | null = null;

    if (workerId) {
      const worker = await db.worker.findFirst({
        where: { OR: [ { id: workerId }, { hikvisionId: workerId } ] }
      });
      if (worker) {
        internalWorkerId = worker.id;
      }
    }

    const accessLog = await db.accessLog.create({
      data: {
        workerId: internalWorkerId,
        doorName: data.door || "Terminal HikVision",
        status: data.status || "success",
      }
    });

    return NextResponse.json({ success: true, logId: accessLog.id }, { status: 201 });
  } catch (error: any) {
    console.error("Error procesando Webhook de HikVision:", error);
    return NextResponse.json(
      { error: "Error interno al procesar webhook" },
      { status: 500 }
    );
  }
}
