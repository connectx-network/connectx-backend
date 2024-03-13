import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import {OtpEmailDto, QrCodeDto} from './mail.dto';
import { resolve } from 'path';
import { renderFile } from 'ejs';
import { SendMailOptions } from 'nodemailer';
import { QrCodeService } from '../qr-code/qr-code.service';
import { Readable } from 'stream';
@Injectable()
export class MailService {
  private logoUrl = process.env.LOGO_URL;

  constructor(
    private readonly mailerService: MailerService,
    private readonly qrCodeService: QrCodeService,
  ) {}

  async sendCreateAccountOtpEmail(data: OtpEmailDto) {
    const { to, subject, otp, fullName } = data;
    const templatePath = resolve(__dirname, 'templates', 'mail.verify.ejs');
    const renderedHTML = await renderFile(templatePath, {
      fullName,
      otp,
      logoUrl: this.logoUrl,
    });
    const mailOptions: SendMailOptions = {
      from: process.env.MAIL_ADDRESS,
      to,
      subject,
      html: renderedHTML,
    };
    await this.mailerService.sendMail(mailOptions);

    return { success: true };
  }

  async sendJoinEventQrCodeEmail(data: QrCodeDto) {
    const { to, subject, fullName, eventId, userId, eventName } = data;
    const qrCode = await this.qrCodeService.generateQrCode(`${eventId};${userId}`)
    const qrCodeStream = Readable.from(Buffer.from(qrCode.split('base64,')[1], 'base64'));


    const templatePath = resolve(__dirname, 'templates', 'mail.qrcode.ejs');
    const renderedHTML = await renderFile(templatePath, {
      fullName,
      qrCode,
      eventName,
      logoUrl: this.logoUrl,
    });
    const mailOptions: SendMailOptions = {
      from: process.env.MAIL_ADDRESS,
      to,
      subject,
      html: renderedHTML,
      attachments: [
        {
          filename: 'qrcode.png',
          content: qrCodeStream,
          cid: 'qrcode', // This should match the value used in the HTML img src attribute
        },
      ],
    };
    await this.mailerService.sendMail(mailOptions);

    return { success: true };
  }

  async sendImportedUserEventQrCodeEmail(data: QrCodeDto) {
    const iosLink = process.env.DOWNLOAD_APP_LINK_IOS
    const androidLink = process.env.DOWNLOAD_APP_LINK_ANDROID
    const webLink = process.env.APP_LINK_WEB

    const { to, subject, fullName, eventId, userId, eventName } = data;
    const qrCode = await this.qrCodeService.generateQrCode(`${eventId};${userId}`)
    const qrCodeStream = Readable.from(Buffer.from(qrCode.split('base64,')[1], 'base64'));


    const templatePath = resolve(__dirname, 'templates', 'mail.qrcode.imported.ejs');
    const renderedHTML = await renderFile(templatePath, {
      fullName,
      qrCode,
      eventName,
      logoUrl: this.logoUrl,
      iosLink,
      androidLink,
      webLink
    });
    const mailOptions: SendMailOptions = {
      from: process.env.MAIL_ADDRESS,
      to,
      subject,
      html: renderedHTML,
      attachments: [
        {
          filename: 'qrcode.png',
          content: qrCodeStream,
          cid: 'qrcode', // This should match the value used in the HTML img src attribute
        },
      ],
    };
    await this.mailerService.sendMail(mailOptions);

    return { success: true };
  }

  async sendManyImportedUserEventMail(data: QrCodeDto[]) {
    return Promise.all(data.map(item => this.sendImportedUserEventQrCodeEmail(item)))
  }
}
