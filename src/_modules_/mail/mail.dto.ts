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
