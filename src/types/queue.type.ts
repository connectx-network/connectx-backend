export const Queues = {
    notification: 'notification',
    mail: 'mail',
} as const;

export const NotificationJob = {
    sendNotification: 'send-notification',
} as const;

export const MailJob = {
    sendQrMail: 'send-qr-mail',
} as const;