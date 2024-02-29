import { BasePagingDto, BasePagingResponse } from "../../types/base.type";
import { UserConnection } from "@prisma/client";
import { OptionalProperty } from "../../decorators/validator.decorator";
import { IsEnum, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export enum FollowType {
  FOLLOWING = "FOLLOWING",
  FOLLOWER = "FOLLOWER"
}

export const ConnectionStatus = {
  FRIEND: "FRIEND",
  NO_CONNECTION: "NO_CONNECTION",
  FOLLOWING: "FOLLOWING",
  FOLLOWER: "FOLLOWER"
} as const

export class FindUserConnectionDto extends BasePagingDto {
  @ApiProperty({ required: true, description: "This is required field!" })
  @IsNotEmpty()
  userId: string;
  @ApiProperty({ required: true, description: "This is required field!", enum: FollowType })
  @IsEnum(FollowType)
  @IsNotEmpty()
  followType: FollowType;
  @OptionalProperty()
  query: string;
}

export class FindUserConnectionResponse extends BasePagingResponse<UserConnection> {
}

