import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminOrder } from "@medusajs/framework/types"
import { Button, Container, Heading, Text } from "@medusajs/ui"
import { DocumentText } from "@medusajs/icons"

// The widget component
const OrderPacketaDocuments = ({ data }: DetailWidgetProps<AdminOrder>) => {
  const packetaFulfillments = data.fulfillments?.filter(
    (fulfillment) => fulfillment.provider_id?.includes("packeta")
  ) || []

  if (packetaFulfillments.length === 0) {
    return null
  }

  const printDocument = async (fulfillmentId: string) => {
    try {
      const response = await fetch(`/admin/fulfillments/${fulfillmentId}/documents`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.statusText}`)
      }

      // Create blob URL and open in new window for printing
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const printWindow = window.open(url, '_blank')
      
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print()
        }
      } else {
        alert('Please allow popups to print the document.')
      }
    } catch (error) {
      console.error('Error printing document:', error)
      alert('Failed to print document. Please try again.')
    }
  }

  return (
    <Container>
      <div className="flex items-center gap-x-4 mb-4">
        <DocumentText className="text-ui-fg-subtle" />
        <Heading level="h3">Packeta Documents</Heading>
      </div>
      
      {packetaFulfillments.map((fulfillment) => (
        <div key={fulfillment.id} className="flex items-center justify-between p-4 border rounded-lg mb-2">
          <div>
            <Text size="small" weight="plus">
              Fulfillment #{fulfillment.id}
            </Text>
            <Text size="xsmall" className="text-ui-fg-subtle">
              Tracking: {fulfillment.data?.tracking_number || 'N/A'}
            </Text>
          </div>
          
          <Button
            variant="secondary"
            size="small"
            onClick={() => printDocument(fulfillment.id)}
          >
            Print Label
          </Button>
        </div>
      ))}
    </Container>
  )
}

// Widget configuration
export const config = defineWidgetConfig({
  zone: "order.details.after",
})

export default OrderPacketaDocuments