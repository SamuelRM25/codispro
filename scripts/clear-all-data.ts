import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

const db = new PrismaClient()

async function main() {
  console.log('🗑️  Limpiando todos los datos excepto User...')

  const deletions = [
    db.accessLog.deleteMany(),
    db.invoiceItem.deleteMany(),
    db.invoice.deleteMany(),
    db.client.deleteMany(),
    db.company.deleteMany(),
    db.locationLog.deleteMany(),
    db.payrollEntry.deleteMany(),
    db.projectExpense.deleteMany(),
    db.projectStaff.deleteMany(),
    db.pettyCash.deleteMany(),
    db.shipmentItem.deleteMany(),
    db.shipment.deleteMany(),
    db.vehicleTrip.deleteMany(),
    db.vehicleSparePart.deleteMany(),
    db.vehicle.deleteMany(),
    db.toolLoan.deleteMany(),
    db.tool.deleteMany(),
    db.worker.deleteMany(),
    db.terminal.deleteMany(),
  ]

  for (const del of deletions) {
    const result = await del
    console.log(`   ${result.count} registros eliminados`)
  }

  console.log('✅ Limpieza completada. Todos los datos han sido eliminados excepto la tabla User.')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
