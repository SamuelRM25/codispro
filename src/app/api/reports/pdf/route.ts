import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'report'

    if (type === 'report') {
      return generateGeneralReport()
    } else if (type === 'workers') {
      return generateWorkersReport()
    } else if (type === 'tools') {
      return generateToolsReport()
    } else if (type === 'vehicles') {
      return generateVehiclesReport()
    } else if (type === 'projects') {
      return generateProjectsReport()
    }

    return NextResponse.json({ error: 'Tipo de reporte inválido' }, { status: 400 })
  } catch (error) {
    console.error('Error generating PDF report:', error)
    return NextResponse.json(
      { error: 'Error al generar reporte PDF' },
      { status: 500 }
    )
  }
}

async function generateGeneralReport() {
  const [workers, tools, vehicles, projects, shipments] = await Promise.all([
    db.worker.count({ where: { isActive: true } }),
    db.tool.count(),
    db.vehicle.count({ where: { isActive: true } }),
    db.project.count(),
    db.shipment.count(),
  ])

  const pettyCashIncome = await db.pettyCash.aggregate({
    where: { type: 'income' },
    _sum: { amount: true },
  })
  const pettyCashExpense = await db.pettyCash.aggregate({
    where: { type: 'expense' },
    _sum: { amount: true },
  })

  const doc = new jsPDF()

  doc.setFontSize(20)
  doc.text('CODISPRO - Reporte General', 105, 20, { align: 'center' })
  doc.setFontSize(10)
  doc.text(`Generado: ${new Date().toLocaleDateString('es-GT')}`, 105, 30, { align: 'center' })

  const summaryData = [
    ['Trabajadores Activos', workers.toString()],
    ['Herramientas en Inventario', tools.toString()],
    ['Vehículos en Flota', vehicles.toString()],
    ['Proyectos Activos', projects.toString()],
    ['Envíos Realizados', shipments.toString()],
    ['Ingresos Caja Chica', `Q${(pettyCashIncome._sum.amount || 0).toFixed(2)}`],
    ['Egresos Caja Chica', `Q${(pettyCashExpense._sum.amount || 0).toFixed(2)}`],
    ['Balance Caja Chica', `Q${((pettyCashIncome._sum.amount || 0) - (pettyCashExpense._sum.amount || 0)).toFixed(2)}`],
  ]

  autoTable(doc, {
    head: [['Métrica', 'Valor']],
    body: summaryData,
    startY: 50,
    theme: 'grid',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
  })

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte_general_${new Date().toISOString().split('T')[0]}.pdf"`,
    },
  })
}

async function generateWorkersReport() {
  const workers = await db.worker.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  })

  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text('CODISPRO - Reporte de Trabajadores', 105, 20, { align: 'center' })
  doc.setFontSize(10)
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-GT')}`, 105, 30, { align: 'center' })

  const tableData = workers.map((w, i) => [
    (i + 1).toString(),
    `${w.firstName} ${w.lastName}`,
    w.dpi || '-',
    w.position || '-',
    w.phone || '-',
    w.hourlyRate ? `Q${w.hourlyRate.toFixed(2)}` : '-',
    w.birthDate ? new Date(w.birthDate).toLocaleDateString('es-GT') : '-',
  ])

  autoTable(doc, {
    head: [['#', 'Nombre', 'DPI', 'Cargo', 'Teléfono', 'Tarifa/Hora', 'Fecha Nacimiento']],
    body: tableData,
    startY: 50,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 40 },
      2: { cellWidth: 25 },
      3: { cellWidth: 25 },
      4: { cellWidth: 20 },
      5: { cellWidth: 20 },
      6: { cellWidth: 25 },
    },
  })

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="trabajadores_${new Date().toISOString().split('T')[0]}.pdf"`,
    },
  })
}

async function generateToolsReport() {
  const tools = await db.tool.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text('CODISPRO - Reporte de Herramientas', 105, 20, { align: 'center' })
  doc.setFontSize(10)
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-GT')}`, 105, 30, { align: 'center' })

  const tableData = tools.map((t, i) => [
    (i + 1).toString(),
    t.name,
    t.description || '-',
    t.barcode || '-',
    t.category || '-',
    t.status === 'available' ? 'Disponible' : t.status === 'in_use' ? 'En Uso' : t.status === 'maintenance' ? 'Mantenimiento' : 'Retirado',
    t.location || '-',
  ])

  autoTable(doc, {
    head: [['#', 'Nombre', 'Descripción', 'Código Barras', 'Categoría', 'Estado', 'Ubicación']],
    body: tableData,
    startY: 50,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
  })

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="herramientas_${new Date().toISOString().split('T')[0]}.pdf"`,
    },
  })
}

async function generateVehiclesReport() {
  const vehicles = await db.vehicle.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  })

  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text('CODISPRO - Reporte de Vehículos', 105, 20, { align: 'center' })
  doc.setFontSize(10)
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-GT')}`, 105, 30, { align: 'center' })

  const tableData = vehicles.map((v, i) => [
    (i + 1).toString(),
    v.name,
    v.plate,
    v.type,
    v.brand || '-',
    v.model || '-',
    v.year?.toString() || '-',
    v.status === 'available' ? 'Disponible' : v.status === 'in_use' ? 'En Viaje' : 'Mantenimiento',
    v.mileage ? `${v.mileage} km` : '-',
  ])

  autoTable(doc, {
    head: [['#', 'Nombre', 'Placa', 'Tipo', 'Marca', 'Modelo', 'Año', 'Estado', 'Kilometraje']],
    body: tableData,
    startY: 50,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
  })

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="vehiculos_${new Date().toISOString().split('T')[0]}.pdf"`,
    },
  })
}

async function generateProjectsReport() {
  const projects = await db.project.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text('CODISPRO - Reporte de Proyectos', 105, 20, { align: 'center' })
  doc.setFontSize(10)
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-GT')}`, 105, 30, { align: 'center' })

  const tableData = projects.map((p, i) => [
    (i + 1).toString(),
    p.name,
    p.code,
    p.status === 'planning' ? 'Planificación' : p.status === 'active' ? 'Activo' : p.status === 'on_hold' ? 'Pausado' : p.status === 'completed' ? 'Completado' : 'Cancelado',
    `${p.progress}%`,
    p.budget ? `Q${p.budget.toFixed(2)}` : '-',
    p.startDate ? new Date(p.startDate).toLocaleDateString('es-GT') : '-',
    p.endDate ? new Date(p.endDate).toLocaleDateString('es-GT') : '-',
    p.client || '-',
  ])

  autoTable(doc, {
    head: [['#', 'Nombre', 'Código', 'Estado', 'Progreso', 'Presupuesto', 'Inicio', 'Fin', 'Cliente']],
    body: tableData,
    startY: 50,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
  })

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="proyectos_${new Date().toISOString().split('T')[0]}.pdf"`,
    },
  })
}
