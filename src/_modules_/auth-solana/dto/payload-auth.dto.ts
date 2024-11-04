import { ApiProperty } from "@nestjs/swagger";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateAuthSolanaDto {
 @ApiProperty({required: true})
 @IsArray()
 @ArrayMinSize(64)
 @ArrayMaxSize(64)
 signature: number[]; 

 @ApiProperty({required: true})
 @IsArray()
 @ArrayMinSize(32)
 @ArrayMaxSize(32)
 publicKey: number[]; 

 @ApiProperty({required: true})
 @IsNumber()
 deadline: number; 

 @ApiProperty({required: true})
 @IsNotEmpty()
 @IsString()
 address: string; 

 @ApiProperty({required: true})
 @IsNotEmpty()
 @IsString()
 uuid: string; 
}
