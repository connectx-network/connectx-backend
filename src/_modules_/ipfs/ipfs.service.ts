import { PinataPinOptions } from '@pinata/sdk';
import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class IpfsService {
  private pinataInstance: AxiosInstance;

  constructor() {
    this.pinataInstance = axios.create({
      baseURL: 'https://api.pinata.cloud',
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

  async uploadFileToIpfs(body: any, options?: PinataPinOptions) {
    try {
      const res = await this.pinataInstance.post(
        '/pinning/pinFileToIPFS',
        {
          file: body,
          pinataOptions: options?.pinataOptions,
          pinataMetadata: options?.pinataMetadata,
        },
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );

      return res.data;
    } catch (error) {
      console.log(error);
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
