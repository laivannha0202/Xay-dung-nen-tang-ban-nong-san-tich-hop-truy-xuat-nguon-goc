import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    fileParallelism: false,
    testTimeout: 30000,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgres://agri:agri@127.0.0.1:5544/agrimarket_test',
      JWT_SECRET: 'test-secret-0123456789abcdefghij',
      PUBLIC_WEB_URL: 'http://localhost:3000',
    },
  },
})
