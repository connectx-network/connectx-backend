import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import {MailJob, Queues} from 'src/types/queue.type';
import {MailService} from "./mail.service";

@Processor(Queues.mail)
export class MailConsummer {
    constructor(private readonly mailService: MailService) {}

    @Process(MailJob.sendQrMail)
    async handleSendQrMail({ data }: Job) {
        const { to, subject, fullName, eventId, userId, eventName } = data;
        return this.mailService.sendJoinEventQrCodeEmail({ to, subject, fullName, eventId, userId, eventName });
    }
    @Process(MailJob.sendQrImported)
    async handleSendQrImportedMail({ data }: Job) {
        return this.mailService.sendManyImportedUserEventMail(data);
    }
}
