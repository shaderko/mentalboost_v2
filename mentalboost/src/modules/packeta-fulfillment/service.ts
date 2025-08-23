import {
  AbstractFulfillmentProviderService,
  MedusaError
} from '@medusajs/framework/utils';
import {
  Logger,
  FulfillmentOption,
  CreateShippingOptionDTO,
  CreateFulfillmentResult,
  LineItem,
  Fulfillment,
  Order
} from '@medusajs/framework/types';
import {
  PacketaPickupPoint,
  PacketaPacketData,
  PacketaPacketResponse
} from './types';
import { Builder, Parser } from 'xml2js';

type InjectedDependencies = {
  logger: Logger;
};

type PacketaOptions = {
  apiKey?: string;
  apiPassword?: string;
  senderId?: string;
  baseUrl?: string;
};

const packeta_options = [
  {
    id: 'packeta-pickup',
    name: 'Packeta Pickup Point',
    requires_point_id: true
  },
  {
    id: 'packeta-delivery',
    name: 'Packeta Home Delivery',
    requires_point_id: false
  }
];

class PacketaFulfillmentService extends AbstractFulfillmentProviderService {
  static identifier = 'packeta';

  protected logger_: Logger;
  protected options_: PacketaOptions;

  constructor({ logger }: InjectedDependencies, options: PacketaOptions = {}) {
    super();
    this.logger_ = logger;
    this.options_ = {
      apiKey: options.apiKey || '',
      apiPassword: options.apiPassword || '',
      senderId: options.senderId || '',
      baseUrl: options.baseUrl || 'https://www.zasilkovna.cz/api/rest'
    };
  }

  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    return packeta_options;
  }

  async validateOption(data: Record<string, any>): Promise<boolean> {
    return packeta_options.map((p) => p.id).includes(data.id);
  }

  // In the future we could calculate the shipping price of different countries
  async canCalculate(_: CreateShippingOptionDTO): Promise<boolean> {
    return false;
  }

  async validateFulfillmentData(
    optionData: any,
    data: any,
    context: any
  ): Promise<any> {
    if (optionData.requires_point_id && !data?.pickup_point_id) {
      throw new Error(`${optionData.name} requires pickup point id.`);
    }

    // validate pickup point id

    return {
      ...data,
      provider_id: PacketaFulfillmentService.identifier,
      option_type: optionData?.id
    };
  }

  async createFulfillment(
    data: Record<string, unknown>,
    items: LineItem[],
    order: Order,
    fulfillment: Fulfillment
  ): Promise<CreateFulfillmentResult> {
    try {
      this.logger_.info(`Creating Packeta fulfillment ${data}`);

      // Create packet in Packeta's system
      const packet = await this.createPacketaPacket(
        data,
        items,
        order,
        fulfillment
      );

      return {
        data: {
          ...data,
          packeta_shipment_id: packet.packetId,
          tracking_number: packet.packetId,
          pickup_point_id: data.pickupPointId,
          barcode: packet.barcode,
          created_at: new Date().toISOString()
        },
        labels: []
      };
    } catch (error) {
      this.logger_.error('Failed to create Packeta fulfillment', error);
      throw error;
    }
  }

  async cancelFulfillment(data: Record<string, unknown>): Promise<any> {
    try {
      this.logger_.info('Canceling Packeta fulfillment');

      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        'This functionality is not yet implemented.'
      );

      return {
        canceled_at: new Date().toISOString()
      };
    } catch (error) {
      this.logger_.error('Failed to cancel Packeta fulfillment', error);
      throw error;
    }
  }

  async createReturnFulfillment(
    fulfillment: Record<string, unknown>
  ): Promise<CreateFulfillmentResult> {
    try {
      this.logger_.info('Creating Packeta return fulfillment');

      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        'This functionality is not yet implemented.'
      );

      return {
        data: {
          ...((fulfillment.data as object) || {}),
          packeta_return_id: mockReturnId,
          return_created_at: new Date().toISOString()
        },
        labels: []
      };
    } catch (error) {
      this.logger_.error('Failed to create Packeta return fulfillment', error);
      throw error;
    }
  }

  private async createPacketaPacket(
    data: Record<string, unknown>,
    items: LineItem[],
    order: Order,
    fulfillment: Fulfillment
  ): Promise<PacketaPacketResponse> {
    const { apiPassword, senderId, baseUrl } = this.options_;

    if (!apiPassword || !baseUrl) {
      throw new Error('Packeta API password or base url is required');
    }

    this.logger_.info('Creating Packeta packet');

    // Extract shipping method data to get pickup point ID
    const shippingMethod = order.shipping_methods?.[0];
    const pickupPointId =
      shippingMethod?.data?.pickupPointId || data.pickup_point_id;

    // Calculate total weight (if available)
    const totalWeight = items.reduce((sum: number, item: any) => {
      return sum + (item.variant?.weight || 0) * item.quantity;
    }, 0);

    const requestBody = {
      createPacket: {
        apiPassword: apiPassword,
        packetAttributes: {
          addressId: parseInt(pickupPointId) || 0,
          carrierPickupPoint: pickupPointId,
          name:
            fulfillment.delivery_address?.first_name ||
            order.shipping_address?.first_name ||
            'Unknown',
          surname:
            fulfillment.delivery_address?.last_name ||
            order.shipping_address?.last_name ||
            'Customer',
          phone:
            fulfillment.delivery_address?.phone ||
            order.shipping_address?.phone ||
            '',
          email: order.customer?.email || order.shipping_address?.email || '',
          cod: 100, // Set COD amount if needed
          value: order.item_total, // Ensure minimum value of 1 for insurance
          weight: totalWeight || 1, // Default to 1kg if no weight specified
          eshop_id: senderId,
          number: order.display_id?.toString() || order.id,
          size: {
            width: 10, // Default package dimensions in cm
            height: 10,
            length: 10
          }
        }
      }
    };

    try {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml'
        },
        body: new Builder().buildObject(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Packeta API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const responseText = await response.text();
      console.log(responseText);
      const responseBody = await new Parser({
        explicitArray: false
      }).parseStringPromise(responseText);

      // Extract packet ID from response
      const packetId = responseBody.response?.result?.id || responseBody?.id;

      return {
        packetId: packetId,
        barcode: responseBody.response?.result?.barcode
      };
    } catch (error) {
      this.logger_.error('Failed to create Packeta packet', error);
      throw error;
    }
  }

  async getShipmentDocuments(data: Record<string, unknown>): Promise<any> {
    try {
      const { apiPassword, baseUrl } = this.options_;

      if (!apiPassword) {
        throw new Error('Packeta API password is required');
      }

      let packetId =
        (data as any).packeta_shipment_id || (data as any).tracking_number;

      if (!packetId) {
        throw new Error(
          'Packeta shipment ID is required to retrieve documents. The packet might not have been created successfully.'
        );
      }

      const requestBody = {
        packetLabelPdf: {
          apiPassword: apiPassword,
          packetId: packetId,
          format: 'A6 on A6',
          offset: 0
        }
      };

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml'
        },
        body: new Builder().buildObject(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Packeta API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const responseText = await response.text();
      const responseBody = await new Parser({
        explicitArray: false
      }).parseStringPromise(responseText);

      if (responseBody.response?.status === 'ok') {
        const pdfBase64 = responseBody.response.result;
        const pdfBuffer = Buffer.from(pdfBase64, 'base64');

        this.logger_.info('Packeta label retrieved successfully', {
          packetId,
          documentSize: pdfBuffer.length
        });

        return [
          {
            name: `packeta-label-${packetId}.pdf`,
            base_64: pdfBase64,
            type: 'application/pdf'
          }
        ];
      } else {
        throw new Error(
          `Packeta API returned error: ${
            responseBody.response?.fault || 'Unknown error'
          }`
        );
      }
    } catch (error) {
      this.logger_.error('Failed to retrieve Packeta documents', error);
      throw error;
    }
  }

  async retrieveDocuments(
    data: Record<string, unknown>,
    type: string = 'label'
  ): Promise<any> {
    // This method is called by the framework for document retrieval
    if (type === 'label') {
      return await this.getShipmentDocuments(data);
    }

    throw new Error(`Document type "${type}" is not supported`);
  }
}

export default PacketaFulfillmentService;
