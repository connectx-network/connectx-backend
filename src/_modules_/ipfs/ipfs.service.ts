import { PinataPinOptions } from '@pinata/sdk';
import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import path from 'path';
import fs from 'fs';

@Injectable()
export class IpfsService {
  private pinataInstance: AxiosInstance;

  constructor() {
    this.pinataInstance = axios.create({
      baseURL: `${process.env.PIANTE_BASE_URL}`,
      headers: {
        Authorization: `Bearer ${process.env.PINATA_API_JWT}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async uploadJsonToIpfs(body: any, options?: PinataPinOptions) {
    try {
      const res = await this.pinataInstance.post('/pinning/pinJSONToIPFS', {
        pinataContent: body,
        pinataOptions: options?.pinataOptions,
        pinataMetadata: options?.pinataMetadata,
      });

      return res.data;
    } catch (error) {
      console.log(error);
      throw new Error(error?.message || 'Something went wrong');
    }
  }

  async uploadFileToIpfs(imageDataUrl: any, options?: PinataPinOptions) {
    const base64Data: string = imageDataUrl.split(',')[1];

    // Convert base64 to binary
    const binaryData: string = atob(base64Data);

    // Create an ArrayBuffer with the correct length
    const length: number = binaryData.length;
    const buffer: ArrayBuffer = new ArrayBuffer(length);

    // Create a view (as an 8-bit unsigned integer) into the buffer
    const view: Uint8Array = new Uint8Array(buffer);

    // Fill the view with binary data
    for (let i = 0; i < length; i++) {
      view[i] = binaryData.charCodeAt(i);
    }

    // Create a Blob from the ArrayBuffer
    const blob: Blob = new Blob([buffer], { type: 'image/png' });
    const form = new FormData();
    form.append('file', blob);
    if (options?.pinataMetadata) {
      form.append('pinataMetadata', JSON.stringify(options.pinataMetadata));
    }
    if (options?.pinataOptions) {
      form.append('pinataOptions', JSON.stringify(options.pinataOptions));
    }

    try {
      const res = await this.pinataInstance.post(
        '/pinning/pinFileToIPFS',
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );

      return res.data;
    } catch (error) {
      throw new Error(error?.message || 'Something went wrong');
    }
  }

  async unPinIpfs(hash: string) {
    try {
      const res = await this.pinataInstance.delete(`/pinning/unpin/${hash}`);
      return res.data;
    } catch (error) {
      console.log(error);
    }
  }
}
