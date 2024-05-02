import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { OptionalProperty } from 'src/decorators/validator.decorator';

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
  @OptionalProperty()
  deviceToken: string;

  @ApiProperty()
  tonProof: TonProof;
}

export class TonMessageDto {
  @ApiProperty({ required: true, description: 'This is required field' })
  @IsNotEmpty()
  address: string;
}
