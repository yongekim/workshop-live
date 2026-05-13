export type GroupStatus =
  | "Inte startad"
  | "Aktiv"
  | "Redo för sammanfattning"

export type ImpactLevel = "Låg" | "Medel" | "Hög"
export type DifficultyLevel = "Låg" | "Medel" | "Hög"

export type ResponseKey = "currentState" | "friction" | "improvements"

export type WorkshopResponseConfig = {
  key: ResponseKey
  title: string
  description: string
  placeholder: string
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
  name: string
  subtitle: string
  date: string
  description: string
}

export type WorkshopState = {
  event: WorkshopEvent
  groups: WorkshopGroup[]
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