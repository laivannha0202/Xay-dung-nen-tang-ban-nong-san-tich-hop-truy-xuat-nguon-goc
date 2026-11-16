import Fastify, { type FastifyError } from 'fastify'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { config } from './config.js'
import { AppError } from './lib/errors.js'
import { authRoutes } from './routes/auth.js'
import { publicRoutes } from './routes/public.js'
import { customerRoutes } from './routes/customer.js'
import { adminRoutes } from './routes/admin.js'
import { adminOpsRoutes } from './routes/adminOps.js'
import { uploadRoutes } from './routes/uploads.js'

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.isProd ? 'info' : 'warn',
      redact: ['req.headers.authorization', 'req.headers.cookie', 'req.body.password', '*.password', '*.password_hash'],
    },
    trustProxy: true,
  })

  await app.register(cors, {
    origin: config.corsOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['content-type', 'authorization', 'idempotency-key', 'x-agri-csrf'],
  })
  await app.register(cookie)
  await app.register(multipart, { limits: { fileSize: 8 * 1024 * 1024, files: 1 } })
  await app.register(rateLimit, { global: false })
  await app.register(swagger, {
    openapi: {
      info: { title: 'AgriMarket API', version: '1.0.0', description: 'Bán nông sản truy xuất nguồn gốc theo lô' },
      servers: [{ url: '/api/v1' }],
    },
  })
  await app.register(swaggerUi, { routePrefix: '/docs' })

  app.setErrorHandler((err: FastifyError, req, reply) => {
    if (err instanceof AppError) {
      return reply.code(err.statusCode).send({
        error: { code: err.code, message: err.message, field_errors: err.fieldErrors, ...err.extra },
        trace_id: req.id,
      })
    }
    if (err.statusCode === 429) {
      return reply.code(429).send({
        error: { code: 'TOO_MANY_REQUESTS', message: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.' },
        trace_id: req.id,
      })
    }
    if (err.validation) {
      return reply.code(422).send({
        error: { code: 'INVALID_DATA', message: 'Dữ liệu không hợp lệ.' },
        trace_id: req.id,
      })
    }
    req.log.error({ err }, 'unhandled')
    // Never leak stack traces or SQL to clients.
    return reply.code(err.statusCode && err.statusCode >= 400 ? err.statusCode : 500).send({
      error: { code: 'INTERNAL_ERROR', message: 'Đã xảy ra lỗi. Vui lòng thử lại.' },
      trace_id: req.id,
    })
  })

  app.setNotFoundHandler((req, reply) =>
    reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy tài nguyên.' }, trace_id: req.id }),
  )

  await app.register(
    async (scope) => {
      await scope.register(authRoutes)
      await scope.register(publicRoutes)
      await scope.register(customerRoutes)
      await scope.register(adminRoutes)
      await scope.register(adminOpsRoutes)
      await scope.register(uploadRoutes)
    },
    { prefix: '/api/v1' },
  )

  return app
}

const isMain = process.argv[1]?.endsWith('server.ts')
if (isMain) {
  const app = await buildApp()
  await app.listen({ port: config.port, host: config.host })
  app.log.warn(`AgriMarket API on http://localhost:${config.port} (docs at /docs)`)
}
