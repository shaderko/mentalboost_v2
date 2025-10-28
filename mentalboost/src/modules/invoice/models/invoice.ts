import { model } from "@medusajs/framework/utils"

export enum InvoiceStatus {
  PENDING = "pending",
  GENERATED = "generated",
  FAILED = "failed",
  SENT = "sent",
}

export const Invoice = model.define("invoice", {
  id: model.id().primaryKey(),
  order_id: model.text(),
  superfaktura_id: model.text().nullable(),
  pdf_url: model.text().nullable(),
  status: model.enum(InvoiceStatus).default(InvoiceStatus.PENDING),
  error_message: model.text().nullable(),
  invoice_data: model.json().nullable(),
})
