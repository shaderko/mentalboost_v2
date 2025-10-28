import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { INVOICE_MODULE } from "../../../../modules/invoice"
import InvoiceModuleService from "../../../../modules/invoice/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const invoiceService: InvoiceModuleService = req.scope.resolve(INVOICE_MODULE)
  const { id } = req.params

  const invoice = await invoiceService.retrieveInvoice(id)

  return res.json({ invoice })
}
