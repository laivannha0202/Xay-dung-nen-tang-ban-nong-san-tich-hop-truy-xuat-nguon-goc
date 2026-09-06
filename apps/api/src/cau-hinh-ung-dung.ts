import { Logger, ValidationPipe, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

const logger = new Logger('CORS');

function laOriginNoiBoChoPhep(origin: string): boolean {
  try {
    const url = new URL(origin);
    const host = url.hostname;
    const port = url.port;

    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    if (port !== '3001' && port !== '3002') return false;

    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    );
  } catch {
    return false;
  }
}

export function cauHinhUngDung(app: INestApplication): void {
  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();
  app.use(cookieParser());

  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';
  const corsOrigins = (
    configService.get<string>('CORS_ORIGINS') ??
    'http://127.0.0.1:3001,http://localhost:3001,http://127.0.0.1:3002,http://localhost:3002'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    credentials: true,
    origin(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      if (nodeEnv !== 'production' && laOriginNoiBoChoPhep(origin)) {
        callback(null, true);
        return;
      }

      logger.warn(`Từ chối CORS origin: ${origin}`);
      callback(new Error('Origin không được phép bởi CORS.'), false);
    },
  });

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
