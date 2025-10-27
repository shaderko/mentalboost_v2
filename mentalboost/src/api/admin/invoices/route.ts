import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { INVOICE_MODULE } from "../../../modules/invoice"
import InvoiceModuleService from "../../../modules/invoice/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const invoiceService: InvoiceModuleService = req.scope.resolve(INVOICE_MODULE)

  const { order_id } = req.query

  const filters: any = {}
  if (order_id) {
    filters.order_id = order_id
  }

  const invoices = await invoiceService.listInvoices(filters)

  return res.json({ invoices })
}
