export class EmailDto {
  to: string;
  subject?: string;
  text?: string;
}

export class OtpEmailDto extends EmailDto {
  otp: string;
  fullName: string;
  expiredDate: Date;
}

export class QrCodeDto extends EmailDto {
  eventId: string;
  eventName: string;
  userId: string;
  fullName: string;
  fromDate: Date;
}
export class ManualImportEmailDto extends QrCodeDto {
  password: string;
}
