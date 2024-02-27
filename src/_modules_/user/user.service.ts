import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import { JwtService } from "@nestjs/jwt";
import { UpdateUserDto } from "./user.dto";
import { Prisma } from "@prisma/client";
import { FileService } from "../file/file.service";
import { BaseFileUploadDto, FileType } from "../file/file.dto";

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: FileService
  ) {
  }

  async update(userId: string, updateUserDto: UpdateUserDto) {
    const { fullName, country, address, phoneNumber, nickname, gender } = updateUserDto;

    const updateUserPayload: Prisma.UserUpdateInput = {};

    if (fullName) {
      updateUserPayload.fullName = fullName;
    }
    if (country) {
      updateUserPayload.country = country;
    }
    if (address) {
      updateUserPayload.address = address;
    }
    if (phoneNumber) {
      updateUserPayload.phoneNumber = phoneNumber;
    }
    if (nickname) {
      updateUserPayload.nickname = nickname;
    }
    if (gender) {
      updateUserPayload.gender = gender;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException("Not found user!");
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateUserPayload
    });

    return { success: true };
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("Not found user!");
    }

    const fileDto = { fileType: FileType.USER_AVATAR };
    const url = await this.fileService.uploadFile(file, fileDto);

    await Promise.all([
      this.prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: url }
      }),
      this.prisma.userImage.create({
        data: {
          url,
          userId
        }
      })
    ]);
    return {success: true}
  }

  async findOne(userId: string) {
    const user = await this.prisma.user.findUnique({where: {id: userId}})
    if (!user) {
      throw new NotFoundException('Not found user!')
    }
    return user
  }
}
