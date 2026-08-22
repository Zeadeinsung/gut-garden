import { Howl } from 'howler'
import { useUIStore } from '@/stores/uiStore'

export type SoundName =
  | 'click'
  | 'pop'
  | 'success'
  | 'error'
  | 'notification'
  | 'celebrate'
  | 'coin'

const FILES: Record<SoundName, string> = {
  click: '/audio/click.mp3',
  pop: '/audio/pop.mp3',
  success: '/audio/success.mp3',
  error: '/audio/error.mp3',
  notification: '/audio/notification.mp3',
  celebrate: '/audio/celebrate.wav',
  coin: '/audio/coin.wav',
}

// 音量微调：不同场景需要的响度不同
const VOLUME: Partial<Record<SoundName, number>> = {
  click: 0.5,
  pop: 0.6,
  notification: 0.55,
  success: 0.65,
  celebrate: 0.7,
  coin: 0.7,
}

const cache = new Map<SoundName, Howl>()

function howl(name: SoundName): Howl {
  let h = cache.get(name)
  if (!h) {
    h = new Howl({ src: [FILES[name]], volume: VOLUME[name] ?? 0.7, preload: true })
    cache.set(name, h)
  }
  return h
}

function isEnabled(): boolean {
  return useUIStore.getState().soundEnabled
}

export function playSound(name: SoundName, opts?: { rate?: number; volume?: number }): void {
  if (!isEnabled()) return
  const h = howl(name)
  if (opts?.volume != null) h.volume(opts.volume)
  h.rate(opts?.rate ?? 1)
  h.play()
}

export const sfx = {
  click: () => playSound('click'),
  pop: () => playSound('pop'),
  success: () => playSound('success'),
  error: () => playSound('error'),
  notification: () => playSound('notification'),
  celebrate: () => playSound('celebrate'),
  coin: () => playSound('coin'),
}

// 预加载全部音效（比如用户首次交互后预热，避免首次播放延迟）
export function preloadSounds(): void {
  for (const name of Object.keys(FILES) as SoundName[]) howl(name).load()
}
