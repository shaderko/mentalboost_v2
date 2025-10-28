import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { INVOICE_MODULE } from "../../../modules/invoice"
import InvoiceModuleService from "../../../modules/invoice/service"
import { OrderDTO } from "@medusajs/framework/types"

type StepInput = {
  order: OrderDTO
  invoice_id: string
}

export const generateSuperFakturaInvoiceStep = createStep(
  "generate-superfaktura-invoice",
  async ({ order, invoice_id }: StepInput, { container }) => {
    const invoiceService: InvoiceModuleService = container.resolve(INVOICE_MODULE)

    try {
      // Prepare invoice items (products)
      const invoiceItems: any[] = []

      // Add product line items
      if (order.items && order.items.length > 0) {
        order.items.forEach((item: any) => {
          // Calculate tax rate from item's actual tax
          const taxRate = item.tax_total && item.subtotal
            ? Math.round((item.tax_total / item.subtotal) * 100)
            : 0

          invoiceItems.push({
            name: item.variant?.product?.title || item.title || "Product",
            description: item.variant?.title || item.variant_title || "",
            tax: taxRate,
            unit_price: item.unit_price || 0,
            quantity: item.quantity || 1,
          })
        })
      }

      // Add shipping as a line item if it exists
      if (order.shipping_methods && order.shipping_methods.length > 0) {
        order.shipping_methods.forEach((shippingMethod: any) => {
          const shippingTaxRate = shippingMethod.tax_total && shippingMethod.subtotal
            ? Math.round((shippingMethod.tax_total / shippingMethod.subtotal) * 100)
            : 0

          invoiceItems.push({
            name: "Shipping",
            description: shippingMethod.name || "Delivery",
            tax: shippingTaxRate,
            unit_price: shippingMethod.amount || 0,
            quantity: 1,
          })
        })
      }

      // Prepare comment with discount info if applicable
      let comment = `Order #${order.display_id || order.id}`
      if (order.discount_total && order.discount_total > 0) {
        comment += ` | Discount applied: ${order.discount_total} ${order.currency_code?.toUpperCase() || "EUR"}`
      }

      // Prepare invoice data for SuperFaktura
      const invoiceData = {
        Invoice: {
          name: order.display_id?.toString() || order.id,
          variable: order.display_id?.toString() || order.id,
          created: new Date().toISOString().split("T")[0],
          invoice_currency: order.currency_code?.toUpperCase() || "EUR",
          comment: comment,
        },
        InvoiceItem: invoiceItems,
        Client: {
          name: order.shipping_address?.company ||
                `${order.shipping_address?.first_name || ""} ${order.shipping_address?.last_name || ""}`.trim() ||
                order.email || "Customer",
          email: order.email || undefined,
          address: order.billing_address?.address_1 || order.shipping_address?.address_1 || undefined,
          city: order.billing_address?.city || order.shipping_address?.city || undefined,
          zip: order.billing_address?.postal_code || order.shipping_address?.postal_code || undefined,
          phone: order.billing_address?.phone || order.shipping_address?.phone || undefined,
        },
        InvoiceSetting: {
          language: "eng",
        },
      }

      // Create invoice in SuperFaktura
      const { superfakturaId, pdfUrl } = await invoiceService.createInvoiceInSuperFaktura(invoiceData)

      // Update our invoice record
      const updatedInvoice = await invoiceService.markAsGenerated(
        invoice_id,
        superfakturaId,
        pdfUrl,
        invoiceData
      )

      return new StepResponse(
        {
          invoice: updatedInvoice,
          pdf_url: pdfUrl,
        },
        {
          invoice_id,
          previous_status: "pending",
        }
      )
    } catch (error) {
      // Mark invoice as failed
      await invoiceService.markAsFailed(
        invoice_id,
        error instanceof Error ? error.message : "Unknown error"
      )

      throw error
    }
  },
  async (data, { container }) => {
    if (!data || !data.invoice_id) {
      return
    }

    const invoiceService: InvoiceModuleService = container.resolve(INVOICE_MODULE)

    // Revert to previous status on rollback
    await invoiceService.updateInvoices({
      id: data.invoice_id,
      status: data.previous_status as any,
      superfaktura_id: null,
      pdf_url: null,
    })
  }
)
