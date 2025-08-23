import { AbstractFulfillmentProviderService } from "@medusajs/framework/utils"
import {
  Logger,
  FulfillmentOption,
  CreateShippingOptionDTO,
  CalculateShippingOptionPriceDTO,
  CalculatedShippingOptionPrice,
  CreateFulfillmentResult
} from "@medusajs/framework/types"

type InjectedDependencies = {
  logger: Logger
}

type PacketaOptions = {
  apiKey?: string
  apiPassword?: string
  senderId?: string
  baseUrl?: string
}

export interface PacketaPickupPoint {
  id: number
  name: string
  street: string
  city: string
  zip: string
  country: string
  latitude: number
  longitude: number
  openingHours: {
    [key: string]: string
  }
}

const packeta_options = [
  {
    id: "packeta-pickup",
    name: "Packeta Pickup Point",
    requires_point_id: true,
  },
  {
    id: "packeta-delivery",
    name: "Packeta Home Delivery",
    requires_point_id: false
  }
]

class PacketaFulfillmentService extends AbstractFulfillmentProviderService {
  static identifier = "packeta"

  protected logger_: Logger
  protected options_: PacketaOptions

  constructor({ logger }: InjectedDependencies, options: PacketaOptions = {}) {
    super()
    this.logger_ = logger
    this.options_ = {
      apiKey: options.apiKey || "",
      apiPassword: options.apiPassword || "",
      senderId: options.senderId || "",
      baseUrl: options.baseUrl || "https://www.zasilkovna.cz/api/rest",
    }
  }

  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    return packeta_options
  }

  async validateOption(data: Record<string, any>): Promise<boolean> {
    return packeta_options.map((p) => p.id).includes(data.id)
  }

  // In the future we could calculate the shipping price of different countries
  async canCalculate(_: CreateShippingOptionDTO): Promise<boolean> {
    return false
  }

  async validateFulfillmentData(
    optionData: any,
    data: any,
    context: any
  ): Promise<any> {
    if (optionData.requires_point_id && !data?.pickupPointId) {
      throw new Error(`${optionData.name} requires pickup point id.`)
    }

    if (data?.pickup_point_id) {
      // Validate pickup point id existance
      // const isValid = await this.validatePickupPoint(data.pickupPointId, context.to_address?.country_code)
      // if (!isValid) {
      //   throw new Error("Invalid pickup point selected")
      // }
    }

    return {
      ...data,
      provider_id: PacketaFulfillmentService.identifier,
      option_type: optionData?.id,
    }
  }

  async createFulfillment(data: Record<string, unknown>): Promise<CreateFulfillmentResult> {
    try {
      // In production, this would create a shipment in Packeta's system
      const mockShipmentId = `PKT_${Date.now()}`

      this.logger_.info("Creating Packeta fulfillment")

      // Here you would integrate with Packeta API:
      // const shipment = await this.createPacketaShipment(data)

      return {
        data: {
          ...data,
          packeta_shipment_id: mockShipmentId,
          tracking_number: mockShipmentId,
          pickup_point_id: data.pickupPointId,
          created_at: new Date().toISOString(),
        },
        labels: [] // Packeta labels would be retrieved separately
      }
    } catch (error) {
      this.logger_.error("Failed to create Packeta fulfillment", error)
      throw error
    }
  }

  async cancelFulfillment(data: Record<string, unknown>): Promise<any> {
    try {
      const shipmentId = (data as any).packeta_shipment_id

      this.logger_.info("Canceling Packeta fulfillment")

      // Here you would cancel the shipment in Packeta's system:
      // await this.cancelPacketaShipment(shipmentId)

      return {
        canceled_at: new Date().toISOString(),
      }
    } catch (error) {
      this.logger_.error("Failed to cancel Packeta fulfillment", error)
      throw error
    }
  }

  async createReturnFulfillment(fulfillment: Record<string, unknown>): Promise<CreateFulfillmentResult> {
    try {
      const mockReturnId = `PKT_RTN_${Date.now()}`

      this.logger_.info("Creating Packeta return fulfillment")

      return {
        data: {
          ...(fulfillment.data as object || {}),
          packeta_return_id: mockReturnId,
          return_created_at: new Date().toISOString(),
        },
        labels: []
      }
    } catch (error) {
      this.logger_.error("Failed to create Packeta return fulfillment", error)
      throw error
    }
  }
}

export default PacketaFulfillmentService
