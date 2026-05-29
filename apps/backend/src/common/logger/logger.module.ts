import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';

// Loki transport for log aggregation (optional, loaded dynamically)
function createLokiTransport(lokiUrl: string, nodeEnv: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const LokiTransport = require('winston-loki');
    return new LokiTransport({
      host: lokiUrl,
      labels: { app: 'brain-storm-backend', env: nodeEnv },
      json: true,
      batching: true,
      interval: 5,
      onConnectionError: (err: Error) => console.error('Loki connection error:', err.message),
    });
  } catch {
    return null;
  }
}

@Module({
  imports: [
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logLevel = configService.get<string>('LOG_LEVEL', 'info');
        const nodeEnv = configService.get<string>('NODE_ENV', 'development');
        const lokiUrl = configService.get<string>('LOKI_URL');

        const logFormat =
          nodeEnv === 'production'
            ? winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json(),
              )
            : winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
                  const contextStr = context ? `[${context}] ` : '';
                  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                  return `${timestamp} ${level}: ${contextStr}${message}${metaStr}`;
                }),
              );

        const transports: winston.transport[] = [
          new winston.transports.Console({
            handleExceptions: true,
            handleRejections: true,
          }),
        ];

        if (lokiUrl) {
          const lokiTransport = createLokiTransport(lokiUrl, nodeEnv);
          if (lokiTransport) transports.push(lokiTransport);
        }

        return {
          level: logLevel,
          format: logFormat,
          transports,
          exitOnError: false,
        };
      },
    }),
  ],
  exports: [WinstonModule],
})
export class LoggerModule {}
