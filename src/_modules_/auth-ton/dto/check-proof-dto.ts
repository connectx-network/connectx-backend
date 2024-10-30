import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CHAIN } from 'src/types/blockhain.type';

export class DomainDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsNumber()
  lengthBytes: number;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  value: string;
}

export class ProofDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  timestamp: number;

  @ApiProperty({ type: DomainDto })
  @ValidateNested()
  @Type(() => DomainDto)
  domain: DomainDto;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @Transform((value) => value.value.trim())
  payload: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @Transform((value) => value.value.trim())
  signature: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @Transform((value) => value.value.trim())
  state_init: string;
}

export class CheckProofDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    required: true,
    enum: [CHAIN.MAINNET, CHAIN.TESTNET],
    default: CHAIN.MAINNET,
  })
  network: CHAIN;

  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  public_key: string;

  @ApiProperty({ type: ProofDto })
  @ValidateNested()
  @Type(() => ProofDto)
  proof: ProofDto;
}
