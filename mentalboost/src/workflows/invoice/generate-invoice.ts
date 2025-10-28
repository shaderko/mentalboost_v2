import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { getOrCreateInvoiceStep } from "./steps/get-or-create-invoice"
import { generateSuperFakturaInvoiceStep } from "./steps/generate-superfaktura-invoice"

type WorkflowInput = {
  order_id: string
}

export const generateInvoiceWorkflow = createWorkflow(
  "generate-invoice",
  (input: WorkflowInput) => {
    // Retrieve order details
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "email",
        "currency_code",
        "total",
        "subtotal",
        "tax_total",
        "discount_total",
        "shipping_total",
        "shipping_subtotal",
        "shipping_tax_total",
        "items.*",
        "items.variant.*",
        "items.variant.product.*",
        "items.tax_lines.*",
        "shipping_address.*",
        "billing_address.*",
        "shipping_methods.*",
        "shipping_methods.tax_lines.*",
      ],
      filters: {
        id: input.order_id,
      },
      options: {
        throwIfKeyNotFound: true,
      },
    })

    const order = orders[0]

    // Get or create invoice record
    const invoice = getOrCreateInvoiceStep({
      order_id: order.id,
    })

    // Generate invoice in SuperFaktura
    const result = generateSuperFakturaInvoiceStep({
      order,
      invoice_id: invoice.id,
    })

    return new WorkflowResponse(result)
  }
)
