import {ApiProperty} from "@nestjs/swagger";
import {IsNotEmpty} from "class-validator";

export class CreateEventCategoryDto {
    @ApiProperty({required: true, description: "This is required field"})
    @IsNotEmpty()
    name: string;
}