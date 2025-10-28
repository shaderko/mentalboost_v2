import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { generateInvoiceWorkflow } from "../workflows/invoice/generate-invoice"

export default async function sendOrderConfirmationHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve("query")
  const notificationModuleService = container.resolve("notification")

  try {
    // Retrieve order details
    const { data: [order] } = await query.graph({
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
        "items.*",
        "items.variant.*",
        "items.variant.product.*",
        "shipping_address.*",
        "billing_address.*",
        "shipping_methods.*",
      ],
      filters: {
        id: data.id,
      },
    })

    // Generate invoice
    const { result } = await generateInvoiceWorkflow(container).run({
      input: {
        order_id: data.id,
      },
    })

    console.log(`Invoice generated for order ${data.id}:`, result.invoice.id)
    console.log(`PDF URL: ${result.pdf_url}`)

    // Fetch the PDF from SuperFaktura
    let pdfBuffer: Buffer | null = null
    if (result.pdf_url) {
      try {
        const pdfResponse = await fetch(result.pdf_url)
        if (pdfResponse.ok) {
          const arrayBuffer = await pdfResponse.arrayBuffer()
          pdfBuffer = Buffer.from(arrayBuffer)
        }
      } catch (pdfError) {
        console.error("Failed to fetch PDF:", pdfError)
      }
    }

    // Prepare notification data
    const notificationData: any = {
      to: order.email || "",
      template: "order-confirmation",
      channel: "email",
      data: {
        ...order,
        invoice_url: result.pdf_url,
      },
    }

    // Add PDF as attachment if successfully fetched
    if (pdfBuffer) {
      const binaryString = [...pdfBuffer]
        .map((byte) => byte.toString(2).padStart(8, "0"))
        .join("")

      notificationData.attachments = [
        {
          content: binaryString,
          filename: `invoice-${order.display_id || order.id}.pdf`,
          content_type: "application/pdf",
          disposition: "attachment",
        },
      ]
    }

    // Send order confirmation email with invoice
    await notificationModuleService.createNotifications(notificationData)

    console.log(`Order confirmation email sent for order ${data.id}`)
  } catch (error) {
    console.error(`Failed to send order confirmation for order ${data.id}:`, error)
    // Don't throw error - we don't want to fail order placement if email fails
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
