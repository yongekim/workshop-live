"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Lightbulb,
  Loader2,
  Save,
  Sparkles,
  Target,
  ThumbsUp,
  WandSparkles,
} from "lucide-react"

import { useSupabaseWorkshopState } from "@/hooks/use-supabase-workshop-state"
import { responseConfigs } from "@/lib/workshop-state"
import type { AiInsightCardInput } from "@/types/workshop"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"

type GroupWorkspaceProps = {
  groupId: string
}

type AiAction = "deepen" | "concrete" | "travelManager"

function formatTime(value?: string) {
  if (!value) return "Inte sparad ännu"

  return new Intl.DateTimeFormat("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value))
}

export function GroupWorkspace({ groupId }: GroupWorkspaceProps) {
  const {
    state,
    error,
    realtimeStatus,
    updateGroupResponse,
    markGroupReady,
    createInsightFromGroup,
    createInsightCardFromData,
    voteForInsight,
  } = useSupabaseWorkshopState()

  const [assistantTitle, setAssistantTitle] = useState<string>("")
  const [assistantSuggestion, setAssistantSuggestion] = useState<string>("")
  const [aiError, setAiError] = useState<string>("")
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [isInsightLoading, setIsInsightLoading] = useState(false)

  const group = useMemo(
    () => state?.groups.find((item) => item.id === groupId),
    [state, groupId]
  )

  if (!state) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-slate-300">Laddar grupp...</p>
      </main>
    )
  }

  if (!group) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <Card className="max-w-xl border-white/10 bg-white/[0.06] text-white">
          <CardHeader>
            <CardTitle>Gruppen hittades inte</CardTitle>
            <CardDescription className="text-slate-400">
              Kontrollera länken eller gå tillbaka till gruppvalet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="rounded-full">
              <Link href="/join">Till gruppval</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  const activeGroup = group

  async function runAiAssist(action: AiAction) {
    try {
      setIsAiLoading(true)
      setAiError("")
      setAssistantTitle("")
      setAssistantSuggestion("")

      const response = await fetch("/api/ai/group-assist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          group: activeGroup,
        }),
      })

      const data = (await response.json()) as {
        title?: string
        suggestion?: string
        error?: string
      }

      if (!response.ok) {
        throw new Error(data.error || "Kunde inte skapa AI-förslag.")
      }

      setAssistantTitle(data.title || "AI-förslag")
      setAssistantSuggestion(data.suggestion || "")
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Kunde inte skapa AI-förslag."

      setAiError(message)
    } finally {
      setIsAiLoading(false)
    }
  }

  async function createAiInsightCard() {
    try {
      setIsInsightLoading(true)
      setAiError("")

      const response = await fetch("/api/ai/create-insight-card", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          group: activeGroup,
        }),
      })

      const data = (await response.json()) as {
        card?: AiInsightCardInput
        error?: string
      }

      if (!response.ok || !data.card) {
        throw new Error(data.error || "Kunde inte skapa AI-insiktskort.")
      }

      await createInsightCardFromData(activeGroup.id, data.card, true)
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Kunde inte skapa AI-insiktskort."

      setAiError(message)
    } finally {
      setIsInsightLoading(false)
    }
  }

  function appendSuggestionToImprovements() {
    if (!assistantSuggestion.trim()) return

    const current = activeGroup.responses.improvements.trim()
    const nextValue = current
      ? `${current}\n\n${assistantTitle}\n${assistantSuggestion}`
      : `${assistantTitle}\n${assistantSuggestion}`

    updateGroupResponse(activeGroup.id, "improvements", nextValue)
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Button
            asChild
            variant="ghost"
            className="mb-6 text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <Link href="/join">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tillbaka till gruppval
            </Link>
          </Button>

          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge className="rounded-full bg-cyan-400/10 px-4 py-2 text-cyan-200 hover:bg-cyan-400/10">
                  {activeGroup.name} · {activeGroup.status}
                </Badge>

                <Badge className="rounded-full bg-white/10 px-4 py-2 text-slate-200 hover:bg-white/10">
                  Realtime:{" "}
                  {realtimeStatus === "connected"
                    ? "ansluten"
                    : realtimeStatus === "connecting"
                      ? "ansluter"
                      : "frånkopplad"}
                </Badge>
              </div>

              <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
                {activeGroup.topicTitle}
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
                {activeGroup.topicDescription}
              </p>

              {(error || aiError) && (
                <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm leading-6 text-red-200">
                  {error || aiError}
                </div>
              )}
            </div>

            <Card className="border-white/10 bg-white/[0.06] text-white">
              <CardHeader>
                <CardDescription className="text-slate-400">
                  Gruppstatus
                </CardDescription>
                <CardTitle>Arbetet är {activeGroup.progress}% klart</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={activeGroup.progress} className="mb-4" />

                <div className="space-y-3 text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    <span>
                      Sparat i databasen: {formatTime(activeGroup.lastSavedAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Alla svar sparas i Supabase och syns för moderatorn.</span>
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  <Button
                    className="rounded-full"
                    onClick={createAiInsightCard}
                    disabled={isInsightLoading}
                  >
                    {isInsightLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <WandSparkles className="mr-2 h-4 w-4" />
                    )}
                    Skapa AI-insiktskort
                  </Button>

                  <Button
                    className="rounded-full"
                    variant="secondary"
                    onClick={() => createInsightFromGroup(activeGroup.id)}
                  >
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Skapa enkelt insiktskort
                  </Button>

                  <Button
                    className="rounded-full"
                    variant="secondary"
                    onClick={() => markGroupReady(activeGroup.id)}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Markera gruppen som redo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="space-y-5">
            {responseConfigs.map((config) => (
              <Card
                key={config.key}
                className="border-white/10 bg-white/[0.06] text-white"
              >
                <CardHeader>
                  <CardTitle>{config.title}</CardTitle>
                  <CardDescription className="text-slate-400">
                    {config.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    className="min-h-40 border-white/10 bg-slate-950/80 text-white placeholder:text-slate-500"
                    placeholder={config.placeholder}
                    value={activeGroup.responses[config.key]}
                    onChange={(event) =>
                      updateGroupResponse(
                        activeGroup.id,
                        config.key,
                        event.target.value
                      )
                    }
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          <aside className="space-y-5">
            <Card className="border-cyan-400/20 bg-cyan-400/10 text-white">
              <CardHeader>
                <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/20">
                  <BrainCircuit className="h-5 w-5 text-cyan-100" />
                </div>
                <CardTitle>AI-stöd</CardTitle>
                <CardDescription className="text-cyan-100/80">
                  AI:n hjälper gruppen att fördjupa, konkretisera och se
                  resonemanget ur Travel Manager-perspektiv.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start rounded-full"
                  variant="secondary"
                  onClick={() => runAiAssist("deepen")}
                  disabled={isAiLoading}
                >
                  {isAiLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Fördjupa resonemanget
                </Button>

                <Button
                  className="w-full justify-start rounded-full"
                  variant="secondary"
                  onClick={() => runAiAssist("concrete")}
                  disabled={isAiLoading}
                >
                  <Target className="mr-2 h-4 w-4" />
                  Gör mer konkret
                </Button>

                <Button
                  className="w-full justify-start rounded-full"
                  variant="secondary"
                  onClick={() => runAiAssist("travelManager")}
                  disabled={isAiLoading}
                >
                  <Lightbulb className="mr-2 h-4 w-4" />
                  Se från Travel Manager-perspektiv
                </Button>

                {assistantSuggestion && (
                  <div className="mt-5 rounded-2xl border border-cyan-200/20 bg-slate-950/50 p-4">
                    <p className="mb-3 text-sm font-medium text-cyan-50">
                      {assistantTitle}
                    </p>
                    <pre className="whitespace-pre-wrap text-sm leading-6 text-cyan-50/90">
                      {assistantSuggestion}
                    </pre>

                    <Button
                      className="mt-4 w-full rounded-full"
                      variant="secondary"
                      onClick={appendSuggestionToImprovements}
                    >
                      Lägg till i förbättringar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.06] text-white">
              <CardHeader>
                <CardTitle>Insiktskort</CardTitle>
                <CardDescription className="text-slate-400">
                  Förslag som kan prioriteras och användas i rapporten.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeGroup.insights.length > 0 ? (
                  activeGroup.insights.map((insight) => (
                    <div
                      key={insight.id}
                      className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"
                    >
                      <div className="mb-2 flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-200" />
                        <div>
                          <p className="font-medium">{insight.title}</p>
                          {insight.aiGenerated && (
                            <p className="mt-1 text-xs text-cyan-200">
                              AI-genererat
                            </p>
                          )}
                        </div>
                      </div>

                      <p className="mb-3 text-sm leading-6 text-slate-300">
                        {insight.nextStep}
                      </p>

                      <div className="mb-3 flex flex-wrap gap-2">
                        <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">
                          Effekt: {insight.impact}
                        </Badge>
                        <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">
                          Svårighet: {insight.difficulty}
                        </Badge>
                      </div>

                      <Button
                        size="sm"
                        variant="secondary"
                        className="rounded-full"
                        onClick={() =>
                          voteForInsight(activeGroup.id, insight.id)
                        }
                      >
                        <ThumbsUp className="mr-2 h-4 w-4" />
                        Rösta · {insight.votes}
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm leading-6 text-slate-400">
                    Inga insiktskort skapade ännu.
                  </p>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    </main>
  )
}