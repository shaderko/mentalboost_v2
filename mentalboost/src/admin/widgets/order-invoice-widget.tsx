import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Badge, Button, Text, toast } from "@medusajs/ui"
import { DetailWidgetProps, AdminOrder } from "@medusajs/framework/types"
import { useState, useEffect } from "react"

type Invoice = {
  id: string
  order_id: string
  superfaktura_id: string | null
  pdf_url: string | null
  status: "pending" | "generated" | "failed" | "sent"
  error_message: string | null
  created_at: string
  updated_at: string
}

const OrderInvoiceWidget = ({ data }: DetailWidgetProps<AdminOrder>) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchInvoice()
  }, [data.id])

  const fetchInvoice = async () => {
    try {
      const response = await fetch(
        `/admin/invoices?order_id=${data.id}`,
        {
          credentials: "include",
        }
      )
      const result = await response.json()
      if (result.invoices && result.invoices.length > 0) {
        setInvoice(result.invoices[0])
      }
    } catch (error) {
      console.error("Failed to fetch invoice:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateInvoice = async () => {
    setGenerating(true)
    try {
      const response = await fetch("/admin/invoices/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ order_id: data.id }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate invoice")
      }

      const result = await response.json()
      setInvoice(result.invoice)
      toast.success("Invoice generated", {
        description: "Invoice has been successfully generated",
      })
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to generate invoice",
      })
    } finally {
      setGenerating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "generated":
        return "green"
      case "pending":
        return "orange"
      case "failed":
        return "red"
      case "sent":
        return "blue"
      default:
        return "grey"
    }
  }

  if (loading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Invoice</Heading>
        </div>
        <div className="px-6 py-4">
          <Text className="text-ui-fg-subtle">Loading...</Text>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Invoice</Heading>
        {invoice?.status && (
          <Badge color={getStatusColor(invoice.status)}>
            {invoice.status.toUpperCase()}
          </Badge>
        )}
      </div>
      <div className="px-6 py-4">
        {!invoice ? (
          <div className="flex flex-col gap-4">
            <Text className="text-ui-fg-subtle">
              No invoice has been generated for this order yet.
            </Text>
            <div>
              <Button
                onClick={handleGenerateInvoice}
                isLoading={generating}
                disabled={generating}
              >
                Generate Invoice
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {invoice.status === "generated" && invoice.pdf_url && (
              <div className="flex flex-col gap-2">
                <Text size="small" weight="plus" className="text-ui-fg-base">
                  Invoice PDF
                </Text>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => window.open(invoice.pdf_url!, "_blank")}
                  >
                    View PDF
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(invoice.pdf_url!)
                      toast.success("Copied", {
                        description: "PDF URL copied to clipboard",
                      })
                    }}
                  >
                    Copy Link
                  </Button>
                </div>
              </div>
            )}

            {invoice.superfaktura_id && (
              <div className="flex flex-col gap-2">
                <Text size="small" weight="plus" className="text-ui-fg-base">
                  SuperFaktura ID
                </Text>
                <Text size="small" className="text-ui-fg-subtle">
                  {invoice.superfaktura_id}
                </Text>
              </div>
            )}

            {invoice.status === "failed" && invoice.error_message && (
              <div className="flex flex-col gap-2">
                <Text size="small" weight="plus" className="text-ui-fg-base">
                  Error
                </Text>
                <Text size="small" className="text-ui-fg-error">
                  {invoice.error_message}
                </Text>
                <div className="mt-2">
                  <Button
                    onClick={handleGenerateInvoice}
                    isLoading={generating}
                    disabled={generating}
                  >
                    Retry Generation
                  </Button>
                </div>
              </div>
            )}

            {invoice.status === "pending" && (
              <div className="flex flex-col gap-2">
                <Text size="small" className="text-ui-fg-subtle">
                  Invoice generation is in progress...
                </Text>
                <div>
                  <Button
                    variant="secondary"
                    onClick={fetchInvoice}
                  >
                    Refresh
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.after",
})

export default OrderInvoiceWidget
