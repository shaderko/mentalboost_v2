import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { INVOICE_MODULE } from "../../../modules/invoice"
import InvoiceModuleService from "../../../modules/invoice/service"

type StepInput = {
  order_id: string
}

export const getOrCreateInvoiceStep = createStep(
  "get-or-create-invoice",
  async ({ order_id }: StepInput, { container }) => {
    const invoiceService: InvoiceModuleService = container.resolve(INVOICE_MODULE)

    const invoice = await invoiceService.getOrCreateInvoiceForOrder(order_id)

    return new StepResponse(invoice, {
      invoice_id: invoice.id,
      was_created: !invoice.superfaktura_id,
    })
  },
  async (data, { container }) => {
    if (!data || !data.was_created || !data.invoice_id) {
      return
    }

    const invoiceService: InvoiceModuleService = container.resolve(INVOICE_MODULE)
    await invoiceService.deleteInvoices(data.invoice_id)
  }
)
