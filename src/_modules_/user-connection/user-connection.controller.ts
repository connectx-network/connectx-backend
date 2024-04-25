import {Body, Controller, Delete, Get, Param, Post, Query} from '@nestjs/common';
import { UserConnectionService } from './user-connection.service';
import { User } from '../../decorators/user.decorator';
import { Roles } from '../../decorators/role.decorator';
import { Role } from '../../types/auth.type';
import {AcceptConnectionDto, DeleteConnectionDto, FindUserConnectionDto} from './user-connection.dto';
import { ApiTags } from '@nestjs/swagger';

@Controller('user-connection')
@ApiTags('user-connection')
export class UserConnectionController {
  constructor(private readonly userConnectionService: UserConnectionService) {}

  @Post('/accept')
  @Roles(Role.ALL)
  async accept(@User('id') userId: string, @Body() acceptConnectionDto: AcceptConnectionDto) {
    return this.userConnectionService.acceptConnection(userId, acceptConnectionDto)
  }
  @Post('/:id')
  @Roles(Role.ALL)
  async create(@Param('id') targetId: string, @User('id') userId: string) {
    return this.userConnectionService.create(userId, targetId);
  }

  @Get('/relation/:targetId')
  @Roles(Role.ALL)
  async getRelationship(
    @Param('targetId') targetId: string,
    @User('id') userId: string,
  ) {
    return this.userConnectionService.getRelationship(userId, targetId);
  }

  @Get()
  async find(@Query() findUserConnectionDto: FindUserConnectionDto) {
    return this.userConnectionService.find(findUserConnectionDto);
  }

  @Delete()
  @Roles(Role.ALL)
  async delete(@Body() deleteConnectionDto: DeleteConnectionDto, @User('id') userId: string) {
    const {targetId} = deleteConnectionDto
    return this.userConnectionService.delete(userId, targetId)
  }
}
