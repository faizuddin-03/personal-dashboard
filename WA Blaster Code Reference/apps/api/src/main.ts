import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser = require('cookie-parser');
import * as bodyParser from 'body-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(cookieParser());
  app.use(
    bodyParser.json({
      verify: (req: any, _res, buf) => {
        // Save raw body so the webhook controller can HMAC-verify it
        req.rawBody = buf;
      },
    }),
  );
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN', 'http://localhost:5173'),
    credentials: true,
  });
  app.setGlobalPrefix('api');

  // OpenAPI / Swagger — served at /docs. The global prefix is NOT applied to Swagger's own
  // route, so the UI lives at /docs (not /api/docs).
  const swaggerConfig = new DocumentBuilder()
    .setTitle('WhatsApp Blasting API')
    .setDescription('REST API for the blasting platform and the AI chatbot inbox + admin surface.')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  // Phase 6: warn if real Meta is enabled without credentials (catches local .env drift)
  const mockMode = config.get<string>('WHATSAPP_MOCK_MODE', 'true') === 'true';
  const accessToken = config.get<string>('WHATSAPP_ACCESS_TOKEN', '');
  if (!mockMode && !accessToken) {
    const logger = new Logger('Bootstrap');
    logger.warn('WHATSAPP_MOCK_MODE=false but WHATSAPP_ACCESS_TOKEN is empty — Meta calls will fail with auth errors.');
    logger.warn('Either set WHATSAPP_MOCK_MODE=true in .env for local dev, or fill in real credentials.');
  }

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}`);
}
bootstrap();
