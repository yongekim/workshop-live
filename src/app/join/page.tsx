"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, QrCode, Search, Users } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

import { useSupabaseWorkshopState } from "@/hooks/use-supabase-workshop-state"
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
import { Progress } from "@/components/ui/progress"

export default function JoinPage() {
  const router = useRouter()
  const { state, groups, error, isLoading, syncNow } =
    useSupabaseWorkshopState()

  const [origin, setOrigin] = useState("")
  const [groupCode, setGroupCode] = useState("")
  const [codeError, setCodeError] = useState("")

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const joinUrl = origin ? `${origin}/join` : "/join"

  const matchingGroup = useMemo(() => {
    const normalized = groupCode.trim().toUpperCase()

    if (!normalized) return null

    return (
      groups.find(
        (group) =>
          group.accessCode.toUpperCase() === normalized ||
          group.id.toUpperCase() === normalized
      ) ?? null
    )
  }, [groupCode, groups])

  function enterGroupByCode() {
    setCodeError("")

    if (!groupCode.trim()) {
      setCodeError("Skriv din gruppkod, till exempel G1.")
      return
    }

    if (!matchingGroup) {
      setCodeError("Hittade ingen grupp med den koden.")
      return
    }

    router.push(`/group/${matchingGroup.id}`)
  }

  if (!state) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="max-w-xl rounded-3xl border border-white/10 bg-white/[0.06] p-6 text-center">
          <p className="text-lg font-semibold">
            {isLoading ? "Laddar workshop..." : "Kunde inte ladda workshop"}
          </p>

          {error && (
            <p className="mt-4 rounded-2xl bg-red-500/10 p-4 text-sm leading-6 text-red-200">
              {error}
            </p>
          )}

          <button
            className="mt-5 rounded-full bg-white px-5 py-2 text-sm font-medium text-slate-950"
            onClick={() => syncNow(true)}
          >
            Försök igen
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-6xl">
        <div className="mb-10 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
          <div>
            <Badge className="mb-4 rounded-full bg-cyan-400/10 px-4 py-2 text-cyan-200 hover:bg-cyan-400/10">
              Deltagarvy
            </Badge>

            <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
              Välj din workshopgrupp
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Välkommen till {state.event.name}. Ange din gruppkod eller välj
              gruppen du tillhör.
            </p>

            <Card className="mt-8 max-w-2xl border-white/10 bg-white/[0.06] text-white">
              <CardHeader>
                <CardTitle>Gå direkt till grupp</CardTitle>
                <CardDescription className="text-slate-400">
                  Skriv gruppkod, exempelvis G1, G2, G3 eller G4.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    value={groupCode}
                    onChange={(event) => setGroupCode(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") enterGroupByCode()
                    }}
                    placeholder="Skriv gruppkod..."
                    className="border-white/10 bg-slate-950/70 text-white"
                  />

                  <Button className="rounded-full" onClick={enterGroupByCode}>
                    <Search className="mr-2 h-4 w-4" />
                    Gå vidare
                  </Button>
                </div>

                {matchingGroup && (
                  <p className="mt-3 text-sm text-cyan-200">
                    Hittade {matchingGroup.name}: {matchingGroup.topicTitle}
                  </p>
                )}

                {codeError && (
                  <p className="mt-3 text-sm text-red-200">{codeError}</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-white/10 bg-white/[0.06] text-white">
            <CardHeader>
              <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                <QrCode className="h-5 w-5" />
              </div>
              <CardTitle>QR-kod till deltagarvy</CardTitle>
              <CardDescription className="text-slate-400">
                Visa denna på skärm eller i presentationen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-3xl bg-white p-4">
                <QRCodeSVG value={joinUrl} className="h-full w-full" />
              </div>
              <p className="mt-4 break-all text-xs leading-5 text-slate-400">
                {joinUrl}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {groups.map((group) => (
            <Card
              key={group.id}
              className="border-white/10 bg-white/[0.06] text-white"
            >
              <CardHeader>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <Badge className="rounded-full bg-white/10 text-slate-200 hover:bg-white/10">
                    Kod {group.accessCode}
                  </Badge>

                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Users className="h-4 w-4" />
                    {group.participants} deltagare
                  </div>
                </div>

                <CardDescription className="text-slate-400">
                  {group.name} · {group.status}
                </CardDescription>

                <CardTitle className="text-2xl">{group.topicTitle}</CardTitle>
              </CardHeader>

              <CardContent>
                <p className="mb-5 text-sm leading-6 text-slate-300">
                  {group.topicDescription}
                </p>

                <div className="mb-6">
                  <div className="mb-2 flex justify-between text-xs text-slate-400">
                    <span>Progress</span>
                    <span>{group.progress}%</span>
                  </div>
                  <Progress value={group.progress} />
                </div>

                <Button asChild className="w-full rounded-full">
                  <Link href={`/group/${group.id}`}>
                    Gå till gruppen
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  )
}