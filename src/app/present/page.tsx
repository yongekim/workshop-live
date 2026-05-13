"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowLeft, ExternalLink, QrCode, Users } from "lucide-react"
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
import { Progress } from "@/components/ui/progress"

export default function PresentPage() {
  const { state, groups, realtimeStatus, error } = useSupabaseWorkshopState()
  const [origin, setOrigin] = useState("")

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  if (!state) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-slate-300">Laddar storbildsvy...</p>
      </main>
    )
  }

  const joinUrl = origin ? `${origin}/join` : "/join"

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap justify-between gap-3 print:hidden">
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

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="secondary" className="rounded-full">
              <Link href="/admin">Admin</Link>
            </Button>
            <Button asChild variant="secondary" className="rounded-full">
              <Link href="/moderator">Moderator</Link>
            </Button>
          </div>
        </div>

        <div className="grid min-h-[calc(100vh-120px)] gap-8 lg:grid-cols-[460px_1fr] lg:items-center">
          <Card className="border-white/10 bg-white/[0.06] text-white shadow-2xl">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10">
                <QrCode className="h-6 w-6 text-cyan-200" />
              </div>
              <CardDescription className="text-slate-400">
                Scanna för att delta
              </CardDescription>
              <CardTitle className="text-3xl">
                {state.event.name}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="rounded-[2rem] bg-white p-6">
                <QRCodeSVG value={joinUrl} className="h-full w-full" />
              </div>

              <p className="mt-5 break-all text-sm leading-6 text-slate-300">
                {joinUrl}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <Badge className="rounded-full bg-white/10 px-4 py-2 text-slate-200 hover:bg-white/10">
                  Realtime:{" "}
                  {realtimeStatus === "connected"
                    ? "ansluten"
                    : realtimeStatus === "connecting"
                      ? "ansluter"
                      : "frånkopplad"}
                </Badge>

                <Badge className="rounded-full bg-cyan-400/10 px-4 py-2 text-cyan-200 hover:bg-cyan-400/10">
                  {groups.length} grupper
                </Badge>
              </div>

              {error && (
                <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
                  {error}
                </p>
              )}
            </CardContent>
          </Card>

          <div>
            <Badge className="mb-5 rounded-full bg-cyan-400/10 px-4 py-2 text-cyan-200 hover:bg-cyan-400/10">
              {state.event.subtitle}
            </Badge>

            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight md:text-7xl">
              Välj grupp och bidra till workshopen live.
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-300">
              Scanna QR-koden, skriv din gruppkod och börja arbeta med
              frågeställningen. Moderatorn ser arbetet live.
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
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
                        {group.participants}
                      </div>
                    </div>

                    <CardTitle className="text-xl">
                      {group.topicTitle}
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      {group.name} · {group.status}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <Progress value={group.progress} className="mb-4" />
                    <Button
                      asChild
                      variant="secondary"
                      className="w-full rounded-full print:hidden"
                    >
                      <Link href={`/group/${group.id}`}>
                        Öppna grupp
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}