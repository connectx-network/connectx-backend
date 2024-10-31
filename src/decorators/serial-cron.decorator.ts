import { CronOptions, Cron } from '@nestjs/schedule';

export const SerialCron =
  (cronTime: string | Date, options?: CronOptions) =>
  (target: any, methodName: string, descriptor: PropertyDescriptor) => {
    Serial(target, methodName, descriptor);
    Cron(cronTime, options)(target, methodName, descriptor);
  };

const Serial = (
  _target: any,
  _methodName: string,
  descriptor: PropertyDescriptor,
) => {
  const originalMethod = descriptor.value;
  let running = false;
  descriptor.value = async function (...args: any[]) {
    if (running) {
      return;
    }
    running = true;
    try {
      const rs = await originalMethod.apply(this, args);
      return rs;
    } finally {
      running = false;
    }
  };
  return descriptor;
};
