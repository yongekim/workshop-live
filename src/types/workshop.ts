export type GroupStatus =
  | "Inte startad"
  | "Aktiv"
  | "Redo för sammanfattning"

export type EventStatus = "draft" | "active" | "completed" | "archived"

export type ImpactLevel = "Låg" | "Medel" | "Hög"
export type DifficultyLevel = "Låg" | "Medel" | "Hög"

export type ResponseKey = string

export type WorkshopResponseConfig = {
  dbId?: string
  key: ResponseKey
  title: string
  description: string
  placeholder: string
  sortOrder?: number
  isRequired?: boolean
  helperText?: string
}

export type InsightCard = {
  id: string
  groupId: string
  title: string
  problem: string
  consequence: string
  rootCause: string
  idea: string
  impact: ImpactLevel
  difficulty: DifficultyLevel
  suggestedOwner: string
  nextStep: string
  votes: number
  createdAt: string
  aiGenerated: boolean
}

export type AiInsightCardInput = {
  title: string
  problem: string
  consequence: string
  rootCause: string
  idea: string
  impact: ImpactLevel
  difficulty: DifficultyLevel
  suggestedOwner: string
  nextStep: string
}

export type WorkshopGroup = {
  id: string
  dbId?: string
  name: string
  accessCode: string
  topicTitle: string
  topicDescription: string
  status: GroupStatus
  participants: number
  progress: number
  responses: Record<ResponseKey, string>
  insights: InsightCard[]
  lastSavedAt?: string
  readyAt?: string
}

export type WorkshopEvent = {
  dbId?: string
  slug?: string
  name: string
  subtitle: string
  date: string
  description: string
  status?: EventStatus
}

export type WorkshopState = {
  event: WorkshopEvent
  groups: WorkshopGroup[]
  questions: WorkshopResponseConfig[]
  moderatorQuestions: string[]
  commonThemes: string[]
  updatedAt: string
}

export type ModeratorAnalysis = {
  themes: string[]
  tensions: string[]
  moderatorQuestions: string[]
  quickWins: string[]
}

export type ReportAiSummary = {
  executiveSummary: string[]
  keyFindings: string[]
  recommendedNextSteps: {
    timeframe: string
    action: string
  }[]
}

export type ReportAction = {
  priority: number
  title: string
  sourceGroup: string
  impact: ImpactLevel
  difficulty: DifficultyLevel
  suggestedOwner: string
  nextStep: string
  votes: number
}

export type ReportSnapshot = {
  id: string
  title: string
  reportMarkdown: string
  createdAt: string
}

export type Participant = {
  id: string
  eventId: string
  groupId: string | null
  participantSessionId: string
  name: string
  company: string
  email: string
  joinedAt: string
}