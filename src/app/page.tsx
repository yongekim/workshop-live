import Link from "next/link"
import {
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  FileText,
  LayoutDashboard,
  Presentation,
  ShieldCheck,
  Sparkles,
  Users,
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

const primaryLinks = [
  {
    title: "Event Hub",
    description: "Skapa och hantera flera workshops från mallar.",
    href: "/events",
    icon: CalendarDays,
    cta: "Öppna events",
  },
  {
    title: "Admin",
    description: "Styr event, grupper, deltagare och skarp körning.",
    href: "/admin",
    icon: LayoutDashboard,
    cta: "Öppna admin",
  },
  {
    title: "Deltagarvy",
    description: "QR- och länkflöde för workshopdeltagare.",
    href: "/join",
    icon: Users,
    cta: "Öppna join",
  },
  {
    title: "Moderator",
    description: "Följ grupparbetet live och kör AI-analys.",
    href: "/moderator",
    icon: BrainCircuit,
    cta: "Öppna moderator",
  },
]

const secondaryLinks = [
  {
    label: "Storbildsvy",
    href: "/present",
    icon: Presentation,
  },
  {
    label: "Rapport",
    href: "/report/demo",
    icon: FileText,
  },
  {
    label: "Event check",
    href: "/event-check",
    icon: ShieldCheck,
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 shadow-2xl md:p-12">
          <div className="absolute right-[-120px] top-[-120px] h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute bottom-[-160px] left-[-140px] h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative">
            <Badge className="mb-6 rounded-full bg-cyan-400/10 px-4 py-2 text-cyan-200 hover:bg-cyan-400/10">
              Workshop Live
            </Badge>

            <h1 className="max-w-5xl text-5xl font-semibold tracking-tight md:text-7xl">
              AI-stödd workshopplattform för livegrupper, moderator och rapport.
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300 md:text-xl md:leading-9">
              Skapa events från mallar, låt deltagare arbeta i grupper, följ
              insikter live och generera professionella rapportunderlag.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full">
                <Link href="/events">
                  Starta i Event Hub
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/event-check">Kör event check</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {primaryLinks.map((item) => {
            const Icon = item.icon

            return (
              <Card
                key={item.href}
                className="border-white/10 bg-white/[0.06] text-white"
              >
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10">
                    <Icon className="h-5 w-5 text-cyan-200" />
                  </div>

                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription className="text-slate-400">
                    {item.description}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <Button asChild variant="secondary" className="w-full rounded-full">
                    <Link href={item.href}>
                      {item.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_380px]">
          <Card className="border-white/10 bg-white/[0.06] text-white">
            <CardHeader>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <Sparkles className="h-5 w-5 text-cyan-200" />
              </div>
              <CardTitle>Rekommenderat arbetsflöde</CardTitle>
              <CardDescription className="text-slate-400">
                Använd detta inför varje skarpt event.
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-3 md:grid-cols-2">
              {[
                "Skapa event från mall i Event Hub.",
                "Justera frågor och eventstatus i Event Designer.",
                "Öppna storbildsvyn och visa QR-koden.",
                "Låt deltagare registrera sig och välja grupp.",
                "Följ arbetet live i moderatorvyn.",
                "Generera rapport och ladda ner PDF/CSV.",
              ].map((step, index) => (
                <div
                  key={step}
                  className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
                >
                  <p className="text-xs uppercase tracking-wide text-cyan-200">
                    Steg {index + 1}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {step}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.06] text-white">
            <CardHeader>
              <CardTitle>Snabblänkar</CardTitle>
              <CardDescription className="text-slate-400">
                Direkt till vanliga vyer.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {secondaryLinks.map((item) => {
                const Icon = item.icon

                return (
                  <Button
                    key={item.href}
                    asChild
                    variant="secondary"
                    className="w-full justify-between rounded-full"
                  >
                    <Link href={item.href}>
                      <span className="flex items-center">
                        <Icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}