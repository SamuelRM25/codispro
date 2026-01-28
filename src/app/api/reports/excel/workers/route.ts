import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as XLSX from 'xlsx'

export async function GET() {
  try {
    const workers = await db.worker.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    // Prepare data for Excel
    const data = workers.map((worker) => ({
      'Nombre': worker.firstName,
      'Apellido': worker.lastName,
      'DPI': worker.dpi || '',
      'Fecha Nacimiento': worker.birthDate ? new Date(worker.birthDate).toLocaleDateString('es-GT') : '',
      'Teléfono': worker.phone || '',
      'Dirección': worker.address || '',
      'Cargo': worker.position || '',
      'Tarifa por Hora': worker.hourlyRate || 0,
      'Fecha Creación': new Date(worker.createdAt).toLocaleDateString('es-GT'),
    }))

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Trabajadores')

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer' })

    // Return file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="trabajadores_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Error exporting workers:', error)
    return NextResponse.json(
      { error: 'Error al exportar trabajadores' },
      { status: 500 }
    )
  }
}
