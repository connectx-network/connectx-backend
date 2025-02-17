import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddFavoriteDto,
  BaseInteractEventDto,
  CheckInByAdminDto,
  CheckInByQrDto,
  CreateEventDto,
  CreateEventInvitationDto,
  CreateInvitationDto,
  DeleteEventDto,
  FindCreatedEventDto,
  FindEventDto,
  FindEventFriendDto,
  FindEventGuestDto,
  FindEventResponse,
  FindFeedDto,
  FindJoinedEventUserDto,
  GetEventInsightDto,
  InsightFilterType,
  JoinEventDto,
  UpdateEventDto,
  UpdateEventSponsorsDto,
  UpdateGuestStatusDto,
  UpdateHighlightEventDto,
  UpdateSponsorDto,
} from './event.dto';
import {
  Event,
  EventAsset,
  EventAssetType,
  EventScope,
  HostPermission,
  JoinedEventSponsorStatus,
  JoinedEventUserStatus,
  Prisma,
  User,
} from '@prisma/client';
import { getDefaultPaginationReponse } from '../../utils/pagination.util';
import * as moment from 'moment-timezone';
import { NotificationMessage } from '../../types/notification.type';
import { NotificationService } from '../notification/notification.service';
import { QrCodeDto } from '../mail/mail.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { MailJob, Queues } from '../../types/queue.type';
import { UserService } from '../user/user.service';
import * as ExcelJS from 'exceljs';
import { TelegramBotService } from '../telegram-bot/telegram-bot.service';
import DurationConstructor = moment.unitOfTime.DurationConstructor;
import { NftSolanaService } from '../nft/nft-solana.service';
import { RoyaltySolanaTokenService } from '../royalty-token-solana/royalty-token-solana.service';

