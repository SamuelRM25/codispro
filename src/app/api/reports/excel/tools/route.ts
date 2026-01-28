import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as XLSX from 'xlsx'

export async function GET() {
  try {
    const tools = await db.tool.findMany({
      include: {
        loans: {
          where: { returnDate: null },
          include: {
            worker: { select: { firstName: true, lastName: true } },
          },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Prepare data for Excel
    const data = tools.map((tool) => {
      const currentLoan = tool.loans[0]
      return {
        'Nombre': tool.name,
        'Descripción': tool.description || '',
        'Código Barras': tool.barcode || '',
        'Categoría': tool.category || '',
        'Estado': tool.status === 'available' ? 'Disponible' : tool.status === 'in_use' ? 'En Uso' : tool.status === 'maintenance' ? 'Mantenimiento' : 'Retirado',
        'Ubicación': tool.location || '',
        'Prestado a': currentLoan ? `${currentLoan.worker.firstName} ${currentLoan.worker.lastName}` : 'En bodega',
        'Fecha Préstamo': currentLoan ? new Date(currentLoan.loanDate).toLocaleDateString('es-GT') : '',
        'Fecha Creación': new Date(tool.createdAt).toLocaleDateString('es-GT'),
      }
    })

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Herramientas')

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer' })

    // Return file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="herramientas_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Error exporting tools:', error)
    return NextResponse.json(
      { error: 'Error al exportar herramientas' },
      { status: 500 }
    )
  }
}
