import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { OtpEmailDto } from './mail.dto';
import { resolve } from 'path';
import { renderFile } from 'ejs';
import { SendMailOptions } from 'nodemailer';

@Injectable()
export class MailService {
  private logoUrl = process.env.LOGO_URL;

  constructor(private readonly mailerService: MailerService) {}

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
}
