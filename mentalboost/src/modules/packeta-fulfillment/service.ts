import {
  AbstractFulfillmentProviderService,
  MedusaError,
} from '@medusajs/framework/utils';
import {
  Logger,
  FulfillmentOption,
  CreateShippingOptionDTO,
  CreateFulfillmentResult,
  FulfillmentItemDTO,
  FulfillmentOrderDTO,
  FulfillmentDTO,
  ValidateFulfillmentDataContext,
} from '@medusajs/framework/types';
import {
  PacketaOptions,
} from './types';
import PacketaClient from './client';

type InjectedDependencies = {
  logger: Logger;
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
  private client: PacketaClient;

  constructor({ logger }: InjectedDependencies, options: PacketaOptions) {
    super();
    this.logger_ = logger;

    // Initialize packeta client
    this.client = new PacketaClient(options)
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

  async validateFulfillmentData(optionData: Record<string, unknown>, data: Record<string, unknown>, _context: ValidateFulfillmentDataContext): Promise<any> {
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
    items: Partial<Omit<FulfillmentItemDTO, "fulfillment">>[],
    order: Partial<FulfillmentOrderDTO> | undefined,
    fulfillment: Partial<Omit<FulfillmentDTO, "provider_id" | "data" | "items">>
  ): Promise<CreateFulfillmentResult> {
    try {
      this.logger_.info(`Creating Packeta fulfillment ${data}`);

      const totalWeight = items.reduce((sum: number, item: any) => {
        return sum + (item.variant?.weight || 0) * item.quantity;
      }, 0);

      const packet = await this.client.create(
        {
          addressId: order?.shipping_address?.id,
          carrierPickupPoint: data.pickup_point_id,
          name: fulfillment.delivery_address?.first_name,
          surname: fulfillment.delivery_address?.last_name,
          phone: fulfillment.delivery_address?.phone,
          email: order?.email,
          cod: order?.item_total,
          value: order?.item_total,
          weight: totalWeight,
          number: order?.id,
          size: {
            width: 10,
            height: 10,
            length: 10
          }
        }
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

      const packetId = (data as any).packeta_shipment_id || (data as any).tracking_number;

      if (!packetId) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          'Packeta shipment ID is required for cancellation'
        );
      }

      await this.client.cancel(packetId);

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
    throw new MedusaError(MedusaError.Types.CONFLICT, "This functionality is not yet implemented")
  }

  async getShipmentDocuments(data: Record<string, unknown>): Promise<any> {
    try {
      let packetId =
        (data as any).packeta_shipment_id || (data as any).tracking_number;

      if (!packetId) {
        throw new Error(
          'Packeta shipment ID is required to retrieve documents. The packet might not have been created successfully.'
        );
      }

      return this.client.documents(packetId)
    } catch (error) {
      this.logger_.error('Failed to retrieve Packeta documents', error);
      throw error;
    }
  }

  async retrieveDocuments(
    data: Record<string, unknown>,
    type: string = 'label'
  ): Promise<any> {
    if (type === 'label') {
      return await this.getShipmentDocuments(data);
    }

    throw new Error(`Document type "${type}" is not supported`);
  }
}

export default PacketaFulfillmentService;
