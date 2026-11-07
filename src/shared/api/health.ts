import { client } from './client'
import type { HealthDto } from '@/shared/types/common'

export const healthApi = {
  check: () => client.get<HealthDto>('/health', { auth: false }),
}
