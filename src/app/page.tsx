import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  FileText,
  QrCode,
  Sparkles,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const features = [
  {
    title: "Deltagarvy via QR-kod",
    description:
      "Grupperna ansluter snabbt, väljer sitt workshopspår och börjar arbeta direkt.",
    icon: QrCode,
  },
  {
    title: "AI-stött grupparbete",
    description:
      "Diskreta AI-knappar hjälper grupperna att fördjupa, konkretisera och se frågan ur Travel Manager-perspektiv.",
    icon: BrainCircuit,
  },
  {
    title: "Moderator-cockpit",
    description:
      "Moderatorn ser gruppers framsteg, återkommande teman och förslag på följdfrågor live.",
    icon: BarChart3,
  },
  {
    title: "Rapport och uppföljning",
    description:
      "Workshopens insikter omvandlas till sammanfattning, prioriterade actions och rapportunderlag.",
    icon: FileText,
  },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-lg">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">
                Workshop Live
              </p>
              <p className="text-xs text-slate-500">
                AI-stödd workshopplattform
              </p>
            </div>
          </div>

          <Badge className="rounded-full bg-white/10 px-4 py-2 text-slate-200 hover:bg-white/10">
            MVP Preview
          </Badge>
        </header>

        <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <Badge className="mb-6 rounded-full bg-cyan-400/10 px-4 py-2 text-cyan-200 hover:bg-cyan-400/10">
              Business Travel Insight Lab
            </Badge>

            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-7xl">
              Gör workshops smartare, tydligare och mer användbara efteråt.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              En modern workshopmotor där grupper arbetar strukturerat,
              AI hjälper till att fördjupa insikter och moderatorn får en
              livebild av teman, idéer och nästa steg.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-full">
                <Link href="/join">
                  Starta deltagarvy
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/moderator">
                  Öppna moderatorvy
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/present">Storbildsvy</Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/admin">Admin</Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/events">Events</Link>
              </Button>
              
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/event-check">Event check</Link>
              </Button>
            </div>
          </div>



          <Card className="border-white/10 bg-white/10 text-white shadow-2xl backdrop-blur">
            <CardHeader>
              <CardDescription className="text-slate-300">
                Första eventet
              </CardDescription>
              <CardTitle className="text-2xl">
                Affärsresans ekosystem
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
                <div className="mb-3 flex items-center gap-2 text-sm text-slate-300">
                  <Users className="h-4 w-4" />
                  Workshopformat
                </div>
                <p className="text-sm leading-6 text-slate-300">
                  3–5 grupper djupdyker i frågor kring resebyråer,
                  leverantörer, Travel Managers, avtalspriser, bokningsflöden,
                  betalning, policy och uppföljning.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-3xl font-semibold">20+</p>
                  <p className="mt-1 text-sm text-slate-300">Deltagare</p>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-3xl font-semibold">5</p>
                  <p className="mt-1 text-sm text-slate-300">Workshopspår</p>
                </div>
              </div>

              <Button asChild className="w-full rounded-full">
                <Link href="/report/demo">
                  Visa rapportvy
                  <FileText className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <section className="grid gap-4 pb-10 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon

            return (
              <Card
                key={feature.title}
                className="border-white/10 bg-white/[0.06] text-white"
              >
                <CardHeader>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                  <CardDescription className="leading-6 text-slate-300">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </section>
      </section>
    </main>
  )
}