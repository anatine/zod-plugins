/* eslint-disable @typescript-eslint/no-unused-vars */
import { ZodValidationPipe } from '@anatine/zod-nestjs';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UsePipes,
} from '@nestjs/common';
import { ApiCreatedResponse } from '@nestjs/swagger';
import {
  CatDto,
  CreateCatResponseDto,
  GetCatsDto,
  GetCatsParamsDto,
  UpdateCatDto,
  UpdateCatResponseDto,
} from './cats.dto';

@Controller('cats')
@UsePipes(ZodValidationPipe)
export class CatsController {
  // Get all cats
  @Get()
  @ApiCreatedResponse({
    type: GetCatsDto,
  })
  async findAll(): Promise<GetCatsDto> {
    return { cats: ['Lizzie', 'Spike'] };
  }

  // Get single cat
  @Get(':id')
  @ApiCreatedResponse({
    type: CatDto,
  })
  async findOne(@Param() { id }: GetCatsParamsDto): Promise<CatDto> {
    return {
      name: `Cat-${id}`,
      age: 8,
      breed: 'Unknown',
    };
  }

  @Post()
  @ApiCreatedResponse({
    description: 'The record has been successfully created.',
    type: CreateCatResponseDto,
  })
  async create(@Body() createCatDto: CatDto): Promise<CreateCatResponseDto> {
    return {
      success: true,
      message: 'Cat created',
      name: createCatDto.name,
    };
  }

  @Patch()
  async update(
    @Body() updateCatDto: UpdateCatDto
  ): Promise<UpdateCatResponseDto> {
    return {
      success: true,
      message: `Cat's age of ${updateCatDto.age} updated`,
    };
  }
}
