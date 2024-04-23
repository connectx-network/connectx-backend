import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

enum CHAIN {
  TESTNET = '-3',
  MAINNET = '-239',
}

export class TonProof {
  @ApiProperty()
  @IsNotEmpty()
  address: string;
  @ApiProperty({ enum: CHAIN })
  @IsNotEmpty()
  network: CHAIN;

  @ApiProperty({
    type: 'object',
    properties: {
      state_init: { type: 'string' },
      timestamp: { type: 'number' },
      domain: {
        type: 'object',
        properties: {
          lengthBytes: { type: 'number' },
          value: { type: 'string' },
        },
      },
      payload: { type: 'string' },
      signature: { type: 'string' },
    },
  })
  @IsNotEmpty()
  proof: {
    state_init: string;
    timestamp: number;
    domain: {
      lengthBytes: number;
      value: string;
    };
    payload: string;
    signature: string;
  };
}

export class CheckTonProof {
  @ApiProperty()
  @IsNotEmpty()
  deviceToken: string;

  @ApiProperty()
  tonProof: TonProof;
}

export class TonMessageDto {
  @ApiProperty({ required: true, description: 'This is required field' })
  @IsNotEmpty()
  address: string;
}

export const mock_proof = {
  address: '0:baffe1e86e07796e0362f43fe2e8bf34a2102466abdda0b67907adfb2d5dcc46',
  network: '-3',
  proof: {
    timestamp: 1713769407,
    domain: {
      lengthBytes: 14,
      value: 'localhost:5173',
    },
    signature:
      'AeZFmTtIAeRB3LkYMBxN2VNXCn9Jde2LizPSiR7W6mZKuDXOe/lGLWIDQMauKhw/Tvaoywe77VKMe7LLhSb5AQ==',
    payload: '$2b$10$bMlTX5OHY9oM4jQo9UICwu0IxTkqyxS2wzalDJ7xZodSWhnAV/UDq',
    state_init:
      'te6cckECFgEAAwQAAgE0AgEAUQAAAAApqaMXsgRajMxZnmxqgzafFGzYnwxZMg9keJwWSIiOQ7ECMtJAART/APSkE/S88sgLAwIBIAkEBPjygwjXGCDTH9Mf0x8C+CO78mTtRNDTH9Mf0//0BNFRQ7ryoVFRuvKiBfkBVBBk+RDyo/gAJKTIyx9SQMsfUjDL/1IQ9ADJ7VT4DwHTByHAAJ9sUZMg10qW0wfUAvsA6DDgIcAB4wAhwALjAAHAA5Ew4w0DpMjLHxLLH8v/CAcGBQAK9ADJ7VQAbIEBCNcY+gDTPzBSJIEBCPRZ8qeCEGRzdHJwdIAYyMsFywJQBc8WUAP6AhPLassfEss/yXP7AABwgQEI1xj6ANM/yFQgR4EBCPRR8qeCEG5vdGVwdIAYyMsFywJQBs8WUAT6AhTLahLLH8s/yXP7AAIAbtIH+gDU1CL5AAXIygcVy//J0Hd0gBjIywXLAiLPFlAF+gIUy2sSzMzJc/sAyEAUgQEI9FHypwICAUgTCgIBIAwLAFm9JCtvaiaECAoGuQ+gIYRw1AgIR6STfSmRDOaQPp/5g3gSgBt4EBSJhxWfMYQCASAODQARuMl+1E0NcLH4AgFYEg8CASAREAAZrx32omhAEGuQ64WPwAAZrc52omhAIGuQ64X/wAA9sp37UTQgQFA1yH0BDACyMoHy//J0AGBAQj0Cm+hMYALm0AHQ0wMhcbCSXwTgItdJwSCSXwTgAtMfIYIQcGx1Z70ighBkc3RyvbCSXwXgA/pAMCD6RAHIygfL/8nQ7UTQgQFA1yH0BDBcgQEI9ApvoTGzkl8H4AXTP8glghBwbHVnupI4MOMNA4IQZHN0crqSXwbjDRUUAIpQBIEBCPRZMO1E0IEBQNcgyAHPFvQAye1UAXKwjiOCEGRzdHKDHrFwgBhQBcsFUAPPFiP6AhPLassfyz/JgED7AJJfA+IAeAH6APQEMPgnbyIwUAqhIb7y4FCCEHBsdWeDHrFwgBhQBMsFJs8WWPoCGfQAy2kXyx9SYMs/IMmAQPsABm1bQkM=',
  },
};
