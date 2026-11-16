import { configureApi } from '@agrimarket/core'

configureApi({ baseUrl: process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000/api/v1' })

export * from '@agrimarket/core'
export { API_BASE } from './config'
