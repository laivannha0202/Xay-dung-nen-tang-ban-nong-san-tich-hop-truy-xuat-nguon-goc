import { existsSync } from 'node:fs'

// Dev convenience: .env is optional; deployments pass real env vars.
if (existsSync('.env')) process.loadEnvFile('.env')

export const config = {
  port: Number(process.env.PORT ?? 4000),
  host: process.env.HOST ?? '0.0.0.0',
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://agri:agri@127.0.0.1:5544/agrimarket',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-secret-change-in-production-0123456789',
  publicWebUrl: process.env.PUBLIC_WEB_URL ?? 'http://localhost:3000',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:3001,http://localhost:8081,http://localhost:19006').split(','),
  isProd: process.env.NODE_ENV === 'production',
}

if (config.isProd && config.jwtSecret.startsWith('dev-only')) {
  throw new Error('JWT_SECRET must be set in production')
}
