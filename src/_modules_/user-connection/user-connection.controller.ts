import { Controller, Get, Param, Post, Query } from "@nestjs/common";
import { UserConnectionService } from "./user-connection.service";
import { User } from "../../decorators/user.decorator";
import { Roles } from "../../decorators/role.decorator";
import { Role } from "../../types/auth.type";
import { FindUserConnectionDto } from "./user-connection.dto";
import { ApiTags } from "@nestjs/swagger";

@Controller("user-connection")
@ApiTags("user-connection")
export class UserConnectionController {
  constructor(private readonly userConnectionService: UserConnectionService) {
  }

  @Post("/:id")
  @Roles(Role.ALL)
  async create(@Param("id") targetId: string, @User("id") userId: string) {
    return this.userConnectionService.create(userId, targetId);
  }

  @Get()
  async find(@Query() findUserConnectionDto: FindUserConnectionDto) {
    return this.userConnectionService.find(findUserConnectionDto);
  }
}
