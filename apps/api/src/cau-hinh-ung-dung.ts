import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

export function cauHinhUngDung(app: INestApplication): void {
  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();
  app.use(cookieParser());

  const configService = app.get(ConfigService);
  const corsOrigins = (
    configService.get<string>('CORS_ORIGINS') ??
    'http://127.0.0.1:3001,http://localhost:3001,http://127.0.0.1:3002,http://localhost:3002'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

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
