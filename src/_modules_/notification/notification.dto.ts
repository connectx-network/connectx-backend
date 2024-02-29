import {ApiProperty} from "@nestjs/swagger";
import {IsNotEmpty} from "class-validator";

export class SendNotificationDto {
    @ApiProperty({required: true})
    @IsNotEmpty()
    title: string
    @ApiProperty({required: true})
    @IsNotEmpty()
    body: string
    @ApiProperty({required: true})
    @IsNotEmpty()
    receiverId: string
}