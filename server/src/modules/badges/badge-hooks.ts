import { evaluate } from './engine.js'

/** 徽章检测钩子：在所有触发事件点调用（打卡完成、花园行为、问答正确、便便记录、模块完成） */
export function onCheckinEvent(childId: number) {
  return evaluate(childId)
}

export function onGardenActionEvent(childId: number) {
  return evaluate(childId)
}

export function onQuizEvent(childId: number) {
  return evaluate(childId)
}

export function onStoolEvent(childId: number) {
  return evaluate(childId)
}
