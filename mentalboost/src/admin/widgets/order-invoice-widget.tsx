import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, StatusBadge, Button, Text, toast, Tooltip, I18nProvider, Skeleton, IconButton } from "@medusajs/ui"
import { DetailWidgetProps, AdminOrder } from "@medusajs/framework/types"
import { useState, useEffect } from "react"
import {
  ArrowDownTray,
  SquareTwoStack,
  ArrowPath
} from "@medusajs/icons"

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

      // Refetch invoice to get the latest status
      await fetchInvoice()

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)

    const day = date.getDate()
    const month = date.toLocaleString('en-US', { month: 'short' })
    const year = date.getFullYear()
    const time = date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })

    return `${day} ${month}, ${year}, ${time}`
  }

  const getTooltipText = (invoice: Invoice) => {
    const dateToShow = (invoice.status === "generated" || invoice.status === "sent" || invoice.status === "failed")
                     ? invoice.updated_at
                     : invoice.created_at

    return formatDate(dateToShow)
  }

  if (loading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Invoice</Heading>
          <Skeleton className="w-16 h-6" />
        </div>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between p-4 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
            <div className="flex flex-col gap-2">
              <Skeleton className="w-32 h-5" />
              <Skeleton className="w-48 h-3" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="w-8 h-8 rounded" />
              <Skeleton className="w-8 h-8 rounded" />
            </div>
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Invoice</Heading>
        {invoice?.status && (
          <I18nProvider locale="en-US">
            <Tooltip content={getTooltipText(invoice)}>
              <StatusBadge color={getStatusColor(invoice.status)}>
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </StatusBadge>
            </Tooltip>
          </I18nProvider>
        )}
      </div>
      <div className="px-6 py-4">
        {!invoice ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="flex flex-col items-center gap-2">
              <Text className="text-ui-fg-subtle text-center">
                No invoice has been generated for this order yet.
              </Text>
              <Text size="small" className="text-ui-fg-muted text-center">
                Generate an invoice to send to your customer.
              </Text>
            </div>
            <Button
              onClick={handleGenerateInvoice}
              isLoading={generating}
              disabled={generating}
            >
              Generate Invoice
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Invoice Info Card */}
            {(invoice.status === "generated" || invoice.status === "sent") && (
              <div className="flex items-center justify-between p-4 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
                <div className="flex flex-col gap-1">
                  <Text size="small" weight="plus" className="text-ui-fg-base">
                    Invoice #{invoice.superfaktura_id || invoice.id.slice(0, 8)}
                  </Text>
                  {invoice.superfaktura_id && (
                    <Text size="xsmall" className="text-ui-fg-subtle font-mono">
                      SuperFaktura ID: {invoice.superfaktura_id}
                    </Text>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Tooltip content="Download PDF">
                    <IconButton
                      size="small"
                      variant="transparent"
                      onClick={() => window.open(invoice.pdf_url!, "_blank")}
                    >
                      <ArrowDownTray />
                    </IconButton>
                  </Tooltip>
                  <Tooltip content="Copy link">
                    <IconButton
                      size="small"
                      variant="transparent"
                      onClick={() => {
                        navigator.clipboard.writeText(invoice.pdf_url!)
                        toast.success("Copied", {
                          description: "PDF URL copied to clipboard",
                        })
                      }}
                    >
                      <SquareTwoStack />
                    </IconButton>
                  </Tooltip>
                </div>
              </div>
            )}

            {/* Failed State */}
            {invoice.status === "failed" && invoice.error_message && (
              <div className="flex flex-col gap-3 p-4 bg-ui-bg-error-subtle rounded-lg border border-ui-border-error">
                <div className="flex flex-col gap-2">
                  <Text size="small" weight="plus" className="text-ui-fg-error">
                    Generation Failed
                  </Text>
                  <Text size="small" className="text-ui-fg-subtle">
                    {invoice.error_message}
                  </Text>
                </div>
                <Button
                  size="small"
                  onClick={handleGenerateInvoice}
                  isLoading={generating}
                  disabled={generating}
                >
                  Retry Generation
                </Button>
              </div>
            )}

            {/* Pending State */}
            {invoice.status === "pending" && (
              <div className="flex items-center justify-between p-4 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
                <div className="flex items-center gap-3">
                  <div className="flex h-4 w-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-ui-fg-muted border-t-ui-fg-interactive" />
                  </div>
                  <Text size="small" className="text-ui-fg-subtle">
                    Invoice generation is in progress...
                  </Text>
                </div>
                <Tooltip content="Refresh status">
                  <IconButton
                    size="small"
                    variant="transparent"
                    onClick={fetchInvoice}
                  >
                    <ArrowPath />
                  </IconButton>
                </Tooltip>
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
