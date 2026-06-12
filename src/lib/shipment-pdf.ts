import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { writeFile, mkdir } from 'fs/promises'
import { readFileSync } from 'fs'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { db } from '@/lib/db'

export async function generateShipmentPdf(shipmentId: string): Promise<string> {
  const shipment = await db.shipment.findUniqueOrThrow({
    where: { id: shipmentId },
    include: {
      items: { orderBy: { id: 'asc' } },
      vehicle: { select: { name: true, plate: true } },
      driver: { select: { firstName: true, lastName: true } },
      project: { select: { name: true, code: true } },
    },
  })

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15

  // ================== ENCABEZADO ==================
  try {
    const logo = readFileSync(join(process.cwd(), 'public/logo.png'))
    doc.addImage(logo, 'PNG', margin, 10, 22, 22)
  } catch {
    // Logo opcional, no rompe
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('CODISPRO', pageWidth / 2, 18, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.text('CONSTRUCCIÓN, DISEÑO Y SUPERVISIÓN DE PROYECTOS', pageWidth / 2, 24, { align: 'center' })
  doc.text('7a. Avenida Zona 4, Aldea Chuscaj, Chiantla, Huehuetenango', pageWidth / 2, 29, { align: 'center' })
  doc.text('Tel: 3036-1557', pageWidth / 2, 33, { align: 'center' })

  doc.setLineWidth(0.6)
  doc.setDrawColor(30, 41, 59)
  doc.line(margin, 40, pageWidth - margin, 40)

  // ================== TÍTULO ==================
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('GUÍA DE ENVÍO DE MATERIALES', pageWidth / 2, 50, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`N° ENV-${shipment.id.slice(-8).toUpperCase()}`, pageWidth - margin, 50, { align: 'right' })

  // ================== DATOS DEL ENVÍO ==================
  let y = 62
  const drawRow = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(`${label}:`, margin, y)
    doc.setFont('helvetica', 'normal')
    const valueX = margin + 35
    const maxWidth = pageWidth - margin - valueX
    const lines = doc.splitTextToSize(value || '—', maxWidth)
    doc.text(lines, valueX, y)
    y += Math.max(6, lines.length * 5)
  }

  const formattedDate = format(new Date(shipment.shipmentDate), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es })
  drawRow('Fecha', formattedDate)
  drawRow(
    'Modo',
    shipment.mode === 'INMEDIATO'
      ? 'Inmediato'
      : `Programado${shipment.scheduledAt ? ` (${format(new Date(shipment.scheduledAt), 'dd/MM/yyyy', { locale: es })})` : ''}`
  )
  drawRow('Punto de Salida', shipment.departurePoint ?? '—')
  drawRow('Punto de Llegada', shipment.arrivalPoint ?? '—')
  drawRow('Vehículo', `${shipment.vehicle.name} — Placa: ${shipment.vehicle.plate}`)
  drawRow(
    'Conductor',
    shipment.driver ? `${shipment.driver.firstName} ${shipment.driver.lastName}` : 'Sin asignar'
  )
  drawRow(
    'Proyecto',
    shipment.project ? `${shipment.project.name} (${shipment.project.code})` : '—'
  )
  drawRow('Autoriza', shipment.authorizeName ?? '—')

  // ================== TABLA DE MATERIALES ==================
  autoTable(doc, {
    startY: y + 2,
    head: [['#', 'Material', 'Cantidad', 'Unidad']],
    body: shipment.items.map((it, i) => [
      String(i + 1),
      it.materialName,
      String(it.sentQuantity),
      it.unit,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'center' },
    },
    margin: { left: margin, right: margin },
  })

  // ================== NOTAS (si hay) ==================
  let afterY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
  if (shipment.notes) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('Notas:', margin, afterY)
    doc.setFont('helvetica', 'normal')
    const noteLines = doc.splitTextToSize(shipment.notes, pageWidth - 2 * margin)
    doc.text(noteLines, margin, afterY + 5)
    afterY += 5 + noteLines.length * 5
  }

  // ================== SECCIÓN DE FIRMA ==================
  const signatureY = Math.max(afterY + 20, doc.internal.pageSize.getHeight() - 60)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Firma:', margin, signatureY)
  doc.setFont('helvetica', 'normal')
  doc.text(shipment.firma ?? '', margin + 15, signatureY)

  // Línea para firma
  doc.setLineWidth(0.3)
  doc.line(margin, signatureY + 14, margin + 80, signatureY + 14)
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.text('Firma del responsable', margin, signatureY + 19)

  // ================== FOOTER ==================
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7)
    doc.setTextColor(120, 120, 120)
    doc.text(
      `Documento generado el ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })} — CODISPRO`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    )
  }

  // ================== GUARDAR EN DISCO ==================
  const filename = `shipment-${shipment.id}-${uuidv4()}.pdf`
  const dir = join(process.cwd(), 'public/uploads')
  await mkdir(dir, { recursive: true })
  const buffer = Buffer.from(doc.output('arraybuffer'))
  await writeFile(join(dir, filename), buffer)

  return `/uploads/${filename}`
}
