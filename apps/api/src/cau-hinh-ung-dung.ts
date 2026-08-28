import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

export function cauHinhUngDung(app: INestApplication): void {
  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();

  // Swagger UI cần inline script/style; CSP sẽ được siết lại khi chốt cấu hình production.
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const cauHinhSwagger = new DocumentBuilder()
    .setTitle('AgriMarket API')
    .setDescription('REST API dùng chung cho hệ thống AgriMarket')
    .setVersion('1.0')
    .build();

  const taiLieu = SwaggerModule.createDocument(app, cauHinhSwagger);

  SwaggerModule.setup('docs', app, taiLieu, {
    jsonDocumentUrl: 'openapi-json',
  });
}
