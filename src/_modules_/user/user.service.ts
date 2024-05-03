import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  ManualCreateUserDto,
  UpdateUserDto,
  UpdateUserInterestDto
} from "./user.dto";
import { Prisma } from "@prisma/client";
import { FileService } from "../file/file.service";
import { FileType } from "../file/file.dto";
import { hash } from "bcrypt";
import { MailJob, Queues } from "../../types/queue.type";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: FileService,
    @InjectQueue(Queues.mail) private readonly mailTaskQueue: Queue
  ) {
  }

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
      interests
    } = updateUserDto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException("Not found user!");
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
          obj: UpdateUserInterestDto
        ) => {
          if (obj.id !== undefined) {
            withId.push(obj);
          } else {
            withoutId.push(obj);
          }
          return [withId, withoutId];
        },
        [[], []]
      );

      updateUserPayload.userInterests = {
        createMany: {
          data: newInterests
        }
      };

      await Promise.all([
        this.prisma.userInterest.deleteMany({
          where: {
            userId: userId,
            id: {
              notIn: currentInterests.map((i) => i.id)
            }
          }
        }),
        Promise.all(
          currentInterests.map((i) => {
            return this.prisma.userInterest.update({
              where: { id: i.id },
              data: { name: i.name }
            });
          })
        )
      ]);
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
    return { url };
  }

  async findOne(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userInterests: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    if (!user) {
      throw new NotFoundException("Not found user!");
    }
    const [following, followers] = await Promise.all([
      this.prisma.userConnection.count({
        where: {
          userId
        }
      }),
      this.prisma.userConnection.count({
        where: {
          followUserId: userId
        }
      })
    ]);
    return { ...user, following, followers };
  }

  async createMany(emails: string[]) {
    return Promise.all(
      emails.map(async (email) => {
        const createdUser = await this.prisma.user.findUnique({
          where: { email }
        });

        if (createdUser) {
          return createdUser;
        }

        const fullName = email.match(/^([^@]*)@/)[1];

        return this.prisma.user.create({
          data: {
            email,
            fullName,
            activated: true
          }
        });
      })
    );
  }

  async manualCreate(manualCreateUserDto: ManualCreateUserDto) {
    const {
      company,
      gender,
      country,
      address,
      phoneNumber,
      nickname,
      fullName,
      email,
      jobTitle,
      phaseIds,
      eventId,
      knowEventBy
    } = manualCreateUserDto;

    const [event, foundUser] = await Promise.all([
      this.prisma.event.findUnique({
        where: { id: eventId }
      }),
      this.prisma.user.findUnique({
        where: {
          email
        }
      })
    ]);

    if (!event) {
      throw new NotFoundException("Not found event!");
    }

    if (foundUser) {

      const joinedEventUser = await this.prisma.joinedEventUser.findUnique({
        where: {
          userId_eventId: {
            userId: foundUser.id,
            eventId
          }
        }
      });

      if (joinedEventUser) {
        throw new ConflictException("User has joined this event!");
      }

      const joinedEventPayload: Prisma.JoinedEventUserUncheckedCreateInput = { userId: foundUser.id, eventId };

      if (knowEventBy) {
        joinedEventPayload.knowEventBy = knowEventBy;
      }

      let joinedEventPhaseUsersPayload: Prisma.JoinedEventPhaseUserUncheckedCreateInput[] = [];

      if (phaseIds) {
        joinedEventPhaseUsersPayload = phaseIds.map((item) => ({
          userId: foundUser.id,
          eventId,
          eventPhaseId: item
        }));
      }

      await Promise.all([this.prisma.joinedEventUser.create({
        data: joinedEventPayload
      }), this.prisma.joinedEventPhaseUser.createMany({
        data: joinedEventPhaseUsersPayload
      })]);

      const payload = {
        eventId,
        subject: `Ticket for ${event.name}`,
        eventName: event.name,
        fullName,
        to: email,
        userId: foundUser.id,
        fromDate: event.eventDate
      };

      await this.mailTaskQueue.add(MailJob.sendQrMail, payload);

      return { success: true };

    } else {
      const password = this.generatePassword();
      const saltOrRounds = +process.env.USER_SALT;
      const encryptedPassword = await hash(password, saltOrRounds);

      const createUserInput: Prisma.UserUncheckedCreateInput = {
        email,
        fullName,
        phoneNumber,
        company,
        gender,
        password: encryptedPassword,
        activated: true
      };

      if (country) {
        createUserInput.country = country;
      }
      if (address) {
        createUserInput.address = address;
      }
      if (nickname) {
        createUserInput.nickname = nickname;
      }
      if (jobTitle) {
        createUserInput.jobTitle = jobTitle;
      }

      if (knowEventBy) {
        createUserInput.joinedEventUsers = {
          create: {
            eventId,
            knowEventBy
          }
        };
      } else {
        createUserInput.joinedEventUsers = {
          create: {
            eventId
          }
        };
      }

      if (phaseIds) {
        createUserInput.joinedEventPhaseUsers = {
          createMany: {
            data: phaseIds.map((item) => ({
              eventId,
              eventPhaseId: item
            }))
          }
        };
      }

      const user = await this.prisma.user.create({
        data: createUserInput
      });

      const payload = {
        eventId,
        subject: `Ticket for ${event.name}`,
        eventName: event.name,
        fullName,
        password,
        to: email,
        userId: user.id,
        fromDate: event.eventDate
      };

      await this.mailTaskQueue.add(MailJob.sendSingleQrImported, payload);

      return { success: true };
    }
  }

  private generatePassword(): string {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const digits = "0123456789";
    const specialChars = "@%&*?";
    const passwordElements = [
      lowercase[Math.floor(Math.random() * lowercase.length)],
      uppercase[Math.floor(Math.random() * uppercase.length)],
      digits[Math.floor(Math.random() * digits.length)],
      specialChars[Math.floor(Math.random() * specialChars.length)]
    ];
    const passwordLength = 8;
    while (passwordElements.length < passwordLength) {
      const charSet = [lowercase, uppercase, digits, specialChars];
      const randomSetIndex = Math.floor(Math.random() * charSet.length);
      passwordElements.push(
        charSet[randomSetIndex][
          Math.floor(Math.random() * charSet[randomSetIndex].length)
          ]
      );
    }
    passwordElements.sort(() => Math.random() - 0.5);

    return passwordElements.join("");
  }
}
