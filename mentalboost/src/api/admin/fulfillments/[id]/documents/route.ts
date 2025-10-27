import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import { MedusaError } from '@medusajs/framework/utils';
import { Modules } from '@medusajs/framework/utils';
import PacketaFulfillmentService from '../../../../../modules/packeta-fulfillment/service';

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const fulfillmentId = req.params.id;

  try {
    if (process.env.PACKETA_API_PASSWORD === undefined ||
        process.env.PACKETA_SENDER_ID === undefined || process.env.PACKETA_BASE_URL === undefined) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Packeta API credentials are not set in environment variables'
      );
    }

    const fulfillmentModuleService = req.scope.resolve(Modules.FULFILLMENT);

    const fulfillment = await fulfillmentModuleService.retrieveFulfillment(
      fulfillmentId,
      {
        relations: ['provider']
      }
    );

    if (fulfillment.provider.id !== 'packeta_packeta') {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'This fulfillment is not handled by Packeta'
      );
    }

    // Create an instance of the Packeta service directly
    const logger = req.scope.resolve('logger');
    const packetaService = new PacketaFulfillmentService(
      { logger },
      {
        apiPassword: process.env.PACKETA_API_PASSWORD,
        senderId: process.env.PACKETA_SENDER_ID,
        baseUrl: process.env.PACKETA_BASE_URL
      }
    );

    // Check if we have a packet ID, if not we might need to create the packet first
    const hasPacketId =
      fulfillment.data?.packeta_shipment_id ||
      fulfillment.data?.tracking_number;

    if (!hasPacketId || !fulfillment.data) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Packet was not created in Packeta system. Please check if the fulfillment was processed correctly and the Packeta API is configured properly.'
      );
    }

    // Get documents from the Packeta service
    const documents = await packetaService.getShipmentDocuments(
      fulfillment.data
    );

    if (!documents || documents.length === 0) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        'No documents found for this fulfillment'
      );
    }

    // Return the first document (shipping label)
    const document = documents[0];

    res.setHeader('Content-Type', document.type);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${document.name}"`
    );

    // Send the base64 decoded PDF
    const pdfBuffer = Buffer.from(document.base_64, 'base64');
    res.send(pdfBuffer);
  } catch (error) {
    if (error instanceof MedusaError) {
      return res
        .status(error.type === MedusaError.Types.NOT_FOUND ? 404 : 400)
        .json({
          message: error.message
        });
    }

    res.status(500).json({
      message: 'Failed to retrieve documents',
      error: error.message
    });
  }
}
