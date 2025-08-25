import { PacketaOptions, PacketAttributes } from "./types";
import { Builder, Parser } from 'xml2js';

class PacketaClient {
  private apiPassword: string;
  private senderId: string;
  private baseUrl: string;

  constructor(options: PacketaOptions) {
    this.apiPassword = options.apiPassword
    this.senderId = options.senderId
    this.baseUrl = options.baseUrl
  }

  async create(packetAttributes: PacketAttributes): Promise<{ packetId: string, barcode: string }> {
    const requestBody = {
      createPacket: {
        apiPassword: this.apiPassword,
        packetAttributes: {
          ...packetAttributes,
          eshop_id: this.senderId,
        }
      }
    };

    try {
      const response = await fetch(this.baseUrl, {
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

      const responseBody = await new Parser({
        explicitArray: false
      }).parseStringPromise(await response.text());

      return {
        packetId: responseBody.response?.result?.id,
        barcode: responseBody.response?.result?.barcode
      };
    } catch (error) {
      throw error;
    }
  }

  async cancel(packetId: string) {
    const requestBody = {
      packetDelete: {
        apiPassword: this.apiPassword,
        packetId
      }
    };

    const response = await fetch(this.baseUrl, {
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

    const responseBody = await new Parser({
      explicitArray: false
    }).parseStringPromise(await response.text());

    if (responseBody.response?.status !== 'ok') {
      throw new Error(
        `Packeta API returned error: ${responseBody.response?.fault || 'Unknown error'
        }`
      );
    }
  }

  async documents(packetId: string) {
    const requestBody = {
      packetLabelPdf: {
        apiPassword: this.apiPassword,
        packetId: packetId,
        format: 'A6 on A6',
        offset: 0
      }
    };

    const response = await fetch(this.baseUrl, {
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

      return [
        {
          name: `packeta-label-${packetId}.pdf`,
          base_64: pdfBase64,
          type: 'application/pdf'
        }
      ];
    } else {
      throw new Error(
        `Packeta API returned error: ${responseBody.response?.fault || 'Unknown error'
        }`
      );
    }
  }
}

export default PacketaClient
