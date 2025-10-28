import { MedusaService } from "@medusajs/framework/utils"
import { Invoice, InvoiceStatus } from "./models/invoice"
import { InferTypeOf } from "@medusajs/framework/types"

type Invoice = InferTypeOf<typeof Invoice>

type SuperFakturaConfig = {
  email: string
  apiKey: string
  companyId?: string
  baseUrl?: string
}

type SuperFakturaInvoiceData = {
  Invoice: {
    name: string
    variable?: string
    created?: string
    delivery?: string
    due?: string
    comment?: string
    invoice_currency?: string
  }
  InvoiceItem: Array<{
    name: string
    description?: string
    tax: number
    unit_price: number
    quantity?: number
  }>
  Client: {
    name: string
    email?: string
    address?: string
    city?: string
    zip?: string
    phone?: string
    ico?: string
    dic?: string
  }
  InvoiceSetting?: {
    language?: string
  }
}

type SuperFakturaResponse = {
  error?: number
  error_message?: string
  data?: {
    Invoice?: {
      id: string
    }
  }
}

class InvoiceModuleService extends MedusaService({
  Invoice,
}) {
  private config: SuperFakturaConfig

  constructor(container, config: SuperFakturaConfig) {
    super(...arguments)
    this.config = {
      baseUrl: config.baseUrl || "https://moja.superfaktura.sk",
      email: config.email,
      apiKey: config.apiKey,
      companyId: config.companyId || "",
    }
  }

  async createInvoiceInSuperFaktura(
    invoiceData: SuperFakturaInvoiceData
  ): Promise<{ superfakturaId: string; pdfUrl: string }> {
    const authHeader = `SFAPI email=${encodeURIComponent(this.config.email)}&apikey=${this.config.apiKey}&company_id=${this.config.companyId || ""}`

    const formData = new URLSearchParams()
    formData.append("data", JSON.stringify(invoiceData))

    const response = await fetch(`${this.config.baseUrl}/invoices/create`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    })

    const result: SuperFakturaResponse = await response.json()

    if (result.error || !result.data?.Invoice?.id) {
      throw new Error(
        result.error_message || "Failed to create invoice in SuperFaktura"
      )
    }

    const superfakturaId = result.data.Invoice.id
    const pdfUrl = `${this.config.baseUrl}/invoices/pdf/${superfakturaId}/token:${this.config.apiKey}`

    return {
      superfakturaId,
      pdfUrl,
    }
  }

  async getOrCreateInvoiceForOrder(orderId: string): Promise<Invoice> {
    const [existingInvoice] = await this.listInvoices({
      order_id: orderId,
    })

    if (existingInvoice) {
      return existingInvoice
    }

    return await this.createInvoices({
      order_id: orderId,
      status: InvoiceStatus.PENDING,
    })
  }

  async markAsGenerated(
    invoiceId: string,
    superfakturaId: string,
    pdfUrl: string,
    invoiceData: any
  ): Promise<Invoice> {
    return await this.updateInvoices({
      id: invoiceId,
      superfaktura_id: superfakturaId,
      pdf_url: pdfUrl,
      status: InvoiceStatus.GENERATED,
      invoice_data: invoiceData,
      error_message: null,
    })
  }

  async markAsFailed(invoiceId: string, errorMessage: string): Promise<Invoice> {
    return await this.updateInvoices({
      id: invoiceId,
      status: InvoiceStatus.FAILED,
      error_message: errorMessage,
    })
  }

  async markAsSent(invoiceId: string): Promise<Invoice> {
    return await this.updateInvoices({
      id: invoiceId,
      status: InvoiceStatus.SENT,
    })
  }
}

export default InvoiceModuleService
