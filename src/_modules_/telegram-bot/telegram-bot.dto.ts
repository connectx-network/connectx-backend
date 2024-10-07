import { ApiProperty } from '@nestjs/swagger';

export class TelegramBotDto {
  @ApiProperty()
  username: number;

  @ApiProperty()
  message: string;
}
