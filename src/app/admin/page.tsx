"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Download,
  Plus,
  RefreshCcw,
  Save,
  Trash2,
  Users,
} from "lucide-react"

import { useSupabaseWorkshopState } from "@/hooks/use-supabase-workshop-state"
import { buildParticipantsCsv, downloadTextFile } from "@/lib/report/report-builder"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import type { EventStatus, GroupStatus } from "@/types/workshop"
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
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

const DEMO_EVENT_SLUG = "affarsresans-ekosystem"

type ParticipantListItem = {
  id: string
  name: string
  company: string
  email: string
  groupName: string
  joinedAt: string
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

function linesToArray(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

export default function AdminPage() {
  const {
    eventSlug,
    state,
    groups,
    syncNow,
    resetWorkshop,
    realtimeStatus,
    error: workshopError,
  } = useSupabaseWorkshopState()

  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  const [eventName, setEventName] = useState("")
  const [eventSubtitle, setEventSubtitle] = useState("")
  const [eventDescription, setEventDescription] = useState("")
  const [eventStatus, setEventStatus] = useState<EventStatus>("active")
  const [moderatorQuestions, setModeratorQuestions] = useState("")
  const [commonThemes, setCommonThemes] = useState("")
  const [statusMessage, setStatusMessage] = useState("")
  const [adminError, setAdminError] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const [newGroupTitle, setNewGroupTitle] = useState("")
  const [newGroupDescription, setNewGroupDescription] = useState("")

  const [participants, setParticipants] = useState<ParticipantListItem[]>([])
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false)

  useEffect(() => {
    if (!state) return

    setEventName(state.event.name)
    setEventSubtitle(state.event.subtitle)
    setEventDescription(state.event.description)
    setEventStatus(state.event.status ?? "active")
    setModeratorQuestions(state.moderatorQuestions.join("\n"))
    setCommonThemes(state.commonThemes.join("\n"))
  }, [state])

  async function copyToClipboard(value: string) {
    await navigator.clipboard.writeText(value)
    setStatusMessage("Länk kopierad.")
  }

  async function getEventId() {
    const { data, error } = await supabase
      .from("events")
      .select("id")
      .eq("slug", eventSlug)
      .single()

    if (error) throw error

    return data.id as string
  }

  async function saveEventSettings() {
    try {
      setIsSaving(true)
      setAdminError("")
      setStatusMessage("")

      const { error } = await supabase
        .from("events")
        .update({
          name: eventName,
          subtitle: eventSubtitle,
          description: eventDescription,
          status: eventStatus,
          moderator_questions: linesToArray(moderatorQuestions),
          common_themes: linesToArray(commonThemes),
        })
        .eq("slug", eventSlug)

      if (error) throw error

      await syncNow(false)
      setStatusMessage("Eventinställningar sparade.")
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Kunde inte spara eventinställningar."

      setAdminError(message)
    } finally {
      setIsSaving(false)
    }
  }

  async function loadParticipants() {
    try {
      setIsLoadingParticipants(true)
      setAdminError("")
      setStatusMessage("")

      const eventId = await getEventId()

      const { data, error } = await supabase
        .from("participants")
        .select("id,name,company,email,group_id,joined_at")
        .eq("event_id", eventId)
        .order("joined_at", { ascending: false })

      if (error) throw error

      const mapped = (data ?? []).map((participant) => {
        const group = groups.find((item) => item.dbId === participant.group_id)

        return {
          id: participant.id,
          name: participant.name,
          company: participant.company,
          email: participant.email,
          groupName: group?.name ?? "Ingen grupp",
          joinedAt: new Intl.DateTimeFormat("sv-SE", {
            dateStyle: "short",
            timeStyle: "short",
          }).format(new Date(participant.joined_at)),
        }
      })

      setParticipants(mapped)
      setStatusMessage("Deltagarlistan uppdaterad.")
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Kunde inte hämta deltagarlistan."

      setAdminError(message)
    } finally {
      setIsLoadingParticipants(false)
    }
  }

  function exportParticipants() {
    downloadTextFile({
      filename: "workshop-deltagare.csv",
      content: buildParticipantsCsv(participants),
      mimeType: "text/csv;charset=utf-8",
    })
  }

  async function clearWorkshopData() {
    const confirmed = window.confirm(
      "Detta rensar deltagare, gruppsvar, insiktskort, röster och rapportversioner. Event och grupper behålls. Vill du fortsätta?"
    )

    if (!confirmed) return

    try {
      setIsSaving(true)
      setAdminError("")
      setStatusMessage("")

      const eventId = await getEventId()
      const groupDbIds = groups
        .map((group) => group.dbId)
        .filter((value): value is string => Boolean(value))

      if (groupDbIds.length > 0) {
        await supabase.from("votes").delete().neq("id", "00000000-0000-0000-0000-000000000000")
        await supabase.from("insight_cards").delete().in("group_id", groupDbIds)
        await supabase.from("responses").delete().in("group_id", groupDbIds)
        await supabase
          .from("workshop_groups")
          .update({
            status: "Inte startad",
            participants: 0,
            progress: 0,
            last_saved_at: null,
            ready_at: null,
          })
          .in("id", groupDbIds)
      }

      await supabase.from("participants").delete().eq("event_id", eventId)
      await supabase.from("report_snapshots").delete().eq("event_id", eventId)

      setParticipants([])
      await syncNow(false)
      setStatusMessage("Workshopdata rensad. Event och grupper är kvar.")
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Kunde inte rensa workshopdata."

      setAdminError(message)
    } finally {
      setIsSaving(false)
    }
  }

  async function updateGroup({
    dbId,
    name,
    topicTitle,
    topicDescription,
    participants,
    progress,
    status,
  }: {
    dbId?: string
    name: string
    topicTitle: string
    topicDescription: string
    participants: number
    progress: number
    status: GroupStatus
  }) {
    if (!dbId) return

    try {
      setAdminError("")
      setStatusMessage("")

      const { error } = await supabase
        .from("workshop_groups")
        .update({
          name,
          topic_title: topicTitle,
          topic_description: topicDescription,
          participants,
          progress,
          status,
        })
        .eq("id", dbId)

      if (error) throw error

      await syncNow(false)
      setStatusMessage("Grupp uppdaterad.")
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Kunde inte uppdatera grupp."

      setAdminError(message)
    }
  }

  async function createGroup() {
    try {
      setIsSaving(true)
      setAdminError("")
      setStatusMessage("")

      const title = newGroupTitle.trim()

      if (!title) {
        setAdminError("Skriv en titel för den nya gruppen.")
        return
      }

      const eventId = await getEventId()
      const nextNumber = groups.length + 1
      const slugBase = slugify(title) || `grupp-${nextNumber}`
      const slug = `${slugBase}-${Date.now().toString().slice(-5)}`
      const accessCode = `G${nextNumber}`

      const { error: groupError } = await supabase
        .from("workshop_groups")
        .insert({
          event_id: eventId,
          slug,
          name: `Grupp ${nextNumber}`,
          access_code: accessCode,
          topic_title: title,
          topic_description:
            newGroupDescription.trim() ||
            "Beskriv workshopgruppens frågeställning här.",
          status: "Inte startad",
          participants: 0,
          progress: 0,
        })

      if (groupError) throw groupError

      setNewGroupTitle("")
      setNewGroupDescription("")
      await syncNow(false)
      setStatusMessage("Ny grupp skapad.")
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Kunde inte skapa grupp."

      setAdminError(message)
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteGroup(dbId?: string) {
    if (!dbId) return

    const confirmed = window.confirm(
      "Vill du verkligen radera gruppen? Svar, deltagare och insiktskort kopplade till gruppen raderas också."
    )

    if (!confirmed) return

    try {
      setAdminError("")
      setStatusMessage("")

      const { error } = await supabase
        .from("workshop_groups")
        .delete()
        .eq("id", dbId)

      if (error) throw error

      await syncNow(false)
      await loadParticipants()
      setStatusMessage("Grupp raderad.")
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Kunde inte radera grupp."

      setAdminError(message)
    }
  }

  if (!state) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-slate-300">Laddar admin...</p>
      </main>
    )
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
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Till startsidan
            </Link>
          </Button>

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="secondary" className="rounded-full">
              <Link href="/present">Öppna storbildsvy</Link>
            </Button>

            <Button asChild variant="secondary" className="rounded-full">
              <Link href="/moderator">Öppna moderatorvy</Link>
            </Button>

            <Button
              variant="secondary"
              className="rounded-full"
              onClick={resetWorkshop}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Nollställ demo
            </Button>
          </div>
        </div>

        <div className="mb-10">
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge className="rounded-full bg-cyan-400/10 px-4 py-2 text-cyan-200 hover:bg-cyan-400/10">
              Admin
            </Badge>

            <Badge className="rounded-full bg-white/10 px-4 py-2 text-slate-200 hover:bg-white/10">
              Realtime:{" "}
              {realtimeStatus === "connected"
                ? "ansluten"
                : realtimeStatus === "connecting"
                  ? "ansluter"
                  : "frånkopplad"}
            </Badge>

            <Badge className="rounded-full bg-white/10 px-4 py-2 text-slate-200 hover:bg-white/10">
              Eventstatus: {eventStatus}
            </Badge>
          </div>

          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
            Event Control Center
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Förbered eventet, hantera grupper, exportera deltagare och rensa
            testdata inför skarp körning.
          </p>

          {(adminError || workshopError || statusMessage) && (
            <div
              className={`mt-6 rounded-2xl border p-4 text-sm leading-6 ${
                adminError || workshopError
                  ? "border-red-400/20 bg-red-500/10 text-red-200"
                  : "border-cyan-400/20 bg-cyan-400/10 text-cyan-100"
              }`}
            >
              {adminError || workshopError || statusMessage}
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <aside className="space-y-6">
            <Card className="border-white/10 bg-white/[0.06] text-white">
              <CardHeader>
                <CardTitle>Eventinställningar</CardTitle>
                <CardDescription className="text-slate-400">
                  Det här styr texter i deltagarvy, storbildsvy och rapport.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-2 text-sm text-slate-300">Eventstatus</p>
                  <select
                    value={eventStatus}
                    onChange={(event) =>
                      setEventStatus(event.target.value as EventStatus)
                    }
                    className="w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white"
                  >
                    <option value="draft">draft</option>
                    <option value="active">active</option>
                    <option value="completed">completed</option>
                    <option value="archived">archived</option>
                  </select>
                </div>

                <div>
                  <p className="mb-2 text-sm text-slate-300">Eventnamn</p>
                  <Input
                    value={eventName}
                    onChange={(event) => setEventName(event.target.value)}
                    className="border-white/10 bg-slate-950/70 text-white"
                  />
                </div>

                <div>
                  <p className="mb-2 text-sm text-slate-300">Underrubrik</p>
                  <Input
                    value={eventSubtitle}
                    onChange={(event) => setEventSubtitle(event.target.value)}
                    className="border-white/10 bg-slate-950/70 text-white"
                  />
                </div>

                <div>
                  <p className="mb-2 text-sm text-slate-300">Beskrivning</p>
                  <Textarea
                    value={eventDescription}
                    onChange={(event) =>
                      setEventDescription(event.target.value)
                    }
                    className="min-h-28 border-white/10 bg-slate-950/70 text-white"
                  />
                </div>

                <div>
                  <p className="mb-2 text-sm text-slate-300">
                    Moderatorfrågor, en per rad
                  </p>
                  <Textarea
                    value={moderatorQuestions}
                    onChange={(event) =>
                      setModeratorQuestions(event.target.value)
                    }
                    className="min-h-36 border-white/10 bg-slate-950/70 text-white"
                  />
                </div>

                <div>
                  <p className="mb-2 text-sm text-slate-300">
                    Gemensamma teman, en per rad
                  </p>
                  <Textarea
                    value={commonThemes}
                    onChange={(event) => setCommonThemes(event.target.value)}
                    className="min-h-36 border-white/10 bg-slate-950/70 text-white"
                  />
                </div>

                <Button
                  className="w-full rounded-full"
                  onClick={saveEventSettings}
                  disabled={isSaving}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Spara eventinställningar
                </Button>
              </CardContent>
            </Card>

            <Card className="border-red-400/20 bg-red-500/10 text-white">
              <CardHeader>
                <CardTitle>Inför skarp körning</CardTitle>
                <CardDescription className="text-red-100/80">
                  Rensa testdata men behåll event, grupper och frågor.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  className="w-full rounded-full"
                  onClick={clearWorkshopData}
                  disabled={isSaving}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Rensa workshopdata
                </Button>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.06] text-white">
              <CardHeader>
                <CardTitle>Snabblänkar</CardTitle>
                <CardDescription className="text-slate-400">
                  Använd dessa under eventet.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                    { label: "Deltagarvy", href: `/join?event=${eventSlug}` },
                    { label: "Storbildsvy", href: `/present?event=${eventSlug}` },
                    { label: "Moderatorvy", href: `/moderator?event=${eventSlug}` },
                    { label: "Rapportvy", href: `/report/demo?event=${eventSlug}` },
                    { label: "Event check", href: "/event-check" },
                    { label: "Event Designer", href: `/designer?event=${eventSlug}` },
                    { label: "Alla events", href: "/events" },
                ].map((link) => (
                  <div
                    key={link.href}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-3"
                  >
                    <div>
                      <p className="font-medium">{link.label}</p>
                      <p className="text-xs text-slate-400">{link.href}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={link.href}>Öppna</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          copyToClipboard(`${window.location.origin}${link.href}`)
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </aside>

          <div className="space-y-6">
            <Card className="border-white/10 bg-white/[0.06] text-white">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>Deltagare</CardTitle>
                    <CardDescription className="text-slate-400">
                      Registrerade deltagare från deltagarflödet.
                    </CardDescription>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="secondary"
                      className="rounded-full"
                      onClick={loadParticipants}
                      disabled={isLoadingParticipants}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Hämta deltagare
                    </Button>

                    <Button
                      variant="secondary"
                      className="rounded-full"
                      onClick={exportParticipants}
                      disabled={participants.length === 0}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Exportera CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {participants.length > 0 ? (
                  participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="grid gap-2 rounded-2xl border border-white/10 bg-slate-950/50 p-4 md:grid-cols-[1fr_1fr_1fr_auto]"
                    >
                      <div>
                        <p className="font-medium">{participant.name}</p>
                        <p className="text-xs text-slate-400">
                          {participant.email}
                        </p>
                      </div>
                      <p className="text-sm text-slate-300">
                        {participant.company}
                      </p>
                      <p className="text-sm text-slate-300">
                        {participant.groupName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {participant.joinedAt}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm leading-6 text-slate-400">
                    Klicka “Hämta deltagare” för att se deltagarlistan.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.06] text-white">
              <CardHeader>
                <CardTitle>Skapa ny grupp</CardTitle>
                <CardDescription className="text-slate-400">
                  Lägg till fler workshopspår vid behov.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
                <Input
                  placeholder="Ämnestitel"
                  value={newGroupTitle}
                  onChange={(event) => setNewGroupTitle(event.target.value)}
                  className="border-white/10 bg-slate-950/70 text-white"
                />
                <Input
                  placeholder="Kort beskrivning"
                  value={newGroupDescription}
                  onChange={(event) =>
                    setNewGroupDescription(event.target.value)
                  }
                  className="border-white/10 bg-slate-950/70 text-white"
                />
                <Button className="rounded-full" onClick={createGroup}>
                  <Plus className="mr-2 h-4 w-4" />
                  Skapa
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-5">
              {groups.map((group) => (
                <GroupAdminCard
                  key={group.id}
                  group={group}
                  onSave={updateGroup}
                  onDelete={deleteGroup}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function GroupAdminCard({
  group,
  onSave,
  onDelete,
}: {
  group: {
    id: string
    dbId?: string
    name: string
    accessCode: string
    topicTitle: string
    topicDescription: string
    status: GroupStatus
    participants: number
    progress: number
  }
  onSave: (input: {
    dbId?: string
    name: string
    topicTitle: string
    topicDescription: string
    participants: number
    progress: number
    status: GroupStatus
  }) => Promise<void>
  onDelete: (dbId?: string) => Promise<void>
}) {
  const [name, setName] = useState(group.name)
  const [topicTitle, setTopicTitle] = useState(group.topicTitle)
  const [topicDescription, setTopicDescription] = useState(
    group.topicDescription
  )
  const [participants, setParticipants] = useState(String(group.participants))
  const [progress, setProgress] = useState(String(group.progress))
  const [status, setStatus] = useState<GroupStatus>(group.status)

  useEffect(() => {
    setName(group.name)
    setTopicTitle(group.topicTitle)
    setTopicDescription(group.topicDescription)
    setParticipants(String(group.participants))
    setProgress(String(group.progress))
    setStatus(group.status)
  }, [group])

  return (
    <Card className="border-white/10 bg-white/[0.06] text-white">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardDescription className="text-slate-400">
              Kod {group.accessCode}
            </CardDescription>
            <CardTitle>{group.name}</CardTitle>
          </div>

          <Badge className="rounded-full bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/10">
            {group.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="mb-2 text-sm text-slate-300">Gruppnamn</p>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="border-white/10 bg-slate-950/70 text-white"
            />
          </div>

          <div>
            <p className="mb-2 text-sm text-slate-300">Deltagare</p>
            <Input
              type="number"
              value={participants}
              onChange={(event) => setParticipants(event.target.value)}
              className="border-white/10 bg-slate-950/70 text-white"
            />
          </div>

          <div>
            <p className="mb-2 text-sm text-slate-300">Progress</p>
            <Input
              type="number"
              min={0}
              max={100}
              value={progress}
              onChange={(event) => setProgress(event.target.value)}
              className="border-white/10 bg-slate-950/70 text-white"
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm text-slate-300">Status</p>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as GroupStatus)}
            className="w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white"
          >
            <option>Inte startad</option>
            <option>Aktiv</option>
            <option>Redo för sammanfattning</option>
          </select>
        </div>

        <div>
          <p className="mb-2 text-sm text-slate-300">Ämnestitel</p>
          <Input
            value={topicTitle}
            onChange={(event) => setTopicTitle(event.target.value)}
            className="border-white/10 bg-slate-950/70 text-white"
          />
        </div>

        <div>
          <p className="mb-2 text-sm text-slate-300">Ämnesbeskrivning</p>
          <Textarea
            value={topicDescription}
            onChange={(event) => setTopicDescription(event.target.value)}
            className="min-h-24 border-white/10 bg-slate-950/70 text-white"
          />
        </div>

        <Separator className="bg-white/10" />

        <div className="flex flex-wrap justify-between gap-3">
          <Button
            variant="secondary"
            className="rounded-full"
            onClick={() =>
              onSave({
                dbId: group.dbId,
                name,
                topicTitle,
                topicDescription,
                participants: Number(participants) || 0,
                progress: Math.min(100, Math.max(0, Number(progress) || 0)),
                status,
              })
            }
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Spara grupp
          </Button>

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="secondary" className="rounded-full">
              <Link href={`/group/${group.id}`}>Öppna grupp</Link>
            </Button>

            <Button
              variant="destructive"
              className="rounded-full"
              onClick={() => onDelete(group.dbId)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Radera
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}