import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AcceptOrRejectHostDto,
  AddHostRequestDto,
  DeleteHostDto,
  UpdateHostRequestDto,
} from './host.dto';
import { PrismaService } from '../prisma/prisma.service';
import { HostPermission } from '@prisma/client';
import { TelegramBotService } from '../telegram-bot/telegram-bot.service';

@Injectable()
export class HostService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramBotService: TelegramBotService,
  ) {}

  async getHosts(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: {
        id: eventId,
      },
    });

    if (!event) {
      throw new NotFoundException('Not found event!');
    }

    const eventHosts = await this.prisma.eventHost.findMany({
      where: {
        eventId,
      },
      include: {
        user: true,
      },
    });

    return eventHosts.map((eventHost) => ({
      userId: eventHost.userId,
      permission: eventHost.permission,
      showOnEventPage: eventHost.showOnEventPage,
      accepted: eventHost.accepted,
      id: eventHost.id,
      user: {
        id: eventHost.user.id,
        fullName: eventHost.user.fullName,
        telegramUsername: eventHost.user.telegramUsername,
        avatarUrl: eventHost.user.avatarUrl,
      },
    }));
  }

  async addHost(telegramId: number, addHostRequestDto: AddHostRequestDto) {
    const { eventId, permission, showOnEventPage, userId } = addHostRequestDto;

    // User login
    const userLogin = await this.prisma.user.findUnique({
      where: {
        telegramId: `${telegramId}`,
      },
    });

    if (!userLogin) {
      throw new NotFoundException('Not found user!');
    }

    // Find event
    const event = await this.prisma.event.findUnique({
      where: {
        id: eventId,
      },
    });

    if (!event) {
      throw new NotFoundException('Not found event!');
    }

    // Check user login is creator of has permission event manager
    const hostUserLogin = await this.prisma.eventHost.findFirst({
      where: {
        eventId,
        userId: userLogin.id,
      },
    });

    const allowManageEVent =
      event.userId === userLogin.id ||
      (hostUserLogin && hostUserLogin.permission === HostPermission.MANAGER);

    if (!allowManageEVent) {
      throw new BadRequestException('You are not allowed to add host!');
    }

    const existedEventHost = await this.prisma.eventHost.findFirst({
      where: {
        eventId,
        userId,
      },
    });

    if (existedEventHost) {
      throw new BadRequestException('User is already host of this event!');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('Not found user!');
    }

    await this.prisma.eventHost.create({
      data: {
        eventId,
        userId,
        permission,
        showOnEventPage,
        invitedDate: new Date(),
      },
    });

    try {
      // Send notification via Telegram
      await this.telegramBotService.sendMessage(
        +user.telegramId,
        `Hello ${user.fullName}!\nYou have invited to be host of the event: ${event.title}!\nEvent link: ${process.env.TELEGRAM_BOT_URL}?startapp=inviteHost_${event.shortId}`,
      );
    } catch (error) {
      console.log(error);
    }

    return {
      success: true,
    };
  }

  async updateHost(
    telegramId: number,
    updateHostRequestDto: UpdateHostRequestDto,
  ) {
    const { eventId, permission, showOnEventPage, id, accepted } =
      updateHostRequestDto;

    const userLogin = await this.prisma.user.findUnique({
      where: {
        telegramId: `${telegramId}`,
      },
    });

    if (!userLogin) {
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

    const hostUserLogin = await this.prisma.eventHost.findFirst({
      where: {
        eventId,
        userId: userLogin.id,
      },
    });

    const allowManageEVent =
      event.userId === userLogin.id ||
      (hostUserLogin && hostUserLogin.permission === HostPermission.MANAGER);

    if (!allowManageEVent) {
      throw new BadRequestException('You are not allowed to update host!');
    }

    await this.prisma.eventHost.update({
      where: {
        id,
      },
      data: {
        permission,
        showOnEventPage,
        accepted,
      },
    });

    return {
      success: true,
    };
  }

  async acceptOrRejectHost(
    telegramId: number,
    acceptOrRejectHostDto: AcceptOrRejectHostDto,
  ) {
    const userLogin = await this.prisma.user.findUnique({
      where: {
        telegramId: `${telegramId}`,
      },
    });

    if (!userLogin) {
      throw new NotFoundException('Not found user!');
    }

    const { shortEventId, accept } = acceptOrRejectHostDto;

    const event = await this.prisma.event.findUnique({
      where: {
        shortId: shortEventId,
      },
    });
    const eventHost = await this.prisma.eventHost.findFirst({
      where: {
        userId: userLogin.id,
        eventId: event.id,
      },
    });

    if (!eventHost) {
      throw new NotFoundException('Not found event host!');
    }

    if (userLogin.id !== eventHost.userId) {
      throw new BadRequestException('You are not allowed to update host!');
    }

    await this.prisma.eventHost.update({
      where: {
        id: eventHost.id,
      },
      data: {
        accepted: accept,
      },
    });

    return {
      success: true,
    };
  }

  async deleteHost(telegramId: number, deleteHostDto: DeleteHostDto) {
    const userLogin = await this.prisma.user.findUnique({
      where: {
        telegramId: `${telegramId}`,
      },
    });

    if (!userLogin) {
      throw new NotFoundException('Not found user!');
    }

    const { id, eventId } = deleteHostDto;

    const event = await this.prisma.event.findUnique({
      where: {
        id: eventId,
      },
    });

    if (!event) {
      throw new NotFoundException('Not found event!');
    }

    const eventHost = await this.prisma.eventHost.findUnique({
      where: {
        id,
      },
    });

    if (!eventHost) {
      throw new NotFoundException('Not found event host!');
    }

    // Check user login is creator of has permission event manager
    const hostUserLogin = await this.prisma.eventHost.findFirst({
      where: {
        eventId: eventHost.eventId,
        userId: userLogin.id,
      },
    });

    const allowManageEVent =
      event.userId === userLogin.id ||
      (hostUserLogin && hostUserLogin.permission === HostPermission.MANAGER);

    if (!allowManageEVent) {
      throw new BadRequestException('You are not allowed to add host!');
    }

    await this.prisma.eventHost.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
    };
  }
}
