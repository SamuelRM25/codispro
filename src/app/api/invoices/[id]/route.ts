import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const invoice = await db.invoice.findUnique({
      where: { id: params.id },
      include: {
        company: true,
        client: true,
        items: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      { error: "Error al obtener factura" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const invoice = await db.invoice.findUnique({
      where: { id: params.id },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
    }

    if (invoice.status === "issued") {
      return NextResponse.json({ error: "No se puede eliminar una factura certificada. Debe ser anulada." }, { status: 400 });
    }

    await db.invoice.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json(
      { error: "Error al eliminar factura" },
      { status: 500 }
    );
  }
}
