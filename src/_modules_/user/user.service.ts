import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto, UpdateUserInterestDto } from './user.dto';
import { Prisma } from '@prisma/client';
import { FileService } from '../file/file.service';
import { FileType } from '../file/file.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: FileService,
  ) {}

  async update(userId: string, updateUserDto: UpdateUserDto) {
    const {
      fullName,
      country,
      address,
      phoneNumber,
      nickname,
      description,
      company,
      gender,
      interests,
    } = updateUserDto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Not found user!');
    }

    const updateUserPayload: Prisma.UserUpdateInput = {};

    if (fullName) {
      updateUserPayload.fullName = fullName;
    }
    if (country) {
      updateUserPayload.country = country;
    }
    if (description) {
      updateUserPayload.description = description;
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
    if (company) {
      updateUserPayload.company = company;
    }
    if (gender) {
      updateUserPayload.gender = gender;
    }

    if (interests && interests.length > 0) {
      const [currentInterests, newInterests] = interests.reduce(
        (
          [withId, withoutId]: [
            UpdateUserInterestDto[],
            UpdateUserInterestDto[],
          ],
          obj: UpdateUserInterestDto,
        ) => {
          if (obj.id !== undefined) {
            withId.push(obj);
          } else {
            withoutId.push(obj);
          }
          return [withId, withoutId];
        },
        [[], []],
      );

      updateUserPayload.userInterests = {
        createMany: {
          data: newInterests,
        },
      };

      await Promise.all([
        this.prisma.userInterest.deleteMany({
          where: {
            userId: userId,
            id: {
              notIn: currentInterests.map((i) => i.id),
            },
          },
        }),
        Promise.all(
          currentInterests.map((i) => {
            return this.prisma.userInterest.update({
              where: { id: i.id },
              data: { name: i.name },
            });
          }),
        ),
      ]);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateUserPayload,
    });

    return { success: true };
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Not found user!');
    }

    const fileDto = { fileType: FileType.USER_AVATAR };
    const url = await this.fileService.uploadFile(file, fileDto);

    await Promise.all([
      this.prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: url },
      }),
      this.prisma.userImage.create({
        data: {
          url,
          userId,
        },
      }),
    ]);
    return { url };
  }

  async findOne(userId: string) {
    const [following, followers] = await Promise.all([
      this.prisma.userConnection.count({
        where: {
          userId,
        },
      }),
      this.prisma.userConnection.count({
        where: {
          followUserId: userId,
        },
      }),
    ]);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userInterests: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    if (!user) {
      throw new NotFoundException('Not found user!');
    }
    return { ...user, following, followers };
  }
}
