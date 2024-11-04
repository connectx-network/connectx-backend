import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as nacl from 'tweetnacl';
import { v4 as uuidv4 } from 'uuid';
import { CreateAuthSolanaDto } from './dto/payload-auth.dto';
import { decodeUTF8 } from 'tweetnacl-util';
import { GetMessageDto } from './dto/get-message.dto';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthSolanaService {
  constructor(
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
  ) {}

  // Verify signature is valid
  // If valid => update solana address to database
  async verifySignature(payload: CreateAuthSolanaDto, telegramId: number) {
    const user = await this.userService.findUserByTelegramId(`${telegramId}`);

    if (!user) {
      throw new NotFoundException('Not found User');
    }

    const { uuid, signature, publicKey, deadline, address } = payload;

    const message = this.getRawMessage(address, uuid, deadline, telegramId);

    const now = new Date();

    // check signature is valid time
    if (now.valueOf() / 1000 > deadline) {
      throw new BadRequestException('Signature expired');
    }

    const messageBytes = decodeUTF8(message);

    // verify signature is valid
    const result = nacl.sign.detached.verify(
      messageBytes,
      Uint8Array.from(signature),
      Uint8Array.from(publicKey),
    );

    if (!result) {
      throw new BadRequestException('Invalid signature');
    }

    const updateUser = await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        solanaAddress: address,
      },
    });

    if (!updateUser) {
      throw new BadRequestException('Invalid signature');
    }

    return updateUser;
  }

  // Return message allow crypto wallet sign in front end
  async getMessage(getMessageDto: GetMessageDto, telegramId: number) {
    const user = await this.userService.findUserByTelegramId(`${telegramId}`);

    if (!user) {
      throw new NotFoundException('Not found User');
    }

    const { address, uuid } = getMessageDto;

    const deadline = Math.floor(
      (new Date().valueOf() + Number(process.env.VALID_SIGNED_TIME ?? 0)) /
        1000,
    );

    const rawMessage = this.getRawMessage(address, uuid, deadline, telegramId);

    return { message: rawMessage, deadline };
  }

  private getRawMessage(
    address: string,
    uuid: string,
    deadline: number,
    telegramId: number,
  ) {
    return `Welcome to ConnectX Network Click to sign in and accept the ConnectX Network .This request will not trigger a blockchain transaction or cost any gas fees. TelegramId: ${telegramId}. Wallet address: ${address.toLowerCase()}. Nonce: ${uuid}. Deadline: ${deadline}`;
  }
}
