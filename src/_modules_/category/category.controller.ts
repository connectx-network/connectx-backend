import {Body, Controller, Get, Post} from '@nestjs/common';
import { CategoryService } from './category.service';
import {CreateManyInterestDto} from "./category.dto";
import {ApiTags} from "@nestjs/swagger";

@ApiTags('category')
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post('/many')
  async createMany(@Body() createManyInterestDto: CreateManyInterestDto) {
    return this.categoryService.createMany(createManyInterestDto)
  }

  @Get()
  async find() {
    return this.categoryService.find()
  }
}
