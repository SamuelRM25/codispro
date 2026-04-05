import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const invoices = await db.invoice.findMany({
      include: {
        company: true,
        client: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Error al obtener las facturas" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // For MVP we assume userId is passed or mock it if not using full auth here.
    // In a real scenario, extract from NextAuth session.
    const userId = data.userId || "mock-user-id"; 

    // Calculate totals
    const subTotal = data.items.reduce((acc: number, item: any) => acc + (item.unitPrice * item.quantity), 0);
    const tax = subTotal * 0.12; // Assuming 12% IVA for GT
    const total = subTotal + tax;

    let clientId = data.clientId;
    
    // Si no viene clientId pero sí datos del cliente, lo creamos/buscamos
    if (!clientId && data.clientNit) {
      const existingClient = await db.client.findUnique({
        where: { nit: data.clientNit }
      });
      
      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const newClient = await db.client.create({
          data: {
            nit: data.clientNit,
            name: data.clientName,
            address: data.clientAddress || "",
            email: data.clientEmail || "",
          }
        });
        clientId = newClient.id;
      }
    }

    let finalCompanyId = data.companyId || null;
    if (finalCompanyId) {
      const existingCompany = await db.company.findUnique({ where: { id: finalCompanyId } });
      if (!existingCompany) finalCompanyId = null;
    }

    const invoice = await db.invoice.create({
      data: {
        companyId: finalCompanyId,
        clientId: clientId,
        userId: userId,
        projectId: data.projectId || null,
        invoiceType: data.invoiceType || "ISSUED",
        subTotal,
        tax,
        total,
        status: data.invoiceType === "RECEIVED" ? "issued" : "draft",
        items: {
          create: data.items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.unitPrice * item.quantity,
          })),
        },
      },
      include: {
        items: true,
        client: true,
      }
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Error al crear la factura borrador", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
