export const env = {
  port: Number(process.env.PORT || 3001),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '7d',
  adminPhones: (process.env.ADMIN_PHONES || '').split(',').map((s) => s.trim()).filter(Boolean),
  aiApiKey: process.env.AI_API_KEY || process.env.DASHSCOPE_API_KEY,
  aiBaseUrl: process.env.AI_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  aiModel: process.env.AI_MODEL || 'qwen-flash',
  stoolApiKey: process.env.STOOL_API_KEY,
  stoolApiUrl: process.env.STOOL_API_URL,
  stoolMock: process.env.STOOL_MOCK !== 'false',
}
