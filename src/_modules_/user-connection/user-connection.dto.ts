import { BasePagingDto, BasePagingResponse } from "../../types/base.type";
import { UserConnection } from "@prisma/client";
import {IsBool, OptionalProperty} from "../../decorators/validator.decorator";
import {IsBoolean, IsEnum, IsNotEmpty} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export enum FollowType {
  FOLLOWING = "FOLLOWING",
  FOLLOWER = "FOLLOWER"
}

export const ConnectionStatus = {
  CONNECTED: 'CONNECTED',
  NOT_CONNECTED: 'NOT_CONNECTED'
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

export class DeleteConnectionDto {
  @ApiProperty({ required: true})
  @IsNotEmpty()
  targetId: string
}

export class AcceptConnectionDto {
  @ApiProperty({ required: true})
  @IsNotEmpty()
  targetId: string
  @ApiProperty({ required: true})
  @IsBoolean()
  isAccepted: boolean
}