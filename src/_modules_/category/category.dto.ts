import {IsNotEmpty} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";

export class CreateManyInterestDto {
    @ApiProperty({required: true, isArray: true})
    @IsNotEmpty()
    name: string[];
}