import { PartialType } from '@nestjs/mapped-types';
import { CreateRoyaltyTokenDto } from './create-royalty-token.dto';

export class UpdateRoyaltyTokenDto extends PartialType(CreateRoyaltyTokenDto) {}
