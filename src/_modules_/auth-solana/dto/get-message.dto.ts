import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class GetMessageDto {
 @ApiProperty({required: true})
 @IsNotEmpty()
 @IsString()
 address: string; 

 @ApiProperty({required: true})
 @IsNotEmpty()
 @IsString()
 uuid: string; 
}
