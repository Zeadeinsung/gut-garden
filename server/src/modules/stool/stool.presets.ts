export interface BristolPreset {
  bristol_type: number
  diagnosis: string
  task_suggestion: string
}

export const BRISTOL_PRESETS: Record<number, { diagnosis: string; task_suggestion: string }> = {
  1: { diagnosis: '兔子便便 — 有点干哦', task_suggestion: '多喝水，多吃纤维丰富的蔬菜～' },
  2: { diagnosis: '香肠便便 — 有点干硬', task_suggestion: '多喝水，多吃蔬果，适量运动～' },
  3: { diagnosis: '条状便便 — 基本正常', task_suggestion: '继续均衡饮食，注意补充水分～' },
  4: { diagnosis: '香蕉便 — 非常健康！', task_suggestion: '继续保持均衡饮食～' },
  5: { diagnosis: '软块便便 — 基本正常', task_suggestion: '注意多喝水，多吃蔬菜哦～' },
  6: { diagnosis: '糊状便便 — 需要关注', task_suggestion: '建议调整饮食，多吃纤维食物，多喝水～' },
  7: { diagnosis: '水样便便 — 需要关注', task_suggestion: '肚子不舒服吗？记得补充水分，如果持续要告诉爸爸妈妈哦～' },
}

export const ICON_TO_BRISTOL: Record<string, number> = {
  type_1_rabbit: 1,
  type_2_grape: 2,
  type_3_corn: 3,
  type_4_banana: 4,
  type_5_icecream: 5,
  type_6_marshmallow: 6,
  type_7_water: 7,
}
