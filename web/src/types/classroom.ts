export type QuizType = 'choice' | 'match' | 'order'

export interface KnowledgeModule {
  code: string
  title: string
  description: string
  card_count: number
  quiz_count: number
  progress: number
  unlocked: boolean
  stars: number
}

export interface KnowledgeCard {
  id: number
  module_code: string
  title: string
  front_text: string
  back_text: string
  image_url: string
  parent_note: string
}

export interface QuizQuestion {
  id: number
  type: QuizType
  question: string
  options: string[]
  answer: number | number[]
}