@Injectable()
export class EventService {
  private timezone = process.env.DEFAULT_TIMEZONE;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly userService: UserService,
    private readonly telegramBotService: TelegramBotService,
    @InjectQueue(Queues.mail) private readonly mailTaskQueue: Queue,
    private readonly nftSolanaService: NftSolanaService,
    private readonly royaltySolanaTokenService: RoyaltySolanaTokenService,
  ) {}

  async create(telegramId: number, createEventDto: CreateEventDto) {
    const {
      eventCategoryId,
      eventDate,
      description,
      location,
      eventEndDate,
      ticketPrice,
      title,
      cityId,
      content,
      mapsUrl,
      ticketType,
      tags,
      assets,
      hosts,
      sponsors,
      socials,
      eventScope,
      numberOfTicket,
    } = createEventDto;
    const shortId = await this.generateUniqueCode();

    const user = await this.prisma.user.findUnique({
      where: {
        telegramId: `${telegramId}`,
      },
    });

    if (!user) {
      throw new NotFoundException('Not found user');
    }

    const createEventPayload: Prisma.EventUncheckedCreateInput = {
      userId: user.id,
      eventCategoryId,
      eventDate,
      eventEndDate,
      shortId,
      title,
      eventScope,
    };

    if (description) {
      createEventPayload.description = description;
    }
    if (cityId) {
      createEventPayload.cityId = cityId;
    }
    if (mapsUrl) {
      createEventPayload.mapsUrl = mapsUrl;
    }
    if (content) {
      createEventPayload.content = content;
    }
    if (location) {
      createEventPayload.location = location;
    }
    if (ticketPrice) {
      createEventPayload.ticketPrice = ticketPrice;
    }
    if (ticketType) {
      createEventPayload.ticketType = ticketType;
    }
    if (numberOfTicket) {
      createEventPayload.numberOfTicket = numberOfTicket;
    }

    if (tags) {
      createEventPayload.eventTags = {
        createMany: {
          data: tags.map((item) => ({ title: item })),
        },
      };
    }

    if (sponsors) {
      createEventPayload.eventSponsors = {
        createMany: {
          data: sponsors.map((item) => ({ ...item })),
        },
      };
    }

    // get social for mint nft
    let socialLinks = [];

    if (socials) {
      createEventPayload.eventSocials = {
        createMany: {
          data: socials.map((item) => {
            socialLinks.push(item.url);
            return { ...item };
          }),
        },
      };
    }

    if (assets) {
      createEventPayload.eventAssets = {
        createMany: {
          data: assets.map((item) => ({
            url: item.url,
            type: item.type,
          })),
        },
      };
    }

    const hostIds = hosts
      ? hosts.map((host) => ({
          userId: host.userId,
          permission: HostPermission.MANAGER,
          accepted: true,
        }))
      : [];

    const addHostIds = [
      ...hostIds,
      ...[
        { userId: user.id, permission: HostPermission.CREATOR, accepted: true },
      ],
    ];
    createEventPayload.eventHosts = {
      createMany: {
        data: addHostIds,
      },
    };

    const newEvent = await this.prisma.event.create({
      data: createEventPayload,
    });

    let image = '';
    let coverImage = '';
    assets.forEach((item) => {
      if (item.type == EventAssetType.THUMBNAIL) {
        image = item.url;
      } else if (item.type == EventAssetType.BACKGROUND) {
        coverImage = item.url;
      }
    });

    // Only create collection nft in private scope event
    if (eventScope == EventScope.PRIVATE) {
      await this.nftSolanaService.createCollectionOffChain(newEvent.id, {
        name: newEvent.title,
        description: newEvent.description,
        image: image.length > 0 ? image : undefined,
        cover_image: coverImage.length ? coverImage : undefined,
        social_links: socialLinks.length > 0 ? socialLinks : undefined,
      });
    }

    return newEvent;
  }

  async find(findEventDto: FindEventDto): Promise<FindEventResponse> {
    const { size, page, userId, categoryIds, cityIds, status } = findEventDto;
    const skip = (page - 1) * size;

    const findEventCondition: Prisma.EventWhereInput = {
      isDeleted: false,
      eventScope: EventScope.PUBLIC,
    };
    if (userId) {
      findEventCondition.joinedEventUsers = {
        some: {
          userId,
        },
      };
    }

    if (categoryIds) {
      findEventCondition.eventCategoryId = {
        in: categoryIds,
      };
    }

    if (cityIds) {
      findEventCondition.eventCities = {
        some: {
          cityId: {
            in: cityIds,
          },
        },
      };
    }

    if (status) {
      if (status === 'ON_GOING') {
        findEventCondition.eventEndDate = {
          gte: new Date(),
        };
      } else if (status === 'FINISHED') {
        findEventCondition.eventEndDate = {
          lte: new Date(),
        };
      }
    }

    const [events, count] = await Promise.all([
      this.prisma.event.findMany({
        where: findEventCondition,
        skip,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          _count: true,
          city: true,
          eventAssets: {
            orderBy: {
              type: 'asc',
            },
          },
          eventHosts: {
            include: {
              user: true,
            },
          },
          eventSponsors: true,
          eventSocials: true,
          eventLocationDetail: true,
          joinedEventUsers: {
            take: 3,
            orderBy: {
              joinDate: 'desc',
            },
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  nickname: true,
                  avatarUrl: true,
                  // _count: true
                },
              },
            },
          },
          eventTags: true,
          eventCities: true,
          user: true,
          eventCategory: true,
        },
        take: size,
      }),
      this.prisma.event.count({ where: findEventCondition }),
    ]);

    return {
      ...getDefaultPaginationReponse(findEventDto, count),
      data: events,
    };
  }

  async findFeedEventIds(userId: string, findFeedDto: FindFeedDto) {
    const { size, page } = findFeedDto;
    const skip = (page - 1) * size;
    const query = `WITH U AS (
      SELECT id
      FROM public.user
      WHERE id = '${userId}'
      ),
      FRIEND_EVENTS AS (
        SELECT DISTINCT(event_id) as id
        FROM public.joined_event_user
        WHERE user_id IN (
          SELECT target_id 
          FROM public.user_connection
          WHERE user_id = (
          SELECT id FROM U
          )
        ) 
      ),
      COMBINED_EVENTS AS (
        SELECT id FROM FRIEND_EVENTS
      )
      
      SELECT id
      FROM public.event
      WHERE id IN (
        SELECT id FROM COMBINED_EVENTS
      ) AND is_deleted = false
      ORDER BY event_date DESC LIMIT ${size} OFFSET ${skip}
    `;
    return this.prisma.$queryRawUnsafe<{ id: string }[]>(query);
  }

  async findFeedForTelegram(telegramId: string, findFeedDto: FindFeedDto) {
    const { size, page } = findFeedDto;
    const skip = (page - 1) * size;

    const user = await this.prisma.user.findUnique({
      where: {
        telegramId: `${telegramId}`,
      },
      include: {
        following: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Not found user!');
    }

    const res = await this.findFeedEventIds(user.id, findFeedDto);

    const ids = res.map((item) => item.id);

    const findEventCondition: Prisma.EventWhereInput = {
      id: {
        in: ids,
      },
    };

    const [events, count] = await Promise.all([
      this.prisma.event.findMany({
        where: findEventCondition,
        skip,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          _count: true,
          city: true,
          eventAssets: {
            orderBy: {
              type: 'asc',
            },
          },
          eventHosts: {
            include: {
              user: true,
            },
          },
          eventSponsors: true,
          eventSocials: true,
          eventLocationDetail: true,
          joinedEventUsers: {
            take: 4,
            orderBy: [
              {
                userId: user.id ? 'asc' : 'desc',
              },
              // {
              //   userId: {
              //     in: user.following.map((u) => u.id),
              //   }
              //     ? 'asc'
              //     : 'desc',
              // },
            ],
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  nickname: true,
                  avatarUrl: true,
                  // _count: true
                },
              },
            },
          },
          userEventFavorites: {
            where: {
              userId: user.id,
            },
          },
          eventTags: true,
          eventCities: true,
          user: true,
          eventCategory: true,
        },
        take: size,
      }),
      this.prisma.event.count({ where: findEventCondition }),
    ]);

    const newData = events.map((item) => {
      const { joinedEventUsers, userEventFavorites } = item;
      const hasUser = joinedEventUsers.find((i) => i.userId === user.id);
      const isFavorite = userEventFavorites.find((i) => i.userId === user.id);
      item.joinedEventUsers = item.joinedEventUsers.filter(
        (item) => item.userId !== user.id,
      );
      return { ...item, isJoined: !!hasUser, isFavorite: !!isFavorite };
    });

    return {
      ...getDefaultPaginationReponse(findFeedDto, count),
      data: newData,
    };
  }

  async findForTelegram(
    telegramId: string,
    findEventDto: FindEventDto,
  ): Promise<FindEventResponse> {
    const { size, page, userId, categoryIds, cityIds, status, query } =
      findEventDto;
    const skip = (page - 1) * size;

    const user = await this.prisma.user.findUnique({
      where: {
        telegramId: `${telegramId}`,
      },
    });

    if (!user) {
      throw new NotFoundException('Not found user!');
    }

    const findEventCondition: Prisma.EventWhereInput = { isDeleted: false };
    if (userId) {
      findEventCondition.joinedEventUsers = {
        some: {
          userId,
        },
      };
    }

    if (query) {
      findEventCondition.title = {
        contains: query,
        mode: 'insensitive',
      };
    }

    if (categoryIds) {
      findEventCondition.eventCategoryId = {
        in: categoryIds,
      };
    }

    if (cityIds) {
      findEventCondition.cityId = {
        in: cityIds,
      };
    }

    if (status) {
      if (status === 'ON_GOING') {
        findEventCondition.eventEndDate = {
          gte: moment().tz('Asia/Bangkok').toDate(),
        };
        findEventCondition.eventDate = {
          lte: moment().tz('Asia/Bangkok').toDate(),
        };
      } else if (status === 'FINISHED') {
        findEventCondition.eventEndDate = {
          lte: moment().tz('Asia/Bangkok').toDate(),
        };
      } else if (status === 'UPCOMING') {
        findEventCondition.eventDate = {
          gte: moment().tz('Asia/Bangkok').toDate(),
        };
      }
    }

    const [events, count] = await Promise.all([
      this.prisma.event.findMany({
        where: findEventCondition,
        skip,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          _count: true,
          city: true,
          eventAssets: {
            orderBy: {
              type: 'asc',
            },
          },
          eventHosts: {
            include: {
              user: true,
            },
          },
          eventSponsors: true,
          eventSocials: true,
          eventLocationDetail: true,
          joinedEventUsers: {
            take: 3,
            orderBy: [
              {
                userId: user.id ? 'asc' : 'desc',
              },
            ],
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  nickname: true,
                  avatarUrl: true,
                  // _count: true
                },
              },
            },
          },
          userEventFavorites: {
            where: {
              userId: user.id,
            },
          },
          eventTags: true,
          eventCities: true,
          user: true,
          eventCategory: true,
        },
        take: size,
      }),
      this.prisma.event.count({ where: findEventCondition }),
    ]);

    const newData = events.map((item) => {
      const { joinedEventUsers, userEventFavorites } = item;
      const hasUser = joinedEventUsers.find((i) => i.userId === user.id);
      const isFavorite = userEventFavorites.find((i) => i.userId === user.id);
      return { ...item, isJoined: !!hasUser, isFavorite: !!isFavorite };
    });

    return {
      ...getDefaultPaginationReponse(findEventDto, count),
      data: newData,
    };
  }

  async findOne(shortId: string) {
    const event = await this.prisma.event.findUnique({
      where: { shortId },
      include: {
        _count: true,
        city: true,
        eventCategory: true,
        eventAssets: {
          orderBy: {
            type: 'asc',
          },
        },
        eventHosts: {
          include: {
            user: true,
          },
        },
        eventSponsors: true,
        eventSocials: true,
        eventLocationDetail: true,
        eventLinks: true,
        eventPhases: {
          orderBy: {
            order: 'asc',
          },
        },
        joinedEventUsers: {
          take: 3,
          orderBy: {
            joinDate: 'desc',
          },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                nickname: true,
                avatarUrl: true,
              },
            },
          },
        },
        eventTags: true,
        eventCities: true,
        user: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Not found event!');
    }

    return event;
  }

  async findOneForTelegram(telegramId: string, shortId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        telegramId: `${telegramId}`,
      },
      include: {
        userCities: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Not found user!');
    }

    const event = await this.prisma.event.findUnique({
      where: { shortId },
      include: {
        _count: true,
        city: true,
        eventCategory: true,
        eventAssets: {
          orderBy: {
            type: 'asc',
          },
        },
        eventHosts: {
          include: {
            user: true,
          },
        },
        eventSponsors: true,
        eventSocials: true,
        eventLocationDetail: true,
        eventLinks: true,
        eventPhases: {
          orderBy: {
            order: 'asc',
          },
        },
        joinedEventUsers: {
          take: 3,
          orderBy: {
            joinDate: 'desc',
          },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                nickname: true,
                avatarUrl: true,
              },
            },
          },
        },
        eventTags: true,
        eventCities: true,
        user: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Not found event!');
    }

    const joinedEvent = await this.prisma.joinedEventUser.findUnique({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId: event.id,
        },
      },
    });

    const isJoined = !!joinedEvent;

    const favoriteEvent = await this.prisma.userEventFavorite.findUnique({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId: event.id,
        },
      },
    });

    const isFavorite = !!favoriteEvent;

    const createEventViewPayload: Prisma.EventViewUncheckedCreateInput = {
      eventId: event.id,
      userId: user.id,
    };

    if (user.userCities && user.userCities[0]) {
      createEventViewPayload.cityId = user.userCities[0].cityId;
    }

    await this.prisma.eventView.create({
      data: createEventViewPayload,
    });

    return { ...event, isJoined, isFavorite };
  }

  async findCreated(
    telegramId: string,
    findCreatedEventDto: FindCreatedEventDto,
  ): Promise<FindEventResponse> {
    const { size, page } = findCreatedEventDto;
    const skip = (page - 1) * size;

    const findEventCondition: Prisma.EventWhereInput = { isDeleted: false };

    const user = await this.prisma.user.findUnique({
      where: {
        telegramId: `${telegramId}`,
      },
    });

    if (!user) {
      throw new NotFoundException('Not found user!');
    }

    findEventCondition.OR = [
      {
        userId: user.id,
      },
      {
        eventHosts: {
          some: {
            userId: user.id,
          },
        },
      },
    ];

    const [events, count] = await Promise.all([
      this.prisma.event.findMany({
        where: findEventCondition,
        skip,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          _count: true,
          city: true,
          eventAssets: {
            orderBy: {
              type: 'asc',
            },
          },
          eventHosts: {
            include: {
              user: true,
            },
          },
          eventSponsors: true,
          eventSocials: true,
          eventLocationDetail: true,
          joinedEventUsers: {
            take: 3,
            orderBy: {
              joinDate: 'desc',
            },
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  nickname: true,
                  avatarUrl: true,
                  // _count: true
                },
              },
            },
          },
          eventTags: true,
          eventCities: true,
          user: true,
          eventCategory: true,
        },
        take: size,
      }),
      this.prisma.event.count({ where: findEventCondition }),
    ]);

    return {
      ...getDefaultPaginationReponse(findCreatedEventDto, count),
      data: events,
    };
  }

  async findFavorite(
    telegramId: string,
    findCreatedEventDto: FindCreatedEventDto,
  ): Promise<FindEventResponse> {
    const { size, page } = findCreatedEventDto;
    const skip = (page - 1) * size;

    const findEventCondition: Prisma.EventWhereInput = { isDeleted: false };

    const user = await this.prisma.user.findUnique({
      where: {
        telegramId: `${telegramId}`,
      },
    });

    if (!user) {
      throw new NotFoundException('Not found user!');
    }

    findEventCondition.userEventFavorites = {
      some: {
        userId: user.id,
      },
    };

    const [events, count] = await Promise.all([
      this.prisma.event.findMany({
        where: findEventCondition,
        skip,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          _count: true,
          city: true,
          eventAssets: {
            orderBy: {
              type: 'asc',
            },
          },
          eventHosts: {
            include: {
              user: true,
            },
          },
          eventSponsors: true,
          eventSocials: true,
          eventLocationDetail: true,
          joinedEventUsers: {
            take: 3,
            orderBy: {
              joinDate: 'desc',
            },
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  nickname: true,
                  avatarUrl: true,
                  // _count: true
                },
              },
            },
          },
          eventTags: true,
          eventCities: true,
          user: true,
          eventCategory: true,
        },
        take: size,
      }),
      this.prisma.event.count({ where: findEventCondition }),
    ]);

    return {
      ...getDefaultPaginationReponse(findCreatedEventDto, count),
      data: events,
    };
  }

  async checkJoinedEvent(eventId: string, userId: string) {
    const event = await this.prisma.event.findFirst({
      where: {
        OR: [
          {
            id: eventId,
          },
          {
            shortId: eventId,
          },
        ],
      },
    });

    if (!event) {
      throw new NotFoundException('Not found event!');
    }

    const joinedUser = await this.prisma.joinedEventUser.findFirst({
      where: {
        eventId: event.id,
        userId,
      },
    });

    if (joinedUser) {
      return { joined: true };
    }

    return { joined: false };
  }

  async join(telegramId: string, joinEventDto: JoinEventDto) {
    const { eventId, shortId, isAccepted } = joinEventDto;
    if (!eventId && !shortId) {
      return;
    }

    const user = await this.prisma.user.findUnique({
      where: {
        telegramId: `${telegramId}`,
      },
    });

    if (!user) {
      throw new NotFoundException('Not found user!');
    }

    const findEventCondition = eventId ? { id: eventId } : { shortId };

    const event = await this.prisma.event.findUnique({
      where: findEventCondition,
      include: {
        eventAssets: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Not found event!');
    }

    const joinedUser = await this.prisma.joinedEventUser.findUnique({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId: event.id,
        },
      },
    });

    if (!isAccepted) {
      if (joinedUser) {
        throw new ConflictException('You have joined this event!');
      }

      let newJoinedEventUserRecord = await this.prisma.joinedEventUser.create({
        data: {
          userId: user.id,
          eventId: event.id,
        },
      });

      if (!newJoinedEventUserRecord) {
        throw new BadRequestException('You can not join event');
      }

      if (event.eventScope == EventScope.PRIVATE) {
        // create nft off chain save in database
        const createNftSolanaOffchainRecord =
          await this.createNftSolanaOffchain(event, event.eventAssets, user);

        if (!createNftSolanaOffchainRecord) {
          throw new BadRequestException('Can not create nft');
        }

        // create royalty token off chain save in database
        const createRoyaltyLogTokenOffChainRecord =
          await this.royaltySolanaTokenService.createRoyaltyLogTokenOffChain(
            event,
            user.id,
          );

        if (!createRoyaltyLogTokenOffChainRecord) {
          throw new BadRequestException('Can not send royalty token');
        }
      }
    } else {
      if (!joinedUser) {
        throw new ConflictException('You have not been invited to this event!');
      }
      const updateStatus =
        isAccepted === 'Y'
          ? JoinedEventUserStatus.REGISTERED
          : JoinedEventUserStatus.REJECTED;
      await this.prisma.joinedEventUser.update({
        where: {
          id: joinedUser.id,
        },
        data: {
          status: updateStatus,
        },
      });

      if (event.eventScope == EventScope.PRIVATE) {
        // create nft + royalty token offchain if user register
        if (updateStatus == JoinedEventUserStatus.REGISTERED) {
          // create nft off chain save in database
          const createNftSolanaOffchainRecord =
            await this.createNftSolanaOffchain(event, event.eventAssets, user);

          if (!createNftSolanaOffchainRecord) {
            throw new BadRequestException('Can not create nft');
          }

          // create royalty token off chain save in database
          const createRoyaltyLogTokenOffChainRecord =
            await this.royaltySolanaTokenService.createRoyaltyLogTokenOffChain(
              event,
              user.id,
            );

          if (!createRoyaltyLogTokenOffChainRecord) {
            throw new BadRequestException('Can not send royalty token');
          }
        }
      }
    }

    return { success: true };
  }

  async addFavorite(telegramId: string, addFavoriteDto: AddFavoriteDto) {
    const { eventId } = addFavoriteDto;

    const user = await this.prisma.user.findUnique({
      where: {
        telegramId: `${telegramId}`,
      },
    });

    if (!user) {
      throw new NotFoundException('Not found user!');
    }

    const event = await this.prisma.event.findUnique({
      where: {
        id: eventId,
      },
    });

    if (!event) {
      throw new NotFoundException('Not found event!');
    }

    const likedEvent = await this.prisma.userEventFavorite.findUnique({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId,
        },
      },
    });

    if (likedEvent) {
      await this.prisma.userEventFavorite.delete({
        where: {
          id: likedEvent.id,
        },
      });
    } else {
      await this.prisma.userEventFavorite.create({
        data: {
          userId: user.id,
          eventId,
        },
      });
    }

    return { success: true };
  }

  async findJoinedEventUser(findJoinedEventUserDto: FindJoinedEventUserDto) {
    const { size, page, eventId, userId } = findJoinedEventUserDto;
    const skip = (page - 1) * size;

    const findJoinedUserCondition: Prisma.JoinedEventUserWhereInput = {
      eventId,
    };

    const [joinedUsers, count] = await Promise.all([
      this.prisma.joinedEventUser.findMany({
        where: findJoinedUserCondition,
        skip,
        take: size,
        select: {
          userId: true,
          checkedIn: true,
          user: {
            select: {
              id: true,
              company: true,
              fullName: true,
              gender: true,
              jobTitle: true,
              _count: true,
              followers: true,
              following: true,
            },
          },
        },
      }),
      this.prisma.joinedEventUser.count({ where: findJoinedUserCondition }),
    ]);
    let data = joinedUsers;
    if (userId) {
      data = joinedUsers.map((item) => {
        const { user } = item;
        const { following } = user;
        const followingUser = following.find((u) => u.userId === userId);
        const isFollowing = followingUser ? true : false;
        const newUser = { ...user, isFollowing };
        delete newUser.followers;
        delete newUser.following;
        return { ...item, user: newUser };
      });
    }

    return {
      ...getDefaultPaginationReponse(findJoinedEventUserDto, count),
      data: data,
    };
  }

  async joinEvent(userId: string, eventId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('Not found user!');
    }

    const event = await this.prisma.event.findUnique({
      where: {
        id: eventId,
      },
    });

    if (!event) {
      throw new NotFoundException('Not found event!');
    }

    const joinedEventUser = await this.prisma.joinedEventUser.findUnique({
      where: {
        userId_eventId: {
          eventId,
          userId,
        },
      },
    });

    if (joinedEventUser) {
      throw new NotFoundException('You have joined this event!');
    }

    await this.prisma.joinedEventUser.create({
      data: {
        userId,
        eventId,
      },
    });

    const payload: QrCodeDto = {
      eventId,
      eventName: event.title,
      userId,
      to: user.email,
      subject: `Ticket for ${event.title}`,
      fullName: user.fullName,
      fromDate: event.eventDate,
    };

    await this.mailTaskQueue.add(MailJob.sendQrMail, payload);

    return { success: true };
  }

  async invite(
    userId: string,
    createEventInvitationDto: CreateEventInvitationDto,
  ) {
    const { eventId, receiverId } = createEventInvitationDto;
    const sender = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!sender) {
      throw new NotFoundException('Not found sender!');
    }

    const currentDate = moment().tz(this.timezone).toDate();

    const event = await this.prisma.event.findUnique({
      where: {
        id: eventId,
        eventDate: {
          gte: currentDate,
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Not found event or event is ended!');
    }

    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      throw new NotFoundException('Not found receiver!');
    }

    const { title, body } = NotificationMessage.EVENT_INVITATION;
    await this.notificationService.create({
      title,
      body,
      senderId: userId,
      receiverId,
      notificationType: 'EVENT_INVITATION',
      objectId: eventId,
    });

    return { success: true };
  }

  async findEventUser(userId: string, eventId: string) {
    return this.prisma.joinedEventUser.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      include: {
        user: true,
        event: true,
      },
    });
  }

  // async checkIn(userId: string, eventId: string) {
  //   const userEvent = await this.findEventUser(userId, eventId);
  //   if (userEvent.checkedIn) {
  //     throw new ConflictException('User has checked in this event!');
  //   }
  //   await this.prisma.joinedEventUser.update({
  //     where: { id: userEvent.id },
  //     data: {
  //       checkedIn: true,
  //     },
  //   });
  //   return { success: true };
  // }
  //
  private generateUniqueId(length: number = 6): string {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let uniqueId = '';
    for (let i = 0; i < length; i++) {
      uniqueId += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return uniqueId;
  }

  private async generateUniqueCode(): Promise<string> {
    let shortId: string;
    let isUnique = false;

    while (!isUnique) {
      shortId = this.generateUniqueId(6);
      const existingRecord = await this.prisma.event.findUnique({
        where: { shortId },
      });
      isUnique = !existingRecord;
    }

    return shortId;
  }

  async updateHighlight(
    telegramId: number,
    updateHighlightEventDto: UpdateHighlightEventDto,
  ) {
    const { eventId, isHighlighted } = updateHighlightEventDto;

    const user = await this.prisma.user.findUnique({
      where: {
        telegramId: `${telegramId}`,
      },
    });

    if (!user) {
      throw new NotFoundException('Not found user');
    }

    const event = await this.prisma.event.findUnique({
      where: {
        id: eventId,
        userId: user.id,
      },
    });

    if (!event) {
      throw new NotFoundException('Not found event');
    }

    await this.prisma.event.update({
      where: {
        id: eventId,
      },
      data: {
        isHighlighted,
      },
    });

    return { success: true };
  }

  // async manualImportEventUser(
  //   manualImportEventUserDto: ManualImportEventUserDto,
  // ) {
  //   const { eventId, emails } = manualImportEventUserDto;
  //   const event = await this.prisma.event.findUnique({
  //     where: { id: eventId },
  //   });
  //
  //   if (!event) {
  //     throw new NotFoundException('Not found event!');
  //   }
  //
  //   const users = await this.userService.createMany(emails);
  //   const joinUsers = await Promise.all(
  //     users.map(async (user) => {
  //       const joinedUser = await this.prisma.joinedEventUser.findUnique({
  //         where: {
  //           userId_eventId: {
  //             userId: user.id,
  //             eventId,
  //           },
  //         },
  //         include: {
  //           user: true,
  //         },
  //       });
  //
  //       if (joinedUser) {
  //         return;
  //       }
  //
  //       return this.prisma.joinedEventUser.create({
  //         data: {
  //           userId: user.id,
  //           eventId,
  //         },
  //         include: {
  //           user: true,
  //         },
  //       });
  //     }),
  //   );
  //
  //   const rawMailPayload: QrCodeDto[] = joinUsers.map((item) => {
  //     if (!item) {
  //       return;
  //     }
  //     const { user } = item;
  //     const { fullName, email } = user;
  //     return {
  //       eventId,
  //       subject: `Ticket for ${event.name}`,
  //       eventName: event.name,
  //       fullName,
  //       to: email,
  //       userId: user.id,
  //       fromDate: event.eventDate,
  //     };
  //   });
  //
  //   const mailPayload = rawMailPayload.filter((item) => item);
  //
  //   await this.mailTaskQueue.add(MailJob.sendQrImported, mailPayload);
  //   // await this.mailService.sendManyImportedUserEventMail(mailPayload);
  //
  //   return { success: true };
  // }

  async update(telegramId: string, updateEventDto: UpdateEventDto) {
    const { id } = updateEventDto;

    const event = await this.prisma.event.findUnique({
      where: {
        id,
      },
    });

    if (!event) {
      throw new NotFoundException('Not found event!');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        telegramId,
      },
    });

    if (!user) {
      throw new NotFoundException('Not found user!');
    }

    if (event.userId !== user.id) {
      throw new NotAcceptableException(`Only event's owner can update event`);
    }

    const {
      title,
      content,
      eventDate,
      eventEndDate,
      eventScope,
      numberOfTicket,
      description,
      location,
      mapsUrl,
      assetUrl,
    } = updateEventDto;

    const updateEventPayload: Prisma.EventUpdateInput = {};
    const updateAssetPayload: Prisma.EventAssetUpdateInput = {};

    const currentAsset = await this.prisma.eventAsset.findFirst({
      where: {
        eventId: id,
        type: EventAssetType.THUMBNAIL,
      },
    });

    const updateAssetCondition: Prisma.EventAssetWhereUniqueInput = {
      id: currentAsset.id,
    };

    if (title) {
      updateEventPayload.title = title;
    }
    if (content) {
      updateEventPayload.content = content;
    }
    if (description) {
      updateEventPayload.description = description;
    }
    if (eventDate) {
      updateEventPayload.eventDate = eventDate;
    }
    if (eventEndDate) {
      updateEventPayload.eventEndDate = eventEndDate;
    }
    if (eventScope) {
      updateEventPayload.eventScope = eventScope;
    }
    if (numberOfTicket) {
      updateEventPayload.numberOfTicket = numberOfTicket;
    }
    if (location) {
      updateEventPayload.location = location;
    }
    if (mapsUrl) {
      updateEventPayload.mapsUrl = mapsUrl;
    }
    if (assetUrl) {
      updateAssetPayload.url = assetUrl;
    }

    await this.prisma.$transaction([
      this.prisma.event.update({
        where: {
          id,
        },
        data: updateEventPayload,
      }),
      this.prisma.eventAsset.update({
        where: updateAssetCondition,
        data: updateAssetPayload,
      }),
    ]);

    return { success: true };
  }
  async updateEventSponsors(
    telegramId: string,
    updateSponsorsDto: UpdateEventSponsorsDto,
  ) {
    const { eventId, sponsors } = updateSponsorsDto;

    const existedEvent = await this.prisma.event.findUnique({
      where: {
        shortId: eventId,
      },
    });

    if (!existedEvent) {
      throw new NotFoundException('Event not found!');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        telegramId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    if (existedEvent.userId !== user.id) {
      throw new NotAcceptableException(
        'Only the event owner can update the event',
      );
    }

    // Separate EventSponsor creation
    await this.prisma.eventSponsor.createMany({
      data: sponsors.map((sponsor) => ({
        eventId: existedEvent.id,
        name: sponsor.name,
        description: sponsor.description,
        imageUrl: sponsor.imageUrl,
      })),
    });

    return { success: true };
  }

  async rejectInvitation(
    telegramId: string,
    rejectInvitationDto: BaseInteractEventDto,
  ) {
    const user = await this.userService.findUserByTelegramId(telegramId);
    if (!user) {
      throw new NotFoundException('Not Found User');
    }

    const { eventId } = rejectInvitationDto;

    const event = await this.prisma.event.findUnique({
      where: {
        id: eventId,
      },
    });

    if (!event) {
      throw new NotFoundException('Not found event!');
    }

    const joinedEventUser = await this.prisma.joinedEventUser.findUnique({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId: event.id,
        },
      },
    });

    if (!joinedEventUser) {
      throw new NotFoundException('You has not been invited into this event!');
    }

    await this.prisma.joinedEventUser.update({
      where: {
        id: joinedEventUser.id,
      },
      data: {
        status: JoinedEventUserStatus.REJECTED,
      },
    });

    return { success: true };
  }

  async createInvitation(
    telegramId: string,
    createInvitationDto: CreateInvitationDto,
  ) {
    const user = await this.userService.findUserByTelegramId(telegramId);
    if (!user) {
      throw new NotFoundException('Not Found User');
    }

    const { eventId, userIds, message } = createInvitationDto;

    const event = await this.prisma.event.findUnique({
      where: {
        id: eventId,
      },
    });

    if (!event) {
      throw new NotFoundException('Not found event!');
    }

    await Promise.all(
      userIds.map(async (userId) => {
        const joinedEventUser = await this.prisma.joinedEventUser.findUnique({
          where: {
            userId_eventId: {
              userId,
              eventId: event.id,
            },
          },
        });

        if (joinedEventUser) {
          return;
        }

        await this.prisma.joinedEventUser.createMany({
          data: {
            eventId,
            userId,
            status: JoinedEventUserStatus.INVITED,
          },
        });

        const target = await this.userService.findOne(userId);

        try {
          return this.telegramBotService.sendMessage(
            +target.telegramId,
            `Hello ${target.fullName}!\nYou have been invited to be guest of the event: ${event.title}!\n ${message} \nEvent detail: https://t.me/connectx_network_bot/app?startapp=inviteUser_${event.shortId}`,
          );
        } catch (error) {
          console.log(error);
        }
      }),
    );

    return { success: true };
  }

  async createInvitationSponsor(
    telegramId: string,
    createInvitationDto: CreateInvitationDto,
  ) {
    const user = await this.userService.findUserByTelegramId(telegramId);
    if (!user) {
      throw new NotFoundException('Not Found User');
    }

    const { eventId, userIds, message } = createInvitationDto;

    const event = await this.prisma.event.findUnique({
      where: {
        id: eventId,
      },
    });

    if (!event) {
      throw new NotFoundException('Not found event!');
    }

    await Promise.all(
      userIds.map(async (userId) => {
        const joinedEventSponsor =
          await this.prisma.joinedEventSponsor.findUnique({
            where: {
              userId_eventId: {
                userId,
                eventId: event.id,
              },
            },
          });

        if (joinedEventSponsor) {
          return;
        }

        await this.prisma.joinedEventSponsor.createMany({
          data: {
            eventId,
            userId,
            status: JoinedEventSponsorStatus.INVITED,
          },
        });

        const target = await this.userService.findOne(userId);

        try {
          return this.telegramBotService.sendMessage(
            +target.telegramId,
            `Hello ${target.fullName}!\nYou have been invited to be sponsor of the event: ${event.title}!\n ${message} \nEvent detail: https://t.me/connectx_network_bot/app?startapp=inviteSponsor_${event.shortId}`,
          );
        } catch (error) {
          console.log(error);
        }
      }),
    );

    return { success: true };
  }

  async updateGuestStatus(
    telegramId: string,
    updateGuestStatus: UpdateGuestStatusDto,
  ) {
    const user = await this.userService.findUserByTelegramId(telegramId);
    if (!user) {
      throw new NotFoundException('Not Found User');
    }

    const { eventId, userId, status } = updateGuestStatus;

    const event = await this.prisma.event.findUnique({
      where: {
        id: eventId,
      },
    });

    if (!event) {
      throw new NotFoundException('Not found event!');
    }

    if (event.userId !== user.id) {
      throw new NotAcceptableException(`Only event's owner can update event`);
    }

    const guest = await this.prisma.joinedEventUser.findUnique({
      where: {
        userId_eventId: {
          eventId,
          userId,
        },
      },
    });

    if (!guest) {
      throw new NotFoundException('Not found guest!');
    }

    await this.prisma.joinedEventUser.update({
      where: {
        id: guest.id,
      },
      data: {
        status,
      },
    });

    return { success: true };
  }

  async checkInByAdmin(
    telegramId: string,
    checkInByAdminDto: CheckInByAdminDto,
  ) {
    const user = await this.userService.findUserByTelegramId(telegramId);
    if (!user) {
      throw new NotFoundException('Not Found User');
    }

    const { eventId, userId } = checkInByAdminDto;
    const event = await this.prisma.event.findUnique({
      where: {
        id: eventId,
      },
      include: {
        eventAssets: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Not found event!');
    }

    if (event.userId !== user.id) {
      throw new NotAcceptableException(`Only event's owner can update event`);
    }

    const guest = await this.prisma.joinedEventUser.findUnique({
      where: {
        userId_eventId: {
          eventId,
          userId,
        },
      },
    });

    if (!guest) {
      throw new NotFoundException('Not found guest!');
    }

    if (guest?.checkedIn) {
      throw new BadRequestException('Already checked in');
    }

    await this.prisma.joinedEventUser.update({
      where: {
        id: guest.id,
      },
      data: {
        checkedIn: true,
        checkInDate: new Date(),
      },
    });

    return { success: true };
  }

  async findGuest(id: string, findGuestDto: FindEventGuestDto) {
    const { status, page, size, sort, query } = findGuestDto;
    const skip = (page - 1) * size;

    const event = await this.prisma.event.findUnique({
      where: {
        id,
      },
    });

    if (!event) {
      throw new NotFoundException('Not found event!');
    }

    const filter: Prisma.JoinedEventUserWhereInput = {
      eventId: event.id,
    };

    const filterOrder: Prisma.JoinedEventUserOrderByWithRelationInput = {};

    if (sort) {
      const [sortField, order] = sort;
      if (sortField) {
        if (['fullName', 'telegramUsername'].includes(sortField)) {
          filterOrder.user = {};
          filterOrder.user[sortField] = order.trim();
        } else {
          filterOrder[sortField] = order.trim();
        }
      }
    }
    if (status) {
      if (status === 'CHECKED_IN') {
        filter.checkedIn = true;
      } else {
        filter.status = status;
        filter.checkedIn = false;
      }
    }
    if (query) {
      filter.OR = [
        {
          user: {
            fullName: {
              contains: query,
              mode: 'insensitive',
            },
          },
        },
        {
          user: {
            telegramUsername: {
              contains: query,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    const [users, count] = await Promise.all([
      this.prisma.joinedEventUser.findMany({
        where: filter,
        select: {
          user: true,
          checkedIn: true,
          status: true,
          joinDate: true,
          checkInDate: true,
        },
        take: size,
        skip,
        orderBy: filterOrder,
      }),
      this.prisma.joinedEventUser.count({ where: filter }),
    ]);

    return {
      ...getDefaultPaginationReponse(findGuestDto, count),
      data: users,
    };
  }

  async findEventFriend(
    telegramId: string,
    id: string,
    findEventFriendDto: FindEventFriendDto,
  ) {
    const { page, size } = findEventFriendDto;
    const skip = (page - 1) * size;

    const event = await this.prisma.event.findUnique({
      where: {
        id,
      },
    });

    if (!event) {
      throw new NotFoundException('Not found event!');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        telegramId,
      },
    });

    if (!user) {
      throw new NotFoundException('Not found user!');
    }

    const filter: Prisma.UserWhereInput = {};

    filter.joinedEventUsers = {
      some: {
        eventId: event.id,
      },
    };

    filter.followers = {
      some: {
        userId: user.id,
      },
    };

    filter.following = {
      some: {
        targetId: user.id,
      },
    };

    const [users, count] = await Promise.all([
      this.prisma.user.findMany({
        where: filter,
        take: size,
        skip,
      }),
      this.prisma.user.count({ where: filter }),
    ]);

    return {
      ...getDefaultPaginationReponse(findEventFriendDto, count),
      data: users,
    };
  }

  async delete(telegramId: string, deleteEventDto: DeleteEventDto) {
    const { eventId } = deleteEventDto;

    const event = await this.prisma.event.findUnique({
      where: {
        id: eventId,
      },
    });

    if (!event) {
      throw new NotFoundException('Not found event!');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        telegramId,
      },
    });

    if (!user) {
      throw new NotFoundException('Not found user!');
    }

    if (event.userId !== user.id) {
      throw new NotAcceptableException(`Only event's owner can update event`);
    }

    await this.prisma.event.update({
      where: {
        id: eventId,
      },
      data: {
        isDeleted: true,
      },
    });

    return { success: true };
  }

  async checkInGuestByQrCode(
    telegramId: string,
    checkInByQrDto: CheckInByQrDto,
  ) {
    const user = await this.userService.findUserByTelegramId(telegramId);
    if (!user) {
      throw new NotFoundException('Not Found User');
    }

    const { eventId, userId } = checkInByQrDto;

    const event = await this.prisma.event.findUnique({
      where: {
        id: eventId,
      },
      include: {
        eventAssets: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Not found event!');
    }

    // Check if user has permission Checkin or Manager, or user is owner of event
    const eventHost = await this.prisma.eventHost.findFirst({
      where: {
        eventId: event.id,
        userId: user.id,
        accepted: true,
        permission: {
          in: [
            HostPermission.MANAGER,
            HostPermission.CHECKIN,
            HostPermission.CREATOR,
          ],
        },
      },
    });

    if (!eventHost || (eventHost && eventHost.userId !== user.id)) {
      throw new BadRequestException(
        'User does not have permission to checkin!',
      );
    }

    const guest = await this.prisma.joinedEventUser.findUnique({
      where: {
        userId_eventId: {
          eventId,
          userId,
        },
      },
    });

    if (!guest) {
      throw new NotFoundException('Not found guest!');
    }

    if (guest?.checkedIn) {
      throw new BadRequestException('Already checked in');
    }

    await this.prisma.joinedEventUser.update({
      where: {
        id: guest.id,
      },
      data: {
        checkedIn: true,
        checkInDate: new Date(),
      },
    });

    return { success: true };
  }

  async exportGuest(telegramId: string, eventId: string) {
    const user = await this.userService.findUserByTelegramId(telegramId);
    if (!user) {
      throw new NotFoundException('Not Found User');
    }

    const event = await this.prisma.event.findUnique({
      where: {
        id: eventId,
      },
    });

    if (!event) {
      throw new NotFoundException('Not found event!');
    }

    if (event.userId !== user.id) {
      throw new NotAcceptableException(`You're not owner of this event`);
    }
    const paging: FindEventGuestDto = { page: 1, size: 1000 };
    const { data: dataList } = await this.findGuest(event.id, paging);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('TestExportXLS');

    const data = dataList.map((item) => {
      return {
        telegramUserName: item.user.telegramUsername,
        telegramId: item.user.telegramId,
        fullName: item.user.fullName,
        company: item.user.company,
        jobTitle: item.user.jobTitle,
        linkedInUrl: item.user.linkedInUrl,
        twitterUrl: item.user.twitterUrl,
        checkedIn: item.checkedIn,
        status: item.status,
        joinDate: moment(item.joinDate).format('hh:mm DD/MM/YYYY'),
        checkInDate: item.checkInDate
          ? moment(item.checkInDate).format('hh:mm DD/MM/YYYY')
          : '',
      };
    });

    worksheet.columns = [
      { header: 'Telegram username', key: 'telegramUserName' },
      { header: 'Telegram id', key: 'telegramId' },
      { header: 'Full name', key: 'fullName' },
      { header: 'Company', key: 'company' },
      { header: 'Job title', key: 'jobTitle' },
      { header: 'LinkedIn', key: 'linkedInUrl' },
      { header: 'Twitter', key: 'twitterUrl' },
      { header: 'Checked in', key: 'checkedIn' },
      { header: 'Status', key: 'status' },
      { header: 'Join date', key: 'joinDate' },
      { header: 'Check in date', key: 'checkInDate' },
    ];

    for (let i = 0; i < data.length; i++) {
      worksheet.addRow(data[i]);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `list guest ${moment().tz('Asia/Bangkok').format('YYYY-MM-DD')}`;

    return { buffer, fileName };
  }

  // get thumbnail url from event asset list
  private getThumbnaileventAsset(eventAsset: EventAsset[]) {
    let url = null;
    eventAsset.forEach((item) => {
      if (item.type == EventAssetType.THUMBNAIL) {
        url = item.url;
        return;
      }
    });

    return url;
  }

  async getInsights(getEventInsightDto: GetEventInsightDto) {
    const { eventId, insightFilterType } = getEventInsightDto;
    let dateStep = 1;
    let stepType: DurationConstructor = 'days';
    let numberOfSteps = 7;

    if (insightFilterType === InsightFilterType.WEEK) {
      dateStep = 1;
      numberOfSteps = 7;
    } else if (insightFilterType === InsightFilterType.MONTH) {
      dateStep = 3;
      numberOfSteps = 10;
    } else if (insightFilterType === InsightFilterType.QUARTER) {
      dateStep = 10;
      numberOfSteps = 12;
    } else if (insightFilterType === InsightFilterType.YEAR) {
      dateStep = 1;
      numberOfSteps = 12;
      stepType = 'months';
    }

    const filterStep = [];

    let dateMock = new Date();

    for (let i = 0; i < numberOfSteps; i++) {
      filterStep.push({
        start: moment(dateMock).subtract(dateStep, stepType).toDate(),
        end: dateMock,
      });

      dateMock = moment(dateMock).subtract(dateStep, stepType).toDate();
    }

    const data = await Promise.all(
      filterStep.map(async (item) => {
        const view = await this.prisma.eventView.count({
          where: {
            eventId,
            createdAt: {
              gte: item.start,
              lte: item.end,
            },
          },
        });
        return { ...item, view };
      }),
    );

    const statistics = await this.getInsignCity({
      eventId,
      start: moment().subtract(numberOfSteps, stepType).format('YYYY-MM-DD'),
      end: moment().add(1, 'day').format('YYYY-MM-DD'),
    });

    return { data, statistics };
  }

  async getInsignCity({
    eventId,
    start,
    end,
  }: {
    eventId: string;
    start: string;
    end: string;
  }) {
    const query = `
        SELECT city_id, ct.name, ct.country, ct.latitude, ct.image, ct.longitude, COUNT(*)::int AS count
        FROM public.event_view ev
        JOIN public.city ct ON ct.id = city_id
        WHERE ev.event_id = '${eventId}' AND ev.created_at <= '${end}' AND ev.created_at >= '${start}'
        GROUP BY city_id, ct.name, ct.country, ct.latitude, ct.image, ct.longitude
        ORDER BY count DESC
        LIMIT 1
    `;

    console.log(query);

    return this.prisma.$queryRawUnsafe(query);
  }

  // create nft solana off chain
  private async createNftSolanaOffchain(
    event: Event,
    eventAsset: EventAsset[],
    user: User,
  ) {
    // get thumnail url from event asset list
    let thumbnailUrl = this.getThumbnaileventAsset(eventAsset);
    let attributes = [
      {
        trait_type: 'Location',
        value: `${event?.location ?? ''}`,
      },
      {
        trait_type: 'Date',
        value: `${Date.now()}`,
      },
    ];

    // create nft offchain
    const createNFTOffChain = await this.nftSolanaService.createNftItemOffChain(
      event.id,
      user.id,
      {
        name: event.title,
        description: event.description,
        image: thumbnailUrl || undefined,
        attributes,
      },
    );

    if (!createNFTOffChain) {
      throw new BadRequestException('Can not mint NFT');
    }

    return createNFTOffChain;
  }
}
