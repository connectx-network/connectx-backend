import { Body, Controller, Get, Param, Patch, Post, Put, UploadedFile, UseInterceptors } from "@nestjs/common";
import { UserService } from "./user.service";
import {ManualCreateUserDto, UpdateAvatarDto, UpdateUserDto} from "./user.dto";
import { Roles } from "../../decorators/role.decorator";
import { Role } from "../../types/auth.type";
import { User } from "../../decorators/user.decorator";
import { ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { SingleUploadDto } from "../file/file.dto";
import { UserTransformInterceptor } from "../../interceptors/user.interceptor";

@Controller("user")
@ApiTags('user')
export class UserController {
  constructor(private readonly userService: UserService) {
  }

  @Post('/import-event')
  @ApiBody({ type: ManualCreateUserDto })
  async importEventt(@Body() manualCreateUserDto: ManualCreateUserDto) {
    return this.userService.manualCreate(manualCreateUserDto);
  }

  @Put()
  @Roles(Role.ALL)
  @ApiBody({ type: UpdateUserDto })
  async update(@User("id") userId: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(userId, updateUserDto);
  }

  @Patch("/avatar")
  @Roles(Role.ALL)
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file"))
  @ApiBody({ type: UpdateAvatarDto })
  async updateAvatar(@User("id") userId: string, @UploadedFile() file: Express.Multer.File) {
    return this.userService.updateAvatar(userId, file);
  }

  @Get("/:id")
  @UseInterceptors(UserTransformInterceptor)
  async findOne(@Param("id") userId: string) {
    return this.userService.findOne(userId);
  }
}
