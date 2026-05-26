import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const terminals = await db.terminal.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(terminals);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, ip, port, username, password, serialNumber, model } = body;

    if (!serialNumber) {
      return NextResponse.json({ error: 'Número de serie es requerido' }, { status: 400 });
    }

    // Usar upsert para crear o actualizar basado en el serialNumber unico
    const terminal = await db.terminal.upsert({
      where: { serialNumber },
      update: {
        name,
        ip,
        port: parseInt(port) || 80,
        username,
        password,
        model,
        isActive: true,
      },
      create: {
        name,
        ip,
        port: parseInt(port) || 80,
        username,
        password,
        serialNumber,
        model,
      }
    });

    return NextResponse.json(terminal);
  } catch (error: any) {
    console.error('[API Config POST Error]', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (data.port) data.port = parseInt(data.port);

    const terminal = await db.terminal.update({
      where: { id },
      data
    });

    return NextResponse.json(terminal);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await db.terminal.deleteMany({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API Config DELETE Error]', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
