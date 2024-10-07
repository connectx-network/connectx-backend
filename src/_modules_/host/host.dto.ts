import { ApiProperty } from '@nestjs/swagger';
import { HostPermission } from '@prisma/client';
import { IsBoolean } from 'class-validator';

export class FindHostDto {
  @ApiProperty()
  eventId: string;
}

export class AddHostRequestDto {
  @ApiProperty()
  eventId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({
    enum: Object.values(HostPermission),
    example: HostPermission.MANAGER,
  })
  permission: HostPermission;

  @ApiProperty()
  @IsBoolean()
  showOnEventPage: boolean;
}

export class UpdateHostRequestDto extends AddHostRequestDto {
  @ApiProperty()
  @IsBoolean()
  accepted: boolean;

  @ApiProperty()
  id: string;
}

export class AcceptOrRejectHostDto {
  @ApiProperty()
  accept: boolean;

  @ApiProperty()
  id: string;
}

export class DeleteHostDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  eventId: string;
}
