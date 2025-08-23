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

  const downloadDocument = async (fulfillmentId: string) => {
    try {
      const response = await fetch(`/admin/fulfillments/${fulfillmentId}/documents`)
      
      if (!response.ok) {
        throw new Error(`Failed to download document: ${response.statusText}`)
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `packeta-label-${fulfillmentId}.pdf`

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading document:', error)
      alert('Failed to download document. Please try again.')
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
            onClick={() => downloadDocument(fulfillment.id)}
          >
            Download Label
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