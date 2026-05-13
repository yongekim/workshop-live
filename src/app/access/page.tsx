"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { LockKeyhole, Loader2, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type AccessMode = "admin" | "moderator" | "event"

function normalizeMode(value: string | null): AccessMode {
  if (value === "admin" || value === "moderator" || value === "event") {
    return value
  }

  return "event"
}

function getModeText(mode: AccessMode) {
  if (mode === "admin") {
    return {
      badge: "Admin access",
      title: "Logga in som admin",
      description:
        "Adminläget används för att förbereda event, ändra grupper och hantera rapporter.",
      placeholder: "Adminlösenord",
    }
  }

  if (mode === "moderator") {
    return {
      badge: "Moderator access",
      title: "Logga in som moderator",
      description:
        "Moderatorläget används för liveöversikt, storbildsvy och rapportarbete.",
      placeholder: "Moderatorlösenord",
    }
  }

  return {
    badge: "Event access",
    title: "Ange eventkod",
    description:
      "Skriv eventkoden du fått av arrangören för att komma in i deltagarvyn.",
    placeholder: "Eventkod",
  }
}

export default function AccessPage() {
  const router = useRouter()

  const [mode, setMode] = useState<AccessMode>("event")
  const [nextPath, setNextPath] = useState("/join")
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const next = params.get("next")

    setMode(normalizeMode(params.get("mode")))
    setNextPath(next && next.startsWith("/") ? next : "/join")
  }, [])

  const text = useMemo(() => getModeText(mode), [mode])

  async function submitAccess() {
    try {
      setIsLoading(true)
      setError("")

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode,
          code,
        }),
      })

      const data = (await response.json()) as {
        ok?: boolean
        error?: string
      }

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Kunde inte logga in.")
      }

      router.push(nextPath)
      router.refresh()
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Kunde inte logga in."

      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-8 text-white">
      <Card className="w-full max-w-xl border-white/10 bg-white/[0.06] text-white shadow-2xl">
        <CardHeader>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950">
            {mode === "event" ? (
              <Sparkles className="h-5 w-5" />
            ) : (
              <LockKeyhole className="h-5 w-5" />
            )}
          </div>

          <Badge className="mb-3 w-fit rounded-full bg-cyan-400/10 px-4 py-2 text-cyan-200 hover:bg-cyan-400/10">
            {text.badge}
          </Badge>

          <CardTitle className="text-3xl">{text.title}</CardTitle>
          <CardDescription className="text-slate-400">
            {text.description}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <Input
              type="password"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void submitAccess()
                }
              }}
              placeholder={text.placeholder}
              className="border-white/10 bg-slate-950/70 text-white"
            />

            {error && (
              <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm leading-6 text-red-200">
                {error}
              </div>
            )}

            <Button
              className="w-full rounded-full"
              onClick={submitAccess}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Fortsätt
            </Button>

            <p className="text-center text-xs leading-5 text-slate-500">
              Du skickas vidare till {nextPath} efter godkänd kod.
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}