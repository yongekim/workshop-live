"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ArrowLeft,
  Archive,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Loader2,
  RefreshCcw,
  Sparkles,
} from "lucide-react"

import { useSupabaseWorkshopState } from "@/hooks/use-supabase-workshop-state"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  buildActionsCsv,
  buildReportActions,
  buildReportMarkdown,
  downloadTextFile,
  getTotalResponses,
  getTotalVotes,
} from "@/lib/report/report-builder"
import type { ReportAiSummary, ReportSnapshot } from "@/types/workshop"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const DEMO_EVENT_SLUG = "affarsresans-ekosystem"

type ReportSnapshotRow = {
  id: string
  title: string
  report_markdown: string
  created_at: string
}

export default function DemoReportPage() {
  const { eventSlug, state, groups, allInsights, resetWorkshop, error } =
  useSupabaseWorkshopState()

  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  const [summary, setSummary] = useState<ReportAiSummary | null>(null)
  const [aiError, setAiError] = useState("")
  const [statusMessage, setStatusMessage] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false)
  const [snapshots, setSnapshots] = useState<ReportSnapshot[]>([])
  const [isLoadingSnapshots, setIsLoadingSnapshots] = useState(false)

  const sortedInsights = allInsights
    .slice()
    .sort((a, b) => b.votes - a.votes)

  const actions = buildReportActions(groups)
  const totalResponses = getTotalResponses(groups)
  const totalVotes = getTotalVotes(groups)

  if (!state) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-950">
          <p>Laddar rapport...</p>
        </main>
      )
    }

    const activeState = state

    const reportMarkdown = buildReportMarkdown({
      state: activeState,
      groups,
      summary,
    })

  async function generateReportSummary() {
    try {
      setIsGenerating(true)
      setAiError("")
      setStatusMessage("")

      const response = await fetch("/api/ai/report-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ groups }),
      })

      const data = (await response.json()) as {
        summary?: ReportAiSummary
        error?: string
      }

      if (!response.ok || !data.summary) {
        throw new Error(data.error || "Kunde inte generera rapportanalys.")
      }

      setSummary(data.summary)
      setStatusMessage("AI-sammanfattning genererad.")
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Kunde inte generera rapportanalys."

      setAiError(message)
    } finally {
      setIsGenerating(false)
    }
  }

  async function saveReportSnapshot() {
    try {
      setIsSavingSnapshot(true)
      setAiError("")
      setStatusMessage("")

      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("id")
        .eq("slug", eventSlug)
        .single()

      if (eventError) throw eventError

      const title = `Rapportversion - ${new Intl.DateTimeFormat("sv-SE", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date())}`

      const { error: snapshotError } = await supabase
        .from("report_snapshots")
        .insert({
          event_id: eventData.id,
          title,
          report_json: {
            event: activeState.event,
            summary,
            groups,
            actions,
          },
          report_markdown: reportMarkdown,
        })

      if (snapshotError) throw snapshotError

      setStatusMessage("Rapportversion sparad.")
      await loadReportSnapshots()
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Kunde inte spara rapportversion."

      setAiError(message)
    } finally {
      setIsSavingSnapshot(false)
    }
  }

  async function loadReportSnapshots() {
    try {
      setIsLoadingSnapshots(true)
      setAiError("")
      setStatusMessage("")

      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("id")
        .eq("slug", eventSlug)
        .single()

      if (eventError) throw eventError

      const { data, error: snapshotError } = await supabase
        .from("report_snapshots")
        .select("id,title,report_markdown,created_at")
        .eq("event_id", eventData.id)
        .order("created_at", { ascending: false })

      if (snapshotError) throw snapshotError

      const mapped = ((data ?? []) as ReportSnapshotRow[]).map((snapshot) => ({
        id: snapshot.id,
        title: snapshot.title,
        reportMarkdown: snapshot.report_markdown,
        createdAt: snapshot.created_at,
      }))

      setSnapshots(mapped)
      setStatusMessage("Rapportarkiv uppdaterat.")
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Kunde inte hämta rapportarkiv."

      setAiError(message)
    } finally {
      setIsLoadingSnapshots(false)
    }
  }

  function exportMarkdown() {
    downloadTextFile({
      filename: "workshoprapport.md",
      content: reportMarkdown,
      mimeType: "text/markdown;charset=utf-8",
    })
  }

  function exportActionsCsv() {
    downloadTextFile({
      filename: "workshop-actions.csv",
      content: buildActionsCsv(actions),
      mimeType: "text/csv;charset=utf-8",
    })
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8 text-slate-950 print:bg-white print:px-0 print:py-0">
      <section className="mx-auto max-w-6xl print:max-w-none">
        <div className="mb-6 flex flex-wrap justify-between gap-3 print:hidden">
          <Button asChild variant="ghost">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Till startsidan
            </Link>
          </Button>

          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={resetWorkshop}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Nollställ demo
            </Button>

            <Button
              variant="secondary"
              onClick={generateReportSummary}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Generera AI-sammanfattning
            </Button>

            <Button
              variant="secondary"
              onClick={saveReportSnapshot}
              disabled={isSavingSnapshot}
            >
              {isSavingSnapshot ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Archive className="mr-2 h-4 w-4" />
              )}
              Spara rapportversion
            </Button>

            <Button variant="secondary" onClick={exportMarkdown}>
              <Download className="mr-2 h-4 w-4" />
              Exportera Markdown
            </Button>

            <Button variant="secondary" onClick={exportActionsCsv}>
              <ClipboardList className="mr-2 h-4 w-4" />
              Exportera actions CSV
            </Button>

            <Button onClick={() => window.print()}>
              <Download className="mr-2 h-4 w-4" />
              Skriv ut / spara som PDF
            </Button>
          </div>
        </div>

        {(error || aiError || statusMessage) && (
          <div
            className={`mb-6 rounded-2xl border p-4 text-sm leading-6 print:hidden ${
              error || aiError
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-cyan-200 bg-cyan-50 text-cyan-800"
            }`}
          >
            {error || aiError || statusMessage}
          </div>
        )}

        <div className="mb-8 rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl md:p-12 print:rounded-none print:shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <Badge className="mb-5 rounded-full bg-cyan-400/10 px-4 py-2 text-cyan-200 hover:bg-cyan-400/10">
                Rapportutkast
              </Badge>

              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
                Workshoprapport: {activeState.event.name}
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
                {activeState.event.description}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 text-sm text-slate-300">
              <p className="font-medium text-white">Rapportstatus</p>
              <p className="mt-2">
                AI-sammanfattning: {summary ? "Genererad" : "Ej genererad"}
              </p>
              <p>Insiktskort: {actions.length}</p>
              <p>Röster: {totalVotes}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-white/10 p-5">
              <p className="text-3xl font-semibold">{groups.length}</p>
              <p className="mt-1 text-sm text-slate-300">Workshopgrupper</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-5">
              <p className="text-3xl font-semibold">{totalResponses}</p>
              <p className="mt-1 text-sm text-slate-300">Ifyllda svar</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-5">
              <p className="text-3xl font-semibold">{allInsights.length}</p>
              <p className="mt-1 text-sm text-slate-300">Insiktskort</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-5">
              <p className="text-3xl font-semibold">{totalVotes}</p>
              <p className="mt-1 text-sm text-slate-300">Röster</p>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_340px] print:block">
          <div className="space-y-6">
            <Card className="print:break-inside-avoid print:shadow-none">
              <CardHeader>
                <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                  <FileText className="h-5 w-5" />
                </div>
                <CardTitle>Executive summary</CardTitle>
                <CardDescription>
                  Sammanfattning för vidare delning och uppföljning.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 leading-7 text-slate-700">
                {summary ? (
                  summary.executiveSummary.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))
                ) : (
                  <>
                    <p>
                      Workshopen visar att flera aktörer i
                      affärsreseekosystemet delar liknande utmaningar kring
                      ansvarsfördelning, laddning av avtalade priser,
                      kontrollmöjligheter och uppföljning.
                    </p>
                    <p>
                      Klicka på “Generera AI-sammanfattning” för att skapa ett
                      mer träffsäkert rapportunderlag från faktisk workshopdata.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {summary && (
              <Card className="print:break-inside-avoid print:shadow-none">
                <CardHeader>
                  <CardTitle>AI-genererade nyckelinsikter</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  {summary.keyFindings.map((finding) => (
                    <div
                      key={finding}
                      className="flex gap-3 rounded-2xl border bg-white p-4"
                    >
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-slate-500" />
                      <p className="text-sm leading-6 text-slate-700">
                        {finding}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card className="print:break-inside-avoid print:shadow-none">
              <CardHeader>
                <CardTitle>Gemensamma teman</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {activeState.commonThemes.map((theme) => (
                  <div
                    key={theme}
                    className="flex gap-3 rounded-2xl border bg-white p-4"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-slate-500" />
                    <p className="text-sm leading-6 text-slate-700">{theme}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="print:break-inside-avoid print:shadow-none">
              <CardHeader>
                <CardTitle>Prioriterad actionlista</CardTitle>
                <CardDescription>
                  Sorterad efter röster och förväntad effekt.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {actions.length > 0 ? (
                  actions.map((action) => (
                    <div
                      key={`${action.priority}-${action.title}`}
                      className="rounded-2xl border bg-white p-4"
                    >
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">
                          Prioritet {action.priority}
                        </Badge>
                        <Badge variant="secondary">{action.sourceGroup}</Badge>
                        <Badge variant="secondary">
                          Effekt: {action.impact}
                        </Badge>
                        <Badge variant="secondary">
                          Svårighet: {action.difficulty}
                        </Badge>
                        <Badge variant="secondary">
                          Röster: {action.votes}
                        </Badge>
                      </div>

                      <h3 className="text-lg font-semibold">{action.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        <span className="font-semibold text-slate-800">
                          Ägare:
                        </span>{" "}
                        {action.suggestedOwner}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        <span className="font-semibold text-slate-800">
                          Nästa steg:
                        </span>{" "}
                        {action.nextStep}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm leading-6 text-slate-600">
                    Inga actions finns ännu. Skapa insiktskort i gruppvyerna.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="print:break-inside-avoid print:shadow-none">
              <CardHeader>
                <CardTitle>Föreslagen uppföljning</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                {(summary?.recommendedNextSteps ?? [
                  {
                    timeframe: "30 dagar",
                    action:
                      "Sammanställa processkarta och bekräfta prioriterade områden.",
                  },
                  {
                    timeframe: "60 dagar",
                    action:
                      "Testa en konkret förbättring med utvalda parter och eventuell pilotkund.",
                  },
                  {
                    timeframe: "90 dagar",
                    action:
                      "Utvärdera effekt och besluta om nästa gemensamma initiativ.",
                  },
                ]).map((step) => (
                  <div
                    key={step.timeframe}
                    className="rounded-2xl bg-slate-100 p-5"
                  >
                    <p className="font-semibold">{step.timeframe}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {step.action}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6 print:hidden">
            <Card>
              <CardHeader>
                <CardTitle>Rapportarkiv</CardTitle>
                <CardDescription>
                  Spara rapportversioner under arbetets gång.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="secondary"
                  className="w-full rounded-full"
                  onClick={loadReportSnapshots}
                  disabled={isLoadingSnapshots}
                >
                  {isLoadingSnapshots ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Archive className="mr-2 h-4 w-4" />
                  )}
                  Hämta rapportarkiv
                </Button>

                {snapshots.length > 0 ? (
                  snapshots.map((snapshot) => (
                    <div
                      key={snapshot.id}
                      className="rounded-2xl border bg-white p-4"
                    >
                      <p className="font-medium">{snapshot.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Intl.DateTimeFormat("sv-SE", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(snapshot.createdAt))}
                      </p>
                      <Button
                        className="mt-3 w-full rounded-full"
                        variant="secondary"
                        onClick={() =>
                          downloadTextFile({
                            filename: `${snapshot.title}.md`,
                            content: snapshot.reportMarkdown,
                            mimeType: "text/markdown;charset=utf-8",
                          })
                        }
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Ladda ner Markdown
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm leading-6 text-slate-600">
                    Inga sparade rapportversioner hämtade ännu.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Exporttips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-slate-600">
                <p>
                  Använd “Skriv ut / spara som PDF” för en snygg PDF från
                  browsern.
                </p>
                <p>
                  Markdown-exporten är bra för vidare redigering i dokument,
                  e-post eller intern sammanställning.
                </p>
                <p>
                  CSV-exporten är bäst för actionlistor och uppföljning i Excel
                  eller projektverktyg.
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>

        <div className="space-y-6">
          <Card className="print:break-before-page print:shadow-none">
            <CardHeader>
              <CardTitle>Gruppsammanfattningar</CardTitle>
              <CardDescription>
                Sammanställning av respektive grupps ämne, nuläge, friktion och
                förbättringsförslag.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {groups.map((group) => (
                <div key={group.id} className="rounded-2xl border bg-white p-5">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{group.name}</Badge>
                    <Badge variant="secondary">{group.status}</Badge>
                    <Badge variant="secondary">{group.progress}% klart</Badge>
                  </div>

                  <h3 className="text-xl font-semibold">{group.topicTitle}</h3>

                  <div className="mt-4 grid gap-3">
                    <div>
                      <p className="text-sm font-semibold">Nuläge</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {group.responses.currentState || "Ej ifyllt ännu."}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold">Friktion</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {group.responses.friction || "Ej ifyllt ännu."}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold">Förbättringar</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {group.responses.improvements || "Ej ifyllt ännu."}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="print:break-before-page print:shadow-none">
            <CardHeader>
              <CardTitle>Prioriterade förbättringsidéer</CardTitle>
              <CardDescription>
                Fullständig lista över insiktskort från grupparbetet.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sortedInsights.length > 0 ? (
                sortedInsights.map((insight) => (
                  <div
                    key={insight.id}
                    className="rounded-2xl border bg-white p-5 print:break-inside-avoid"
                  >
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{insight.groupName}</Badge>
                      <Badge variant="secondary">
                        Röster: {insight.votes}
                      </Badge>
                      <Badge variant="secondary">
                        Effekt: {insight.impact}
                      </Badge>
                      <Badge variant="secondary">
                        Svårighet: {insight.difficulty}
                      </Badge>
                      {insight.aiGenerated && (
                        <Badge variant="secondary">AI-genererat</Badge>
                      )}
                    </div>

                    <h3 className="text-xl font-semibold">{insight.title}</h3>

                    <div className="mt-4 grid gap-3 text-sm leading-6 text-slate-600">
                      <p>
                        <span className="font-semibold text-slate-800">
                          Problem:
                        </span>{" "}
                        {insight.problem}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-800">
                          Konsekvens:
                        </span>{" "}
                        {insight.consequence}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-800">
                          Rotorsak:
                        </span>{" "}
                        {insight.rootCause}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-800">
                          Förslag:
                        </span>{" "}
                        {insight.idea}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-800">
                          Möjlig ägare:
                        </span>{" "}
                        {insight.suggestedOwner}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-800">
                          Nästa steg:
                        </span>{" "}
                        {insight.nextStep}
                      </p>
                    </div>

                    <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">
                      Kopplat ämne: {insight.topicTitle}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-slate-600">
                  Inga insiktskort finns ännu.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}