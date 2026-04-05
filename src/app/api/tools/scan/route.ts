import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { barcode, action, workerId, userId } = data;

    if (!barcode || !action) {
      return NextResponse.json({ error: "El código de barras y la acción son obligatorios" }, { status: 400 });
    }

    // Buscar Herramienta
    const tool = await db.tool.findUnique({
      where: { barcode },
    });

    if (!tool) {
      return NextResponse.json({ error: "Herramienta no encontrada en la base de datos" }, { status: 404 });
    }

    if (action === "CHECKOUT") {
      if (tool.status === "in_use") {
        return NextResponse.json({ error: "Esta herramienta ya fue prestada y no ha sido devuelta." }, { status: 400 });
      }

      // Prestar herramienta
      await db.$transaction([
        db.toolLoan.create({
          data: {
            toolId: tool.id,
            workerId: workerId || null,
            userId: userId || "sistema", // Aquí debería venir del token de sesión
            notes: "Asignación rápida por escáner QR/Barras",
          },
        }),
        db.tool.update({
          where: { id: tool.id },
          data: { status: "in_use" },
        }),
      ]);

      return NextResponse.json({ success: true, message: "Herramienta prestada con éxito", tool });
    } 
    
    if (action === "RETURN") {
      if (tool.status !== "in_use") {
        return NextResponse.json({ error: "Esta herramienta ya figura como disponible." }, { status: 400 });
      }

      // Localizar el préstamo activo
      const activeLoan = await db.toolLoan.findFirst({
        where: { toolId: tool.id, returnDate: null },
        orderBy: { loanDate: 'desc' },
      });

      if (!activeLoan) {
         // Auto corrección si no hay historial
         await db.tool.update({
          where: { id: tool.id },
          data: { status: "available" },
        });
        return NextResponse.json({ success: true, message: "Estado de la herramienta corregido a disponible.", tool });
      }

      // Devolver herramienta
      await db.$transaction([
        db.toolLoan.update({
          where: { id: activeLoan.id },
          data: { returnDate: new Date() },
        }),
        db.tool.update({
          where: { id: tool.id },
          data: { status: "available" },
        }),
      ]);

      return NextResponse.json({ success: true, message: "Herramienta devuelta con éxito", tool });
    }

    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });

  } catch (error: any) {
    console.error("Error procesando escáner:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al escanear" },
      { status: 500 }
    );
  }
}
