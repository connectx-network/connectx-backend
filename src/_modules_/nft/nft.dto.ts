import { ApiProperty } from "@nestjs/swagger";

export class CreateCollectionDto {

    @ApiProperty()
    name: string;

    @ApiProperty()
    description: string;
}