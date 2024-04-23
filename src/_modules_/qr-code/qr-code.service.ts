import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';

@Injectable()
export class QrCodeService {
  async generateQrCode(data: string): Promise<string> {
    try {
      const qrCode = await QRCode.toDataURL(data);
      return qrCode;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error; // Or handle the error gracefully
    }
  }
}
