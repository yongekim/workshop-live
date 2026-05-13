"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ArrowLeft,
  CheckCircle2,
  Plus,
  RefreshCcw,
  Save,
  Trash2,
} from "lucide-react"

import { useSupabaseWorkshopState } from "@/hooks/use-supabase-workshop-state"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import type { EventStatus } from "@/types/workshop"
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
import { Textarea } from "@/components/ui/textarea"

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

export default function DesignerPage() {
  const { eventSlug, state, syncNow, error } = useSupabaseWorkshopState()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  const [statusMessage, setStatusMessage] = useState("")
  const [designerError, setDesignerError] = useState("")

  const [newQuestionTitle, setNewQuestionTitle] = useState("")
  const [newQuestionDescription, setNewQuestionDescription] = useState("")
  const [newQuestionPlaceholder, setNewQuestionPlaceholder] = useState("")

  if (!state) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-slate-300">Laddar Event Designer...</p>
      </main>
    )
  }

  const activeState = state

  async function updateEvent(input: {
    name: string
    subtitle: string
    description: string
    status: EventStatus
  }) {
    try {
      setDesignerError("")
      setStatusMessage("")

      const { error } = await supabase
        .from("events")
        .update({
          name: input.name,
          subtitle: input.subtitle,
          description: input.description,
          status: input.status,
        })
        .eq("slug", eventSlug)

      if (error) throw error

      await syncNow(false)
      setStatusMessage("Event uppdaterat.")
    } catch (caughtError) {
      setDesignerError(
        caughtError instanceof Error
          ? caughtError.message
          : "Kunde inte uppdatera event."
      )
    }
  }

  async function updateQuestion(input: {
    dbId?: string
    title: string
    description: string
    placeholder: string
    sortOrder: number
  }) {
    if (!input.dbId) return

    try {
      setDesignerError("")
      setStatusMessage("")

      const { error } = await supabase
        .from("questions")
        .update({
          title: input.title,
          description: input.description,
          placeholder: input.placeholder,
          sort_order: input.sortOrder,
        })
        .eq("id", input.dbId)

      if (error) throw error

      await syncNow(false)
      setStatusMessage("Fråga uppdaterad.")
    } catch (caughtError) {
      setDesignerError(
        caughtError instanceof Error
          ? caughtError.message
          : "Kunde inte uppdatera fråga."
      )
    }
  }

  async function createQuestion() {
    try {
      setDesignerError("")
      setStatusMessage("")

      if (!activeState.event.dbId) return

      const title = newQuestionTitle.trim()

      if (!title) {
        setDesignerError("Skriv en frågetitel.")
        return
      }

      const keyBase = slugify(title) || "question"
      const responseKey = `${keyBase}-${Date.now().toString().slice(-4)}`
      const sortOrder = activeState.questions.length + 1

      const { error } = await supabase.from("questions").insert({
        event_id: activeState.event.dbId,
        response_key: responseKey,
        title,
        description:
          newQuestionDescription.trim() ||
          "Beskriv vad gruppen ska resonera kring.",
        placeholder:
          newQuestionPlaceholder.trim() || "Skriv gruppens svar här...",
        sort_order: sortOrder,
        is_required: false,
        helper_text: "",
      })

      if (error) throw error

      setNewQuestionTitle("")
      setNewQuestionDescription("")
      setNewQuestionPlaceholder("")
      await syncNow(false)
      setStatusMessage("Ny fråga skapad.")
    } catch (caughtError) {
      setDesignerError(
        caughtError instanceof Error
          ? caughtError.message
          : "Kunde inte skapa fråga."
      )
    }
  }

  async function deleteQuestion(dbId?: string) {
    if (!dbId) return

    const confirmed = window.confirm(
      "Vill du radera frågan? Befintliga svar med samma nyckel ligger kvar i databasen men visas inte längre i gruppvyn."
    )

    if (!confirmed) return

    try {
      setDesignerError("")
      setStatusMessage("")

      const { error } = await supabase.from("questions").delete().eq("id", dbId)

      if (error) throw error

      await syncNow(false)
      setStatusMessage("Fråga raderad.")
    } catch (caughtError) {
      setDesignerError(
        caughtError instanceof Error
          ? caughtError.message
          : "Kunde inte radera fråga."
      )
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap justify-between gap-3">
          <Button
            asChild
            variant="ghost"
            className="text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <Link href="/events">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Till events
            </Link>
          </Button>

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="secondary" className="rounded-full">
              <Link href={`/join?event=${eventSlug}`}>Join</Link>
            </Button>
            <Button asChild variant="secondary" className="rounded-full">
              <Link href={`/present?event=${eventSlug}`}>Present</Link>
            </Button>
            <Button asChild variant="secondary" className="rounded-full">
              <Link href={`/moderator?event=${eventSlug}`}>Moderator</Link>
            </Button>
            <Button
              variant="secondary"
              className="rounded-full"
              onClick={() => syncNow(true)}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Uppdatera
            </Button>
          </div>
        </div>

        <div className="mb-10">
          <Badge className="mb-4 rounded-full bg-cyan-400/10 px-4 py-2 text-cyan-200 hover:bg-cyan-400/10">
            Event Designer
          </Badge>

          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
            Designa workshopflödet
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Justera eventets texter och de frågor grupperna ska arbeta med.
          </p>

          {(error || designerError || statusMessage) && (
            <div
              className={`mt-6 rounded-2xl border p-4 text-sm leading-6 ${
                error || designerError
                  ? "border-red-400/20 bg-red-500/10 text-red-200"
                  : "border-cyan-400/20 bg-cyan-400/10 text-cyan-100"
              }`}
            >
              {error || designerError || statusMessage}
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <EventSettingsCard state={activeState} onSave={updateEvent} />

          <div className="space-y-6">
            <Card className="border-white/10 bg-white/[0.06] text-white">
              <CardHeader>
                <CardTitle>Skapa ny fråga</CardTitle>
                <CardDescription className="text-slate-400">
                  Lägg till en ny frågekort i gruppvyn.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <Input
                  placeholder="Frågetitel"
                  value={newQuestionTitle}
                  onChange={(event) => setNewQuestionTitle(event.target.value)}
                  className="border-white/10 bg-slate-950/70 text-white"
                />
                <Input
                  placeholder="Beskrivning"
                  value={newQuestionDescription}
                  onChange={(event) =>
                    setNewQuestionDescription(event.target.value)
                  }
                  className="border-white/10 bg-slate-950/70 text-white"
                />
                <Input
                  placeholder="Placeholder-text"
                  value={newQuestionPlaceholder}
                  onChange={(event) =>
                    setNewQuestionPlaceholder(event.target.value)
                  }
                  className="border-white/10 bg-slate-950/70 text-white"
                />
                <Button className="rounded-full" onClick={createQuestion}>
                  <Plus className="mr-2 h-4 w-4" />
                  Skapa fråga
                </Button>
              </CardContent>
            </Card>

            {activeState.questions.map((question, index) => (
              <QuestionDesignerCard
                key={question.dbId ?? question.key}
                question={{
                  dbId: question.dbId,
                  title: question.title,
                  description: question.description,
                  placeholder: question.placeholder,
                  sortOrder: question.sortOrder ?? index + 1,
                }}
                onSave={updateQuestion}
                onDelete={deleteQuestion}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

function EventSettingsCard({
  state,
  onSave,
}: {
  state: NonNullable<ReturnType<typeof useSupabaseWorkshopState>["state"]>
  onSave: (input: {
    name: string
    subtitle: string
    description: string
    status: EventStatus
  }) => Promise<void>
}) {
  const [name, setName] = useState(state.event.name)
  const [subtitle, setSubtitle] = useState(state.event.subtitle)
  const [description, setDescription] = useState(state.event.description)
  const [status, setStatus] = useState<EventStatus>(
    state.event.status ?? "active"
  )

  return (
    <Card className="h-fit border-white/10 bg-white/[0.06] text-white">
      <CardHeader>
        <CardTitle>Event</CardTitle>
        <CardDescription className="text-slate-400">
          Grundinställningar för valt event.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <p className="mb-2 text-sm text-slate-300">Status</p>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as EventStatus)}
            className="w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white"
          >
            <option value="draft">draft</option>
            <option value="active">active</option>
            <option value="completed">completed</option>
            <option value="archived">archived</option>
          </select>
        </div>

        <div>
          <p className="mb-2 text-sm text-slate-300">Namn</p>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="border-white/10 bg-slate-950/70 text-white"
          />
        </div>

        <div>
          <p className="mb-2 text-sm text-slate-300">Underrubrik</p>
          <Input
            value={subtitle}
            onChange={(event) => setSubtitle(event.target.value)}
            className="border-white/10 bg-slate-950/70 text-white"
          />
        </div>

        <div>
          <p className="mb-2 text-sm text-slate-300">Beskrivning</p>
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="min-h-36 border-white/10 bg-slate-950/70 text-white"
          />
        </div>

        <Button
          className="w-full rounded-full"
          onClick={() =>
            onSave({
              name,
              subtitle,
              description,
              status,
            })
          }
        >
          <Save className="mr-2 h-4 w-4" />
          Spara event
        </Button>
      </CardContent>
    </Card>
  )
}

function QuestionDesignerCard({
  question,
  onSave,
  onDelete,
}: {
  question: {
    dbId?: string
    title: string
    description: string
    placeholder: string
    sortOrder: number
  }
  onSave: (input: {
    dbId?: string
    title: string
    description: string
    placeholder: string
    sortOrder: number
  }) => Promise<void>
  onDelete: (dbId?: string) => Promise<void>
}) {
  const [title, setTitle] = useState(question.title)
  const [description, setDescription] = useState(question.description)
  const [placeholder, setPlaceholder] = useState(question.placeholder)
  const [sortOrder, setSortOrder] = useState(String(question.sortOrder))

  return (
    <Card className="border-white/10 bg-white/[0.06] text-white">
      <CardHeader>
        <CardTitle>{question.title}</CardTitle>
        <CardDescription className="text-slate-400">
          Sortering: {question.sortOrder}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="border-white/10 bg-slate-950/70 text-white"
        />

        <Textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="min-h-20 border-white/10 bg-slate-950/70 text-white"
        />

        <Textarea
          value={placeholder}
          onChange={(event) => setPlaceholder(event.target.value)}
          className="min-h-20 border-white/10 bg-slate-950/70 text-white"
        />

        <Input
          type="number"
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value)}
          className="border-white/10 bg-slate-950/70 text-white"
        />

        <div className="flex flex-wrap justify-between gap-3">
          <Button
            variant="secondary"
            className="rounded-full"
            onClick={() =>
              onSave({
                dbId: question.dbId,
                title,
                description,
                placeholder,
                sortOrder: Number(sortOrder) || question.sortOrder,
              })
            }
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Spara fråga
          </Button>

          <Button
            variant="destructive"
            className="rounded-full"
            onClick={() => onDelete(question.dbId)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Radera
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}