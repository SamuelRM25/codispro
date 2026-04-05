import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { certifyFactura, SatInvoicePayload } from "@/lib/sat-api";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const invoiceId = params.id;

    // Fetch the invoice with all necessary relations
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        company: true,
        client: true,
        items: true,
      },
    });

    if (!invoice || !invoice.company || !invoice.client) {
      return NextResponse.json({ error: "Factura, empresa o cliente no encontrado" }, { status: 404 });
    }

    if (invoice.status === "issued" && invoice.cae) {
      return NextResponse.json({ error: "Esta factura ya ha sido certificada" }, { status: 400 });
    }

    if (invoice.invoiceType === "RECEIVED") {
      return NextResponse.json({ error: "No puedes certificar a la SAT facturas recibidas de terceros. Solo las emitidas por ti." }, { status: 400 });
    }

    // Build the payload for the Certifier
    const satPayload: SatInvoicePayload = {
      companyNit: invoice.company.nit,
      clientNit: invoice.client.nit,
      clientName: invoice.client.name,
      clientAddress: invoice.client.address || "Ciudad",
      date: invoice.date,
      items: invoice.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
      subTotal: invoice.subTotal,
      tax: invoice.tax,
      total: invoice.total,
      currency: invoice.currency,
      felAlias: invoice.company.felAlias,
      felToken: invoice.company.felToken,
    };

    // Call the Certifier service
    const certifyResult = await certifyFactura(satPayload);

    if (!certifyResult.success) {
      return NextResponse.json(
        { error: "Error al certificar ante la SAT", details: certifyResult.error },
        { status: 500 }
      );
    }

    // Update the invoice with certification data
    const updatedInvoice = await db.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "issued",
        cae: certifyResult.cae,
        serie: certifyResult.serie,
        numero: certifyResult.numero,
        certDate: certifyResult.certDate,
        xmlUrl: certifyResult.xmlUrl,
        pdfUrl: certifyResult.pdfUrl,
      },
      include: {
        company: true,
        client: true,
      }
    });

    return NextResponse.json(updatedInvoice);
  } catch (error: any) {
    console.error("Error certificando factura:", error);
    return NextResponse.json(
      { error: "Error interno al procesar la certificación" },
      { status: 500 }
    );
  }
}
