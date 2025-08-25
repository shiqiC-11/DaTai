import type { GuardOptions } from '@authing/guard-react18'
import { env, validateEnv, getEnvVar } from '@/lib/env'

// Validate environment variables on import
validateEnv();

export const AUTHING_APP_ID = getEnvVar('AUTHING_APP_ID', '688f667fecadfe990e2f3cfweknf9b')
export const AUTHING_USERPOOL_ID = getEnvVar('AUTHING_USERPOOL_ID', '688f667d9wefnbaliwemv97268ed2f7b125')
export const AUTHING_APP_HOST = getEnvVar('AUTHING_APP_HOST', 'https://qiyu-datai.authing.cn')

export const guardOptions: GuardOptions = {
  appId: AUTHING_APP_ID,
  // 如果你使用的是私有化部署的 Authing 服务，需要传入自定义 host
  host: AUTHING_APP_HOST,
  // 默认情况下，会使用你在 Authing 控制台中配置的第一个回调地址为此次认证使用的回调地址。
  // 如果你配置了多个回调地址，也可以手动指定（此地址也需要加入到应用的「登录回调 URL」中）：
  redirectUri: env.APP_URL,
} 