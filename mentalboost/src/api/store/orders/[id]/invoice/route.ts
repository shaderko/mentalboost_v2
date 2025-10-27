import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { INVOICE_MODULE } from "../../../../../modules/invoice"
import InvoiceModuleService from "../../../../../modules/invoice/service"

export const GET = async (
  req: MedusaRequest<{ id: string }>,
  res: MedusaResponse
) => {
  const invoiceService: InvoiceModuleService =
    req.scope.resolve(INVOICE_MODULE)
  const orderId = req.params.id

  if (!orderId) {
    return res.status(400).json({
      error: "Order ID is required",
    })
  }

  try {
    // Get invoice for the order
    const invoices = await invoiceService.listInvoices({
      order_id: orderId,
    })

    const invoice = invoices[0]

    if (!invoice) {
      return res.status(404).json({
        error: "Invoice not found for this order",
      })
    }

    // Only return invoices that have been successfully generated
    if (invoice.status !== "generated" && invoice.status !== "sent") {
      return res.status(404).json({
        error: "Invoice is not yet available",
      })
    }

    return res.json({
      invoice: {
        id: invoice.id,
        order_id: invoice.order_id,
        pdf_url: invoice.pdf_url,
        status: invoice.status,
        superfaktura_id: invoice.superfaktura_id,
      },
    })
  } catch (error) {
    console.error("Error fetching invoice:", error)
    return res.status(500).json({
      error: "Failed to fetch invoice",
    })
  }
}
