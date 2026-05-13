"use client"

import Link from "next/link"
import { useState } from "react"
import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  Loader2,
  MessageSquareText,
  Radar,
  RefreshCcw,
  Sparkles,
  Users,
} from "lucide-react"

import { useSupabaseWorkshopState } from "@/hooks/use-supabase-workshop-state"
import type { ModeratorAnalysis } from "@/types/workshop"
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

function formatTime(value?: string) {
  if (!value) return "Ingen sparning ännu"

  return new Intl.DateTimeFormat("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value))
}

export default function ModeratorPage() {
  const {
    state,
    groups,
    allInsights,
    resetWorkshop,
    realtimeStatus,
    error,
  } = useSupabaseWorkshopState()

  const [analysis, setAnalysis] = useState<ModeratorAnalysis | null>(null)
  const [aiError, setAiError] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  if (!state) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-slate-300">Laddar moderatorvy...</p>
      </main>
    )
  }

  const totalParticipants = groups.reduce(
    (total, group) => total + group.participants,
    0
  )

  const readyGroups = groups.filter(
    (group) => group.status === "Redo för sammanfattning"
  ).length

  const totalResponses = groups.reduce((total, group) => {
    return (
      total +
      Object.values(group.responses).filter((value) => value.trim().length > 0)
        .length
    )
  }, 0)

  async function runModeratorAnalysis() {
    try {
      setIsAnalyzing(true)
      setAiError("")

      const response = await fetch("/api/ai/moderator-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ groups }),
      })

      const data = (await response.json()) as {
        analysis?: ModeratorAnalysis
        error?: string
      }

      if (!response.ok || !data.analysis) {
        throw new Error(data.error || "Kunde inte skapa moderatoranalys.")
      }

      setAnalysis(data.analysis)
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Kunde inte skapa moderatoranalys."

      setAiError(message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-7xl">
        <div className="mb-6 flex justify-between gap-4">
          <Button
            asChild
            variant="ghost"
            className="text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Till startsidan
            </Link>
          </Button>

          <Button
            variant="secondary"
            className="rounded-full"
            onClick={resetWorkshop}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Nollställ demo-data
          </Button>
        </div>

        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge className="rounded-full bg-cyan-400/10 px-4 py-2 text-cyan-200 hover:bg-cyan-400/10">
                Moderator-cockpit
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
              Liveöversikt över workshopen
            </h1>

            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              Här ser moderatorn gruppstatus, insiktskort, återkommande teman
              och AI-genererade diskussionspunkter.
            </p>

            {(error || aiError) && (
              <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm leading-6 text-red-200">
                {error || aiError}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              className="rounded-full"
              onClick={runModeratorAnalysis}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Analysera workshop live
            </Button>

            <Button asChild className="rounded-full" variant="secondary">
              <Link href="/report/demo">Visa rapportvy</Link>
            </Button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card className="border-white/10 bg-white/[0.06] text-white">
            <CardContent className="p-5">
              <Users className="mb-3 h-5 w-5 text-slate-300" />
              <p className="text-3xl font-semibold">{totalParticipants}</p>
              <p className="text-sm text-slate-400">Deltagare</p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.06] text-white">
            <CardContent className="p-5">
              <BrainCircuit className="mb-3 h-5 w-5 text-slate-300" />
              <p className="text-3xl font-semibold">{groups.length}</p>
              <p className="text-sm text-slate-400">Grupper</p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.06] text-white">
            <CardContent className="p-5">
              <CheckCircle2 className="mb-3 h-5 w-5 text-slate-300" />
              <p className="text-3xl font-semibold">{readyGroups}</p>
              <p className="text-sm text-slate-400">Redo grupper</p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.06] text-white">
            <CardContent className="p-5">
              <MessageSquareText className="mb-3 h-5 w-5 text-slate-300" />
              <p className="text-3xl font-semibold">{totalResponses}</p>
              <p className="text-sm text-slate-400">Ifyllda svar</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_410px]">
          <div className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              {groups.map((group) => (
                <Card
                  key={group.id}
                  className="border-white/10 bg-white/[0.06] text-white"
                >
                  <CardHeader>
                    <div className="mb-3 flex items-center justify-between">
                      <Badge className="rounded-full bg-white/10 text-slate-200 hover:bg-white/10">
                        {group.name}
                      </Badge>
                      <Badge className="rounded-full bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/10">
                        {group.status}
                      </Badge>
                    </div>

                    <CardTitle>{group.topicTitle}</CardTitle>
                    <CardDescription className="text-slate-400">
                      {group.participants} deltagare · sparad{" "}
                      {formatTime(group.lastSavedAt)}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <Progress value={group.progress} className="mb-4" />

                    <div className="mb-5 space-y-3">
                      {Object.entries(group.responses).map(([key, value]) => (
                        <div
                          key={key}
                          className="rounded-2xl border border-white/10 bg-slate-950/50 p-3"
                        >
                          <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">
                            {key}
                          </p>
                          <p className="line-clamp-3 text-sm leading-6 text-slate-300">
                            {value || "Inget svar ännu"}
                          </p>
                        </div>
                      ))}
                    </div>

                    <Button
                      asChild
                      variant="secondary"
                      className="w-full rounded-full"
                    >
                      <Link href={`/group/${group.id}`}>Öppna grupp</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <aside className="space-y-5">
            <Card className="border-cyan-400/20 bg-cyan-400/10 text-white">
              <CardHeader>
                <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/20">
                  <BrainCircuit className="h-5 w-5 text-cyan-100" />
                </div>
                <CardTitle>AI-observationer</CardTitle>
                <CardDescription className="text-cyan-100/80">
                  Liveanalys för moderatorn.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {(analysis?.themes ?? state.commonThemes).map((theme) => (
                  <div
                    key={theme}
                    className="flex gap-3 rounded-2xl bg-slate-950/40 p-3"
                  >
                    <Radar className="mt-0.5 h-4 w-4 text-cyan-100" />
                    <p className="text-sm leading-6 text-cyan-50">{theme}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {analysis && (
              <Card className="border-white/10 bg-white/[0.06] text-white">
                <CardHeader>
                  <CardTitle>AI-analys</CardTitle>
                  <CardDescription className="text-slate-400">
                    Spänningar och quick wins från grupparbetet.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <p className="mb-2 text-sm font-semibold text-slate-200">
                      Möjliga spänningar
                    </p>
                    <div className="space-y-2">
                      {analysis.tensions.map((item) => (
                        <p
                          key={item}
                          className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-sm leading-6 text-slate-300"
                        >
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-semibold text-slate-200">
                      Quick wins
                    </p>
                    <div className="space-y-2">
                      {analysis.quickWins.map((item) => (
                        <p
                          key={item}
                          className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-sm leading-6 text-slate-300"
                        >
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-white/10 bg-white/[0.06] text-white">
              <CardHeader>
                <CardTitle>Prioriterade insiktskort</CardTitle>
                <CardDescription className="text-slate-400">
                  Sorterade efter röster.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {allInsights
                  .slice()
                  .sort((a, b) => b.votes - a.votes)
                  .slice(0, 5)
                  .map((insight) => (
                    <div
                      key={insight.id}
                      className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">
                          {insight.groupName}
                        </Badge>
                        <span className="text-sm text-slate-400">
                          {insight.votes} röster
                        </span>
                      </div>
                      <p className="font-medium">{insight.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {insight.nextStep}
                      </p>
                    </div>
                  ))}

                {allInsights.length === 0 && (
                  <p className="text-sm leading-6 text-slate-400">
                    Inga insiktskort ännu.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.06] text-white">
              <CardHeader>
                <CardTitle>Följdfrågor till moderatorn</CardTitle>
                <CardDescription className="text-slate-400">
                  Frågor som kan användas för att fördjupa diskussionen i
                  rummet.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {(analysis?.moderatorQuestions ?? state.moderatorQuestions).map(
                  (question) => (
                    <div
                      key={question}
                      className="flex gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4"
                    >
                      <MessageSquareText className="mt-0.5 h-4 w-4 text-slate-300" />
                      <p className="text-sm leading-6 text-slate-300">
                        {question}
                      </p>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    </main>
  )
}