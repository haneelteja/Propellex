import pino from 'pino';
import pinoHttp from 'pino-http';
import { v4 as uuidv4 } from 'uuid';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  ...(process.env.NODE_ENV === 'development' && {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  }),
});

export const requestLogger = pinoHttp({
  logger,
  genReqId: (req) => {
    const existing = req.headers['x-request-id'];
    if (typeof existing === 'string' && existing) return existing;
    return uuidv4();
  },
  customSuccessMessage: (req, res) =>
    `${req.method} ${req.url} → ${res.statusCode}`,
  customErrorMessage: (req, res, err) =>
    `${req.method} ${req.url} failed [${res.statusCode}]: ${err.message}`,
  customAttributeKeys: { reqId: 'requestId' },
  // Don't log health check noise
  autoLogging: {
    ignore: (req) => req.url === '/health',
  },
});
