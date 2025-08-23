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

export interface PacketaPacketData {
  number: string
  name: string
  surname: string
  email: string
  phone?: string
  addressId: number
  cod?: number
  value: number
  eshop: string
  weight?: number
  adultContent?: boolean
}

export interface PacketaPacketResponse {
  packetId: string
  barcode?: string
}