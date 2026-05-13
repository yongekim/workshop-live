"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  RefreshCcw,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type HealthResponse = {
  ok: boolean
  databaseError: string | null
  checks: Record<string, boolean>
}

const LABELS: Record<string, string> = {
  supabaseUrlConfigured: "Supabase URL finns",
  supabaseAnonKeyConfigured: "Supabase anon key finns",
  openAiConfigured: "OpenAI API-nyckel finns",
  openAiModelConfigured: "OpenAI-modell finns",
  adminPasswordConfigured: "Adminlösenord finns",
  moderatorPasswordConfigured: "Moderatorlösenord finns",
  eventAccessCodeConfigured: "Eventkod finns",
  databaseReachable: "Databasen går att nå",
  demoEventFound: "Demo-eventet finns i databasen",
}

export default function EventCheckPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const checks = useMemo(() => {
    if (!health) return []

    return Object.entries(health.checks).map(([key, value]) => ({
      key,
      label: LABELS[key] ?? key,
      value,
    }))
  }, [health])

  async function loadHealth() {
    try {
      setIsLoading(true)
      setError("")

      const response = await fetch("/api/health")
      const data = (await response.json()) as HealthResponse

      if (!response.ok) {
        throw new Error("Kunde inte läsa health check.")
      }

      setHealth(data)
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Kunde inte läsa health check."

      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadHealth()
  }, [])

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap justify-between gap-3">
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
            onClick={loadHealth}
            disabled={isLoading}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Kör kontroll igen
          </Button>
        </div>

        <div className="mb-10">
          <Badge className="mb-4 rounded-full bg-cyan-400/10 px-4 py-2 text-cyan-200 hover:bg-cyan-400/10">
            Event check
          </Badge>

          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
            Pre-event checklista
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Kontrollera att miljövariabler, databas, AI och viktiga vyer är
            redo innan du kör workshopen live.
          </p>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm leading-6 text-red-200">
              {error}
            </div>
          )}

          {health?.databaseError && (
            <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm leading-6 text-red-200">
              {health.databaseError}
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="border-white/10 bg-white/[0.06] text-white">
            <CardHeader>
              <CardTitle>Teknisk status</CardTitle>
              <CardDescription className="text-slate-400">
                Dessa kontroller hämtas från servern.
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-3 md:grid-cols-2">
              {checks.map((check) => (
                <div
                  key={check.key}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4"
                >
                  {check.value ? (
                    <CheckCircle2 className="h-5 w-5 text-cyan-200" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-300" />
                  )}

                  <p className="text-sm leading-6 text-slate-300">
                    {check.label}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <aside className="space-y-5">
            <Card className="border-white/10 bg-white/[0.06] text-white">
              <CardHeader>
                <CardTitle>Vyer att testa</CardTitle>
                <CardDescription className="text-slate-400">
                  Öppna varje vy och kontrollera flödet.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {[
                  ["/admin", "Admin"],
                  ["/present", "Storbildsvy"],
                  ["/join", "Deltagarvy"],
                  ["/group/neg-rates", "Grupp 1"],
                  ["/moderator", "Moderator"],
                  ["/report/demo", "Rapport"],
                ].map(([href, label]) => (
                  <Button
                    key={href}
                    asChild
                    variant="secondary"
                    className="w-full justify-between rounded-full"
                  >
                    <Link href={href}>
                      {label}
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.06] text-white">
              <CardHeader>
                <CardTitle>Manuell eventcheck</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3 text-sm leading-6 text-slate-300">
                <p>□ Testa QR-koden från mobil.</p>
                <p>□ Testa eventkoden från inkognitofönster.</p>
                <p>□ Skriv i en grupp och se att moderatorn uppdateras.</p>
                <p>□ Skapa AI-insiktskort.</p>
                <p>□ Generera rapportens AI-sammanfattning.</p>
                <p>□ Spara rapportversion.</p>
                <p>□ Testa PDF via browserns utskrift.</p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    </main>
  )
}