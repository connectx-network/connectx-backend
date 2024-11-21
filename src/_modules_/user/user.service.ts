import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  FindUserDto,
  GetUserNFTDto,
  GetUserNFTsDto,
  UpdateSettingDto,
  UpdateUserDto,
  UpdateUserInterestType,
} from './user.dto';
import { FileType, Prisma } from '@prisma/client';
import { FileService } from '../file/file.service';
import { Queues } from '../../types/queue.type';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { getDefaultPaginationReponse } from '../../utils/pagination.util';
import { NFTSolanaHelper } from 'src/helpers/solana-blockchain/nft';
import { publicKey } from '@metaplex-foundation/umi';
import { SPLTokenMetaplex } from 'src/helpers/solana-blockchain/spl-token';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: FileService,
    @InjectQueue(Queues.mail) private readonly mailTaskQueue: Queue,
  ) {}

  async update(telegramId: number, updateUserDto: UpdateUserDto) {
    const {
      fullName,
      address,
      phoneNumber,
      nickname,
      description,
      company,
      jobTitle,
      shortId,
      gender,
      categories,
      cityId,
      isPrivate,
      isPrivateFeeds,
      linkedInUrl,
      twitterUrl,
      customLinks,
    } = updateUserDto;

    const user = await this.prisma.user.findUnique({
      where: { telegramId: `${telegramId}` },
      include: {
        userCategories: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Not found user!');
    }

    const updateUserPayload: Prisma.UserUpdateInput = {
      userCategories: {},
      userCities: {},
    };

    if (fullName) {
      updateUserPayload.fullName = fullName;
    }

    if (isPrivate === true) {
      updateUserPayload.isPrivate = true;
    } else if (isPrivate === false) {
      updateUserPayload.isPrivate = false;
    }

    if (isPrivateFeeds === true) {
      updateUserPayload.isPrivateFeeds = true;
    } else if (isPrivateFeeds === false) {
      updateUserPayload.isPrivateFeeds = false;
    }

    if (shortId) {
      const shortIdUserFind = await this.prisma.user.findUnique({
        where: { shortId },
      });
      if (shortIdUserFind) {
        throw new ConflictException('Short Id is already used!');
      }
      updateUserPayload.shortId = shortId;
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
    if (jobTitle) {
      updateUserPayload.jobTitle = jobTitle;
    }
    if (gender) {
      updateUserPayload.gender = gender;
    }
    if (linkedInUrl) {
      updateUserPayload.linkedInUrl = linkedInUrl;
    }
    if (twitterUrl) {
      updateUserPayload.twitterUrl = twitterUrl;
    }
    if (customLinks) {
      updateUserPayload.userSocials = {
        createMany: {
          data: customLinks.map((item) => ({ url: item })),
        },
      };
    }

    if (categories && categories.length > 0) {
      const { userCategories } = user;
      const connectIds = categories.filter(
        (item) => !userCategories.find((i) => i.categoryId === item),
      );
      const deleteIds = userCategories.filter(
        (item) => !categories.find((i) => i === item.categoryId),
      );
      console.log('userCategories', userCategories);
      console.log('connectIds', connectIds);
      console.log('deleteIds', deleteIds);

      updateUserPayload.userCategories.createMany = {
        data: connectIds.map((item) => ({ categoryId: item })),
      };
      updateUserPayload.userCategories.deleteMany = deleteIds.map((item) => ({
        id: item.id,
      }));
    }

    if (cityId) {
      updateUserPayload.userCities.connectOrCreate = {
        where: {
          userId_cityId: {
            userId: user.id,
            cityId,
          },
        },
        create: {
          cityId,
        },
      };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: updateUserPayload,
    });

    return { success: true };
  }

  async updateAvatar(telegramId: number, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({
      where: { telegramId: `${telegramId}` },
    });
    if (!user) {
      throw new NotFoundException('Not found user!');
    }

    const fileDto = { fileType: FileType.USER_AVATAR };
    const url = await this.fileService.uploadFile(file, fileDto);

    await Promise.all([
      this.prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl: url },
      }),
      this.prisma.userImage.create({
        data: {
          url,
          userId: user.id,
        },
      }),
    ]);
    return { url };
  }

  async delete(telegramId: number) {
    const user = await this.prisma.user.findUnique({
      where: { telegramId: `${telegramId}` },
    });
    if (!user) {
      throw new NotFoundException('Not found user!');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isDeleted: true,
      },
    });

    return { success: true };
  }

  async deleteHard(telegramId: number) {
    const user = await this.prisma.user.findUnique({
      where: { telegramId: `${telegramId}` },
    });
    if (!user) {
      throw new NotFoundException('Not found user!');
    }

    await this.prisma.user.delete({
      where: { id: user.id },
    });

    return { success: true };
  }

  async findOne(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userCategories: {
          select: {
            category: true,
          },
        },
      },
    });
    if (!user) {
      throw new NotFoundException('Not found user!');
    }
    const [following, followers] = await Promise.all([
      this.prisma.userConnection.count({
        where: {
          userId,
        },
      }),
      this.prisma.userConnection.count({
        where: {
          targetId: userId,
        },
      }),
    ]);
    return { ...user, following, followers };
  }

  async findForTelegram(telegramId: string, findUserDto: FindUserDto) {
    const currentUser = await this.prisma.user.findUnique({
      where: {
        telegramId,
      },
    });

    if (!currentUser) {
      throw new NotFoundException('Not found current user!');
    }

    const { query, size, page } = findUserDto;

    const skip = (page - 1) * size;

    const filter: Prisma.UserWhereInput = {
      isDeleted: false,
    };

    if (query) {
      filter.OR = [
        {
          fullName: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          telegramUsername: {
            contains: query,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [users, count] = await Promise.all([
      this.prisma.user.findMany({
        where: filter,
        take: size,
        skip,
        include: {
          followers: {
            where: {
              userId: currentUser.id,
            },
          },
          following: {
            where: {
              targetId: currentUser.id,
            },
          },
          _count: {
            select: {
              followers: true,
              following: true,
            },
          },
        },
      }),
      this.prisma.user.count({
        where: filter,
      }),
    ]);

    const data = users.map((item) => {
      const newItem = { ...item };
      const isFollowing = !!item.followers.find(
        (i) => i.userId === currentUser.id,
      );
      const isFollower = !!item.following.find(
        (i) => i.targetId === currentUser.id,
      );

      delete newItem.following;
      delete newItem.followers;

      return { ...newItem, isFollowing, isFollower };
    });

    return {
      ...getDefaultPaginationReponse(findUserDto, count),
      data,
    };
  }

  async findOneForTelegram(telegramId: string, userId: string) {
    const currentUser = await this.prisma.user.findUnique({
      where: {
        telegramId,
      },
    });

    if (!currentUser) {
      throw new NotFoundException('Not found current user!');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userCategories: {
          select: {
            category: true,
          },
        },
        followers: {
          where: {
            userId: currentUser.id,
          },
        },
        following: {
          where: {
            targetId: currentUser.id,
          },
        },
        userSocials: true,
      },
    });
    if (!user) {
      throw new NotFoundException('Not found user!');
    }

    const [followers, following] = await Promise.all([
      this.prisma.userConnection.count({
        where: {
          targetId: userId,
        },
      }),
      this.prisma.userConnection.count({
        where: {
          userId,
        },
      }),
    ]);
    const isFollowing = !!user.followers.find(
      (i) => i.userId === currentUser.id,
    );
    const isFollower = !!user.following.find(
      (i) => i.targetId === currentUser.id,
    );
    return { ...user, following, followers, isFollowing, isFollower };
  }

  async updateSetting(telegramId: number, updateSettingDto: UpdateSettingDto) {
    const { isPrivate } = updateSettingDto;

    const user = await this.prisma.user.findUnique({
      where: {
        telegramId: `${telegramId}`,
      },
    });

    if (!user) {
      throw new NotFoundException('Not found user!');
    }

    const updateSettingPayload: Prisma.UserUncheckedUpdateInput = {};

    if (isPrivate) {
      if (isPrivate === 'Y') {
        updateSettingPayload.isPrivate = true;
      } else if (isPrivate === 'N') {
        updateSettingPayload.isPrivate = false;
      }
    }

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: updateSettingPayload,
    });

    return { success: true };
  }

  async findUserByTelegramId(telegramId: string) {
    return this.prisma.user.findUnique({
      where: {
        telegramId,
      },
    });
  }

  // Get list user nft 
  async getUserNfts(telegramId: number, getUserNFTsDto: GetUserNFTsDto) {
    const user = await this.prisma.user.findUnique({
      where: { telegramId: `${telegramId}` },
    });

    if (!user) {
      throw new NotFoundException('Not found user!');
    }

    // pagination
    const { size, page } = getUserNFTsDto;
    const skip = (page - 1) * size;

    if (!user?.solanaAddress) {
      return [];
    }

    const solanaAddres = user.solanaAddress;

    const nftServiceHelper = new NFTSolanaHelper();

    // get list nft belong user by userAddress
    let userNfts = await nftServiceHelper.getUserNfts(
      publicKey(solanaAddres),
    );

    // pagination manually
    userNfts = userNfts.slice(skip, skip + size); 
    let res = [];
    
    for (let userNft of userNfts) {
      const event = await this.prisma.nftCollection.findFirst({
        where: {
          nftCollectionAddress: userNft.nftCollectionAddress,
        },
        select: {
          event: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
        },
      });

      res.push({ ...event, nft: userNft });
    }
    return {res, metadata: getDefaultPaginationReponse(getUserNFTsDto,res.length)};
  }

  // Get user nft
  async getUserNft(telegramId: number, nftAddress: GetUserNFTDto) {
    const nft = nftAddress.nftAddress;
    const user = await this.prisma.user.findUnique({
      where: { telegramId: `${telegramId}` },
    });

    if (!user) {
      throw new NotFoundException('Not found user!');
    }

    if (!user?.solanaAddress) {
      return [];
    }

    const solanaAddres = user.solanaAddress;

    const nftServiceHelper = new NFTSolanaHelper();

    // get user nft through ownerAddress and nft Address
    const userNft = await nftServiceHelper.getUserNft(
      publicKey(solanaAddres),
      nft,
    );

    if (!userNft?.nftCollectionAddress) {
      throw new BadRequestException('Can not found collection address');
    }

    const event = await this.prisma.nftCollection.findFirst({
      where: {
        nftCollectionAddress: userNft.nftCollectionAddress,
      },
      select: {
        event: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
    });

    return { ...event, nft: userNft };
  }

  async getRoyalTokenBalanceSolana(telegramId: number) {
    const user = await this.prisma.user.findUnique({
      where: { telegramId: `${telegramId}` },
    });

    if (!user) {
      throw new NotFoundException('Not found user!');
    }
    
    const splTokenInstance = new SPLTokenMetaplex(); 

    if(!user?.solanaAddress) {
      return {royaltyTokenBalance: 0}
    }
    
    const balance = await splTokenInstance.getSplTokenBalance(user?.solanaAddress); 


    return {royaltyTokenBalance: balance/(Math.pow(10,9))}
  }

  // async createMany(emails: string[]) {
  //   return Promise.all(
  //     emails.map(async (email) => {
  //       const createdUser = await this.prisma.user.findUnique({
  //         where: { email },
  //       });
  //
  //       if (createdUser) {
  //         return createdUser;
  //       }
  //
  //       const fullName = email.match(/^([^@]*)@/)[1];
  //
  //       return this.prisma.user.create({
  //         data: {
  //           email,
  //           fullName,
  //           activated: true,
  //         },
  //       });
  //     }),
  //   );
  // }

  // async manualCreate(manualCreateUserDto: ManualCreateUserDto) {
  //   const {
  //     company,
  //     fullName,
  //     email,
  //     jobTitle,
  //     phaseIds,
  //     eventId,
  //     knowEventBy,
  //     linkedInUrl,
  //     telegramId,
  //     companyUrl,
  //     userId,
  //   } = manualCreateUserDto;
  //
  //   const findUserCondition: Prisma.UserWhereUniqueInput = userId
  //     ? { id: userId }
  //     : { email };
  //
  //   const [event, foundUser] = await Promise.all([
  //     this.prisma.event.findUnique({
  //       where: { id: eventId },
  //     }),
  //     this.prisma.user.findUnique({
  //       where: findUserCondition,
  //     }),
  //   ]);
  //
  //   if (!event) {
  //     throw new NotFoundException('Not found event!');
  //   }
  //
  //   if (foundUser) {
  //     const joinedEventUser = await this.prisma.joinedEventUser.findUnique({
  //       where: {
  //         userId_eventId: {
  //           userId: foundUser.id,
  //           eventId,
  //         },
  //       },
  //     });
  //
  //     if (joinedEventUser) {
  //       throw new ConflictException('User has joined this event!');
  //     }
  //
  //     await this.prisma.eventUserTemp.create({
  //       data: {
  //         company,
  //         fullName,
  //         email,
  //         jobTitle,
  //         eventId,
  //         knowEventBy,
  //         linkedInUrl,
  //         telegramId,
  //         companyUrl,
  //       },
  //     });
  //
  //     const joinedEventPayload: Prisma.JoinedEventUserUncheckedCreateInput = {
  //       userId: foundUser.id,
  //       eventId,
  //     };
  //
  //     if (knowEventBy) {
  //       joinedEventPayload.knowEventBy = knowEventBy;
  //     }
  //
  //     let joinedEventPhaseUsersPayload: Prisma.JoinedEventPhaseUserUncheckedCreateInput[] =
  //       [];
  //
  //     if (phaseIds) {
  //       joinedEventPhaseUsersPayload = phaseIds.map((item) => ({
  //         userId: foundUser.id,
  //         eventId,
  //         eventPhaseId: item,
  //       }));
  //     }
  //
  //     await Promise.all([
  //       this.prisma.joinedEventUser.create({
  //         data: joinedEventPayload,
  //       }),
  //       this.prisma.joinedEventPhaseUser.createMany({
  //         data: joinedEventPhaseUsersPayload,
  //       }),
  //     ]);
  //
  //     const payload = {
  //       eventId,
  //       subject: `Ticket for ${event.name}`,
  //       eventName: event.name,
  //       fullName,
  //       to: email,
  //       userId: foundUser.id,
  //       fromDate: event.eventDate,
  //     };
  //
  //     await this.mailTaskQueue.add(MailJob.sendQrMail, payload);
  //
  //     return { success: true };
  //   } else {
  //     const password = this.generatePassword();
  //     const saltOrRounds = +process.env.USER_SALT;
  //     const encryptedPassword = await hash(password, saltOrRounds);
  //
  //     const createUserInput: Prisma.UserUncheckedCreateInput = {
  //       email,
  //       fullName,
  //       company,
  //       password: encryptedPassword,
  //       activated: true,
  //     };
  //     if (jobTitle) {
  //       createUserInput.jobTitle = jobTitle;
  //     }
  //     if (linkedInUrl) {
  //       createUserInput.linkedInUrl = linkedInUrl;
  //     }
  //     if (companyUrl) {
  //       createUserInput.companyUrl = companyUrl;
  //     }
  //     if (telegramId) {
  //       createUserInput.telegramId = telegramId;
  //     }
  //     if (knowEventBy) {
  //       createUserInput.joinedEventUsers = {
  //         create: {
  //           eventId,
  //           knowEventBy,
  //         },
  //       };
  //     } else {
  //       createUserInput.joinedEventUsers = {
  //         create: {
  //           eventId,
  //         },
  //       };
  //     }
  //
  //     if (phaseIds) {
  //       createUserInput.joinedEventPhaseUsers = {
  //         createMany: {
  //           data: phaseIds.map((item) => ({
  //             eventId,
  //             eventPhaseId: item,
  //           })),
  //         },
  //       };
  //     }
  //
  //     const user = await this.prisma.user.create({
  //       data: createUserInput,
  //     });
  //
  //     const payload = {
  //       eventId,
  //       subject: `Ticket for ${event.name}`,
  //       eventName: event.name,
  //       fullName,
  //       password,
  //       to: email,
  //       userId: user.id,
  //       fromDate: event.eventDate,
  //     };
  //
  //     await this.mailTaskQueue.add(MailJob.sendSingleQrImported, payload);
  //
  //     return { success: true };
  //   }
  // }

  private generatePassword(): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    const specialChars = '@%&*?';
    const passwordElements = [
      lowercase[Math.floor(Math.random() * lowercase.length)],
      uppercase[Math.floor(Math.random() * uppercase.length)],
      digits[Math.floor(Math.random() * digits.length)],
      specialChars[Math.floor(Math.random() * specialChars.length)],
    ];
    const passwordLength = 8;
    while (passwordElements.length < passwordLength) {
      const charSet = [lowercase, uppercase, digits, specialChars];
      const randomSetIndex = Math.floor(Math.random() * charSet.length);
      passwordElements.push(
        charSet[randomSetIndex][
          Math.floor(Math.random() * charSet[randomSetIndex].length)
        ],
      );
    }
    passwordElements.sort(() => Math.random() - 0.5);

    return passwordElements.join('');
  }
}
