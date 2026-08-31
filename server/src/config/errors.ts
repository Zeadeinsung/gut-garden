import { AppError } from '../lib/appError.js'

export const ERROR_DEFS = {
  AUTH_001: { message: '验证码错误或已过期', status: 401 },
  AUTH_002: { message: '验证码发送过于频繁，请稍后再试', status: 429 },
  AUTH_003: { message: '请先登录', status: 401 },
  AUTH_004: { message: '需要管理员权限', status: 403 },
  CHILD_001: { message: '儿童档案不存在', status: 404 },
  CHILD_002: { message: '年龄必须在3-10岁之间', status: 400 },
  CHECKIN_001: { message: '打卡记录不存在', status: 404 },
  CHECKIN_002: { message: '本月补签次数已达上限（3次）', status: 400 },
  CHECKIN_003: { message: '任务状态无效', status: 400 },
  CHECKIN_004: { message: '补签日期无效', status: 400 },
  STOOL_001: { message: '请上传便便照片哦～', status: 400 },
  STOOL_002: { message: '便便分析记录不存在', status: 404 },
  STOOL_003: { message: '菌小园今天有点累，请稍后重试～', status: 500 },
  STOOL_004: { message: '图片格式或大小不符合要求（jpg/png/webp ≤10MB）', status: 400 },
  STOOL_005: { message: '照片分析需要注册账号哦～', status: 403 },
  CLASSROOM_001: { message: '知识模块不存在', status: 404 },
  CLASSROOM_002: { message: '题目不存在', status: 404 },
  BADGE_001: { message: '徽章定义不存在', status: 404 },
  GARDEN_001: { message: '花园状态不存在', status: 404 },
  MIGRATE_001: { message: '游客数据迁移冲突', status: 409 },
  FRIENDS_001: { message: '好友参数无效', status: 400 },
} as const

export type ErrorCode = keyof typeof ERROR_DEFS

export function throwError(code: ErrorCode): never {
  const def = ERROR_DEFS[code]
  throw new AppError(code, def.message, def.status)
}
