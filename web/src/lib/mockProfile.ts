export interface MockFriend {
  name: string
  emoji: string
  color: string
  level: number
  status: string
  energy: number
}

export interface MockHistoryPoint {
  label: string
  value: number
}

/* 演示数据：真实用户数据接入前，先让「我的主页」看起来是活的 */
export const MOCK_PROFILE = {
  name: '小园丁',
  level: 5,
  stage: '成长',
  xp: 460,
  xpPct: 92,
  streak: 12,
  badges: 8,
  badgesTotal: 60,
  knowledge: 24,
  stool: 28,
  interactionDays: 45,
  statSummary: [
    { key: 'streak', label: '连续打卡', value: 12, unit: '天' },
    { key: 'badges', label: '徽章', value: 8, unit: '枚' },
    { key: 'knowledge', label: '知识问答', value: 24, unit: '题' },
  ],
  friends: [
    { name: '花花酱', emoji: '👧', color: '#F6C8CB', level: 4, status: '今天照顾花园了！', energy: 86 },
    { name: '青青小可爱', emoji: '👦', color: '#BCE3C7', level: 5, status: '连续打卡 7 天', energy: 72 },
    { name: '阳光小苗苗', emoji: '👧', color: '#FFE3AE', level: 3, status: '正在探索新知识', energy: 65 },
  ],
  goal: { target: 14, progress: 12 },
  reward: '神秘种子 ×1',
  history: {
    stool: [
      { label: '04/28', value: 2 },
      { label: '04/29', value: 1 },
      { label: '04/30', value: 3 },
      { label: '05/01', value: 2 },
      { label: '05/02', value: 4 },
      { label: '05/03', value: 3 },
      { label: '05/04', value: 5 },
      { label: '05/05', value: 4 },
    ],
    learn: [
      { label: '04/28', value: 3 },
      { label: '04/29', value: 5 },
      { label: '04/30', value: 4 },
      { label: '05/01', value: 7 },
      { label: '05/02', value: 6 },
      { label: '05/03', value: 8 },
      { label: '05/04', value: 7 },
      { label: '05/05', value: 9 },
    ],
  },
}
