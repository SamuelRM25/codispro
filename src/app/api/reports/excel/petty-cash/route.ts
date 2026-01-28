import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7) // YYYY-MM

    // Get petty cash transactions for the specified month
    const transactions = await db.pettyCash.findMany({
      where: {
        date: {
          gte: new Date(`${month}-01`),
          lt: new Date(`${month}-01`).setMonth(new Date(`${month}-01`).getMonth() + 1),
        },
      },
      include: {
        user: { select: { name: true } },
        project: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    })

    // Prepare data for Excel
    const data = transactions.map((tx) => ({
      'Fecha': new Date(tx.date).toLocaleDateString('es-GT'),
      'Tipo': tx.type === 'income' ? 'Ingreso' : 'Egreso',
      'Categoría': tx.category || '',
      'Descripción': tx.description,
      'Monto': tx.amount,
      'Usuario': tx.user.name,
      'Proyecto': tx.project?.name || '',
      'Recibo': tx.receipt || '',
    }))

    // Calculate summary
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    const balance = income - expense

    // Add summary rows
    data.push(
      { 'Fecha': '', 'Tipo': '', 'Categoría': 'RESUMEN', 'Descripción': 'Total Ingresos', 'Monto': income, 'Usuario': '', 'Proyecto': '', 'Recibo': '' },
      { 'Fecha': '', 'Tipo': '', 'Categoría': 'RESUMEN', 'Descripción': 'Total Egresos', 'Monto': expense, 'Usuario': '', 'Proyecto': '', 'Recibo': '' },
      { 'Fecha': '', 'Tipo': '', 'Categoría': 'RESUMEN', 'Descripción': 'BALANCE', 'Monto': balance, 'Usuario': '', 'Proyecto': '', 'Recibo': '' },
    )

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Caja Chica')

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer' })

    // Return file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="caja_chica_${month}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Error exporting petty cash:', error)
    return NextResponse.json(
      { error: 'Error al exportar caja chica' },
      { status: 500 }
    )
  }
}
