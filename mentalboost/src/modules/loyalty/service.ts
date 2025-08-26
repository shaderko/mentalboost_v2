import { MedusaError, MedusaService } from "@medusajs/framework/utils"
import LoyaltyPoint from "./models/loyalty-point"
import { InferTypeOf } from "@medusajs/framework/types"

type LoyaltyPoint = InferTypeOf<typeof LoyaltyPoint>

class LoyaltyModuleService extends MedusaService({
  LoyaltyPoint,
}) {
  async addPoints(customerId: string, points: number): Promise<LoyaltyPoint> {
    const existingPoints = await this.listLoyaltyPoints({
      customer_id: customerId,
    })

    if (existingPoints.length > 0) {
      return await this.updateLoyaltyPoints({
        id: existingPoints[0].id,
        points: existingPoints[0].points + points,
      })
    }

    return await this.createLoyaltyPoints({
      customer_id: customerId,
      points,
    })
  }

  async deductPoints(customerId: string, points: number): Promise<LoyaltyPoint> {
    const existingPoints = await this.listLoyaltyPoints({
      customer_id: customerId,
    })

    if (existingPoints.length === 0 || existingPoints[0].points < points) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Insufficient loyalty points"
      )
    }

    return await this.updateLoyaltyPoints({
      id: existingPoints[0].id,
      points: existingPoints[0].points - points,
    })
  }

  async getPoints(customerId: string): Promise<number> {
    const points = await this.listLoyaltyPoints({
      customer_id: customerId,
    })

    return points[0]?.points || 0
  }

  /*
  * This function is used when we are giving points to the user
  */
  async calculatePointsFromAmount(amount: number): Promise<number> {
    // Convert amount to points, we can assume if we are giving points the user is registered
    const points = Math.floor(amount * 25)

    if (points < 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Amount cannot be negative"
      )
    }

    return points
  }

  /*
  * This function is used when we are calculating the deduction of points on order
  */
  async calculatePointsFromAmountActual(amount: number): Promise<number> {
    const points = Math.floor(amount * 100)

    if (points < 0) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Amount cannot be negative")
    }

    return points
  }

  async calculateAmountFromPoints(points: number): Promise<number> {
    // Convert points to actual eur amount
    const amount = points / 100

    if (amount < 0) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Points would give negative result")
    }

    return amount
  }
}

export default LoyaltyModuleService
