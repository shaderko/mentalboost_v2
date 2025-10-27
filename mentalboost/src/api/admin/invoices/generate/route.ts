import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { generateInvoiceWorkflow } from "../../../../workflows/invoice/generate-invoice"

type GenerateInvoiceRequest = {
  order_id: string
}

export const POST = async (
  req: MedusaRequest<GenerateInvoiceRequest>,
  res: MedusaResponse
) => {
  const { order_id } = req.body

  if (!order_id) {
    return res.status(400).json({
      error: "order_id is required",
    })
  }

  try {
    const { result } = await generateInvoiceWorkflow(req.scope).run({
      input: {
        order_id,
      },
    })

    return res.json({
      invoice: result.invoice,
      pdf_url: result.pdf_url,
    })
  } catch (error) {
    console.error("Failed to generate invoice:", error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to generate invoice",
    })
  }
}
