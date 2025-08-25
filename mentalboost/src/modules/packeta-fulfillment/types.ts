import { BigNumberValue } from "@medusajs/framework/types";

export interface PacketaOptions {
  apiPassword: string;
  senderId: string;
  baseUrl: string;
};

export interface PacketAttributes {
  addressId?: string;
  carrierPickupPoint?: string | unknown,
  name?: string | null,
  surname?: string | null,
  phone?: string | null,
  email?: string,
  cod: BigNumberValue | undefined,
  value: BigNumberValue | undefined,
  weight: number,
  number?: string,
  size: {
    width: number,
    height: number,
    length: number
  }
}
