import { Module } from '@nestjs/common';
import { EventFeedbackService } from './event-feedback.service';
import { EventFeedbackController } from './event-feedback.controller';

@Module({
  controllers: [EventFeedbackController],
  providers: [EventFeedbackService],
})
export class EventFeedbackModule {}
