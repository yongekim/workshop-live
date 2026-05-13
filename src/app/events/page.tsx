"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  ExternalLink,
  Plus,
  RefreshCcw,
  Sparkles,
} from "lucide-react"

import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { workshopTemplates } from "@/lib/templates/workshop-templates"
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

type EventListItem = {
  id: string
  slug: string
  name: string
  subtitle: string | null
  status: string
  created_at: string
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/å/g, "a")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export default function EventsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  const [events, setEvents] = useState<EventListItem[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    workshopTemplates[0]?.id ?? ""
  )
  const [eventName, setEventName] = useState("")
  const [statusMessage, setStatusMessage] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function loadEvents() {
    try {
      setIsLoading(true)
      setError("")
      setStatusMessage("")

      const { data, error } = await supabase
        .from("events")
        .select("id,slug,name,subtitle,status,created_at")
        .order("created_at", { ascending: false })

      if (error) throw error

      setEvents((data ?? []) as EventListItem[])
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Kunde inte hämta events."

      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  async function createEventFromTemplate() {
    try {
      setIsLoading(true)
      setError("")
      setStatusMessage("")

      const template = workshopTemplates.find(
        (item) => item.id === selectedTemplateId
      )

      if (!template) {
        setError("Välj en mall.")
        return
      }

      const name = eventName.trim() || template.name
      const slugBase = slugify(name) || "workshop"
      const slug = `${slugBase}-${Date.now().toString().slice(-5)}`

      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .insert({
          slug,
          name,
          subtitle: template.subtitle,
          description: template.eventDescription,
          status: "draft",
          moderator_questions: template.moderatorQuestions,
          common_themes: template.commonThemes,
        })
        .select("id")
        .single()

      if (eventError) throw eventError

      const eventId = eventData.id as string

      const questionRows = template.questions.map((question, index) => ({
        event_id: eventId,
        response_key: question.key,
        title: question.title,
        description: question.description,
        placeholder: question.placeholder,
        sort_order: question.sortOrder ?? index + 1,
        is_required: question.isRequired ?? true,
        helper_text: question.helperText ?? "",
      }))

      const { error: questionsError } = await supabase
        .from("questions")
        .insert(questionRows)

      if (questionsError) throw questionsError

      const groupRows = template.groups.map((group) => ({
        event_id: eventId,
        slug: group.slug,
        name: group.name,
        access_code: group.accessCode,
        topic_title: group.topicTitle,
        topic_description: group.topicDescription,
        status: "Inte startad",
        participants: 0,
        progress: 0,
      }))

      const { error: groupsError } = await supabase
        .from("workshop_groups")
        .insert(groupRows)

      if (groupsError) throw groupsError

      setEventName("")
      setStatusMessage(`Event skapat: ${name}`)
      await loadEvents()
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Kunde inte skapa event."

      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  async function updateEventStatus(slug: string, status: string) {
    try {
      setError("")
      setStatusMessage("")

      const { error } = await supabase
        .from("events")
        .update({ status })
        .eq("slug", slug)

      if (error) throw error

      setStatusMessage("Eventstatus uppdaterad.")
      await loadEvents()
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Kunde inte uppdatera eventstatus."

      setError(message)
    }
  }

  useEffect(() => {
    void loadEvents()
  }, [])

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-7xl">
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
            onClick={loadEvents}
            disabled={isLoading}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Uppdatera
          </Button>
        </div>

        <div className="mb-10">
          <Badge className="mb-4 rounded-full bg-cyan-400/10 px-4 py-2 text-cyan-200 hover:bg-cyan-400/10">
            Event Hub
          </Badge>

          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
            Skapa och hantera workshops
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Skapa nya events från mallar, öppna rätt länkar och arkivera gamla
            workshops.
          </p>

          {(error || statusMessage) && (
            <div
              className={`mt-6 rounded-2xl border p-4 text-sm leading-6 ${
                error
                  ? "border-red-400/20 bg-red-500/10 text-red-200"
                  : "border-cyan-400/20 bg-cyan-400/10 text-cyan-100"
              }`}
            >
              {error || statusMessage}
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <aside className="space-y-6">
            <Card className="border-white/10 bg-white/[0.06] text-white">
              <CardHeader>
                <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10">
                  <Sparkles className="h-5 w-5 text-cyan-200" />
                </div>
                <CardTitle>Skapa nytt event</CardTitle>
                <CardDescription className="text-slate-400">
                  Välj en mall och skapa en ny workshop.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <p className="mb-2 text-sm text-slate-300">Eventnamn</p>
                  <Input
                    value={eventName}
                    onChange={(event) => setEventName(event.target.value)}
                    placeholder="Ex. Travel Manager Lab 2026"
                    className="border-white/10 bg-slate-950/70 text-white"
                  />
                </div>

                <div>
                  <p className="mb-2 text-sm text-slate-300">Mall</p>
                  <select
                    value={selectedTemplateId}
                    onChange={(event) =>
                      setSelectedTemplateId(event.target.value)
                    }
                    className="w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white"
                  >
                    {workshopTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm leading-6 text-slate-300">
                  {
                    workshopTemplates.find(
                      (template) => template.id === selectedTemplateId
                    )?.description
                  }
                </div>

                <Button
                  className="w-full rounded-full"
                  onClick={createEventFromTemplate}
                  disabled={isLoading}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Skapa event
                </Button>
              </CardContent>
            </Card>
          </aside>

          <div className="grid gap-5">
            {events.map((event) => (
              <Card
                key={event.id}
                className="border-white/10 bg-white/[0.06] text-white"
              >
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <CardDescription className="text-slate-400">
                        {event.slug}
                      </CardDescription>
                      <CardTitle className="text-2xl">{event.name}</CardTitle>
                      <CardDescription className="mt-2 text-slate-400">
                        {event.subtitle}
                      </CardDescription>
                    </div>

                    <Badge className="rounded-full bg-cyan-400/10 px-4 py-2 text-cyan-200 hover:bg-cyan-400/10">
                      {event.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <Button asChild variant="secondary" className="rounded-full">
                      <Link href={`/designer?event=${event.slug}`}>
                        Designer
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>

                    <Button asChild variant="secondary" className="rounded-full">
                      <Link href={`/admin?event=${event.slug}`}>
                        Admin
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>

                    <Button asChild variant="secondary" className="rounded-full">
                      <Link href={`/present?event=${event.slug}`}>
                        Present
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>

                    <Button asChild variant="secondary" className="rounded-full">
                      <Link href={`/join?event=${event.slug}`}>
                        Join
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>

                    <Button asChild variant="secondary" className="rounded-full">
                      <Link href={`/moderator?event=${event.slug}`}>
                        Moderator
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>

                    <Button asChild variant="secondary" className="rounded-full">
                      <Link href={`/report/demo?event=${event.slug}`}>
                        Rapport
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {["draft", "active", "completed", "archived"].map(
                      (status) => (
                        <Button
                          key={status}
                          size="sm"
                          variant={
                            event.status === status ? "default" : "secondary"
                          }
                          className="rounded-full"
                          onClick={() => updateEventStatus(event.slug, status)}
                        >
                          {status}
                        </Button>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {events.length === 0 && (
              <Card className="border-white/10 bg-white/[0.06] text-white">
                <CardContent className="p-6 text-slate-400">
                  Inga events finns ännu.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}