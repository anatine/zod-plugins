import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './app/app.module';
import { patchNestjsSwagger } from '@anatine/zod-nestjs';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

describe('Cats', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    const config = new DocumentBuilder()
      .setTitle('Cats example')
      .setDescription('The cats API description')
      .setVersion('1.0')
      .addTag('cats')
      .build();

    patchNestjsSwagger();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    await app.init();
  });

  it(`/GET cats`, () => {
    // return request(app.getHttpServer()).get('/cats').expect(200).expect({
    //   data: 'This action returns all cats',
    // });
    return request(app.getHttpServer())
      .get('/cats')
      .set('Accept', 'application/json')
      .expect(200)
      .expect({ cats: ['Lizzie', 'Spike'] });
  });

  it(`/POST cats`, () => {
    return request(app.getHttpServer())
      .post('/cats')
      .set('Accept', 'application/json')
      .send({ name: 'Spike', age: 3, breed: 'Persian' })
      .expect(201)
      .expect({ success: true, message: 'Cat created', name: 'Spike' });
  });

  // it('Lets peek', async () => {
  //   const result = await request(app.getHttpServer())
  //     .get('/api-json')
  //     .set('Accept', 'application/json');

  //   const { body } = result;

  //   console.log(inspect(body, false, 10, true));
  // });

  it(`Swagger Test`, () => {
    return request(app.getHttpServer())
      .get('/api-json')
      .set('Accept', 'application/json')
      .expect(200)
      .expect({
        openapi: '3.0.0',
        paths: {
          '/': {
            get: {
              operationId: 'AppController_getData',
              parameters: [],
              responses: { '200': { description: '' } },
            },
          },
          '/cats': {
            get: {
              operationId: 'CatsController_findAll',
              parameters: [],
              responses: {
                '201': {
                  description: '',
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/GetCatsDto' },
                    },
                  },
                },
              },
            },
            post: {
              operationId: 'CatsController_create',
              parameters: [],
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/CatDto' },
                  },
                },
              },
              responses: {
                '201': {
                  description: 'The record has been successfully created.',
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '#/components/schemas/CreateCatResponseDto',
                      },
                    },
                  },
                },
              },
            },
            patch: {
              operationId: 'CatsController_update',
              parameters: [],
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/UpdateCatDto' },
                  },
                },
              },
              responses: { '200': { description: '' } },
            },
          },
          '/cats/{id}': {
            get: {
              operationId: 'CatsController_findOne',
              parameters: [
                {
                  name: 'id',
                  required: true,
                  in: 'path',
                  schema: { type: 'string' },
                },
              ],
              responses: {
                '201': {
                  description: '',
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/CatDto' },
                    },
                  },
                },
              },
            },
          },
        },
        info: {
          title: 'Cats example',
          description: 'The cats API description',
          version: '1.0',
          contact: {},
        },
        tags: [{ name: 'cats', description: '' }],
        servers: [],
        components: {
          schemas: {
            GetCatsDto: {
              type: 'object',
              properties: {
                cats: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'List of cats',
                },
              },
              required: ['cats'],
              title: 'Get Cat Response',
            },
            CatDto: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                age: { type: 'number' },
                breed: { type: 'string' },
              },
              required: ['name', 'age', 'breed'],
              title: 'Cat',
              description: 'A cat',
            },
            CreateCatResponseDto: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                message: { type: 'string' },
                name: { type: 'string' },
              },
              required: ['success', 'message', 'name'],
            },
            UpdateCatDto: {
              type: 'object',
              properties: {
                age: { type: 'number' },
                breed: { type: 'string' },
              },
              required: ['age', 'breed'],
            },
          },
        },
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
