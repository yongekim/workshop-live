"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  calculateGroupProgress,
  createInitialWorkshopState,
  DEFAULT_EVENT_SLUG,
  responseConfigs,
} from "@/lib/workshop-state"
import type {
  AiInsightCardInput,
  EventStatus,
  GroupStatus,
  ImpactLevel,
  InsightCard,
  DifficultyLevel,
  ResponseKey,
  WorkshopGroup,
  WorkshopResponseConfig,
  WorkshopState,
} from "@/types/workshop"

const EVENT_STORAGE_KEY = "workshop-live-current-event-slug"

type EventRow = {
  id: string
  slug: string
  name: string
  subtitle: string | null
  description: string
  event_date: string | null
  status: EventStatus
  moderator_questions: string[] | null
  common_themes: string[] | null
  updated_at: string
}

type GroupRow = {
  id: string
  event_id: string
  slug: string
  name: string
  access_code: string
  topic_title: string
  topic_description: string
  status: GroupStatus
  participants: number
  progress: number
  last_saved_at: string | null
  ready_at: string | null
}

type QuestionRow = {
  id: string
  event_id: string
  response_key: string
  title: string
  description: string
  placeholder: string
  sort_order: number
  is_required?: boolean
  helper_text?: string
}

type ResponseRow = {
  id: string
  group_id: string
  response_key: ResponseKey
  content: string
}

type InsightRow = {
  id: string
  group_id: string
  title: string
  problem: string
  consequence: string
  root_cause: string
  idea: string
  impact: ImpactLevel
  difficulty: DifficultyLevel
  suggested_owner: string
  next_step: string
  votes: number
  ai_generated: boolean
  created_at: string
}

type SavePayload = {
  dbId: string
  responseKey: ResponseKey
  content: string
  status: GroupStatus
  progress: number
  lastSavedAt: string
}

function getInitialEventSlug() {
  if (typeof window === "undefined") return DEFAULT_EVENT_SLUG

  const params = new URLSearchParams(window.location.search)
  const queryEvent = params.get("event")

  if (queryEvent) {
    window.localStorage.setItem(EVENT_STORAGE_KEY, queryEvent)
    return queryEvent
  }

  return window.localStorage.getItem(EVENT_STORAGE_KEY) || DEFAULT_EVENT_SLUG
}

function createEmptyResponses(
  questions: WorkshopResponseConfig[]
): Record<ResponseKey, string> {
  return questions.reduce<Record<ResponseKey, string>>((result, question) => {
    result[question.key] = ""
    return result
  }, {})
}

function createTitleFromText(text: string, fallback: string) {
  const cleaned = text.trim().replace(/\s+/g, " ")

  if (!cleaned) return fallback

  const firstSentence = cleaned.split(/[.!?]/)[0]

  if (firstSentence.length <= 70) return firstSentence

  return `${firstSentence.slice(0, 67)}...`
}

function getPreferredResponse(group: WorkshopGroup, keys: string[]) {
  for (const key of keys) {
    const value = group.responses[key]?.trim()
    if (value) return value
  }

  return ""
}

function buildInsightFromGroup(group: WorkshopGroup): AiInsightCardInput {
  const currentState = getPreferredResponse(group, ["currentState", "nulage"])
  const friction = getPreferredResponse(group, ["friction", "friktion"])
  const improvements = getPreferredResponse(group, [
    "improvements",
    "forbattringar",
    "solutions",
  ])

  const allText = Object.values(group.responses).filter(Boolean).join(" ")

  const title = createTitleFromText(
    improvements || friction || allText || group.topicTitle,
    `Insikt från ${group.name}`
  )

  return {
    title,
    problem:
      friction ||
      "Gruppen har identifierat ett område där processen behöver förtydligas.",
    consequence:
      "Detta kan skapa mer manuell hantering, otydligt ansvar och svårare uppföljning.",
    rootCause:
      currentState ||
      "Bakomliggande orsak behöver fördjupas av gruppen innan nästa steg.",
    idea:
      improvements ||
      "Formulera ett konkret förbättringsförslag som kan testas med utvalda parter.",
    impact: improvements.length > 40 ? "Hög" : "Medel",
    difficulty: friction.toLowerCase().includes("system") ? "Hög" : "Medel",
    suggestedOwner: "Gemensamt ägarskap",
    nextStep:
      improvements ||
      "Definiera ansvarig part, önskad effekt och första praktiska test.",
  }
}

function mapRowsToState(
  eventRow: EventRow,
  groupRows: GroupRow[],
  questionRows: QuestionRow[],
  responseRows: ResponseRow[],
  insightRows: InsightRow[]
): WorkshopState {
  const questions: WorkshopResponseConfig[] =
    questionRows.length > 0
      ? questionRows
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((question) => ({
            dbId: question.id,
            key: question.response_key,
            title: question.title,
            description: question.description,
            placeholder: question.placeholder,
            sortOrder: question.sort_order,
            isRequired: question.is_required ?? true,
            helperText: question.helper_text ?? "",
          }))
      : responseConfigs

  const groups = groupRows.map((groupRow) => {
    const responses = createEmptyResponses(questions)

    responseRows
      .filter((response) => response.group_id === groupRow.id)
      .forEach((response) => {
        responses[response.response_key] = response.content
      })

    const insights = insightRows
      .filter((insight) => insight.group_id === groupRow.id)
      .map((insight): InsightCard => {
        return {
          id: insight.id,
          groupId: groupRow.slug,
          title: insight.title,
          problem: insight.problem,
          consequence: insight.consequence,
          rootCause: insight.root_cause,
          idea: insight.idea,
          impact: insight.impact,
          difficulty: insight.difficulty,
          suggestedOwner: insight.suggested_owner,
          nextStep: insight.next_step,
          votes: insight.votes,
          createdAt: insight.created_at,
          aiGenerated: insight.ai_generated,
        }
      })

    return {
      id: groupRow.slug,
      dbId: groupRow.id,
      name: groupRow.name,
      accessCode: groupRow.access_code,
      topicTitle: groupRow.topic_title,
      topicDescription: groupRow.topic_description,
      status: groupRow.status,
      participants: groupRow.participants,
      progress: groupRow.progress,
      responses,
      insights,
      lastSavedAt: groupRow.last_saved_at ?? undefined,
      readyAt: groupRow.ready_at ?? undefined,
    }
  })

  return {
    event: {
      dbId: eventRow.id,
      slug: eventRow.slug,
      name: eventRow.name,
      subtitle: eventRow.subtitle ?? "",
      date: eventRow.event_date ?? "Demo-event",
      description: eventRow.description,
      status: eventRow.status,
    },
    groups,
    questions,
    moderatorQuestions: eventRow.moderator_questions ?? [],
    commonThemes: eventRow.common_themes ?? [],
    updatedAt: eventRow.updated_at,
  }
}

export function useSupabaseWorkshopState() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const saveTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const [eventSlug, setEventSlug] = useState(DEFAULT_EVENT_SLUG)
  const [state, setState] = useState<WorkshopState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [realtimeStatus, setRealtimeStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting")

  useEffect(() => {
    const slug = getInitialEventSlug()
    setEventSlug(slug)
  }, [])

  const fetchWorkshop = useCallback(
    async (showLoading = false) => {
      if (showLoading) setIsLoading(true)

      try {
        setError(null)

        if (typeof window !== "undefined") {
          window.localStorage.setItem(EVENT_STORAGE_KEY, eventSlug)
        }

        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("*")
          .eq("slug", eventSlug)
          .single()

        if (eventError) throw eventError

        const eventRow = eventData as EventRow

        const { data: groupData, error: groupError } = await supabase
          .from("workshop_groups")
          .select("*")
          .eq("event_id", eventRow.id)
          .order("name", { ascending: true })

        if (groupError) throw groupError

        const { data: questionData, error: questionError } = await supabase
          .from("questions")
          .select("*")
          .eq("event_id", eventRow.id)
          .order("sort_order", { ascending: true })

        if (questionError) throw questionError

        const groupRows = (groupData ?? []) as GroupRow[]
        const questionRows = (questionData ?? []) as QuestionRow[]
        const groupDbIds = groupRows.map((group) => group.id)

        let responseRows: ResponseRow[] = []
        let insightRows: InsightRow[] = []

        if (groupDbIds.length > 0) {
          const { data: responseData, error: responseError } = await supabase
            .from("responses")
            .select("*")
            .in("group_id", groupDbIds)

          if (responseError) throw responseError

          responseRows = (responseData ?? []) as ResponseRow[]

          const { data: insightData, error: insightError } = await supabase
            .from("insight_cards")
            .select("*")
            .in("group_id", groupDbIds)
            .order("votes", { ascending: false })

          if (insightError) throw insightError

          insightRows = (insightData ?? []) as InsightRow[]
        }

        setState(
          mapRowsToState(
            eventRow,
            groupRows,
            questionRows,
            responseRows,
            insightRows
          )
        )
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Kunde inte läsa workshopdata från Supabase."

        setError(message)
      } finally {
        setIsLoading(false)
      }
    },
    [eventSlug, supabase]
  )

  useEffect(() => {
    void fetchWorkshop(true)

    const channel = supabase
      .channel(`workshop-live-db-changes-${eventSlug}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        () => void fetchWorkshop(false)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workshop_groups" },
        () => void fetchWorkshop(false)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "questions" },
        () => void fetchWorkshop(false)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "responses" },
        () => void fetchWorkshop(false)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "insight_cards" },
        () => void fetchWorkshop(false)
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setRealtimeStatus("connected")
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setRealtimeStatus("disconnected")
        }
      })

    return () => {
      setRealtimeStatus("disconnected")
      void supabase.removeChannel(channel)
    }
  }, [eventSlug, fetchWorkshop, supabase])

  const updateGroupResponse = useCallback(
    (groupId: string, key: ResponseKey, value: string) => {
      const currentGroup = state?.groups.find((group) => group.id === groupId)
      const totalQuestions = state?.questions.length ?? 3

      if (!currentGroup?.dbId) return

      const responses = {
        ...currentGroup.responses,
        [key]: value,
      }

      const nextStatus =
        currentGroup.status === "Redo för sammanfattning"
          ? currentGroup.status
          : "Aktiv"

      const lastSavedAt = new Date().toISOString()
      const progress = calculateGroupProgress(
        responses,
        nextStatus,
        totalQuestions
      )

      const payloadToSave: SavePayload = {
        dbId: currentGroup.dbId,
        responseKey: key,
        content: value,
        status: nextStatus,
        progress,
        lastSavedAt,
      }

      setState((current) => {
        if (!current) return current

        return {
          ...current,
          groups: current.groups.map((group) => {
            if (group.id !== groupId) return group

            return {
              ...group,
              responses,
              status: nextStatus,
              progress,
              lastSavedAt,
            }
          }),
          updatedAt: lastSavedAt,
        }
      })

      const timeoutKey = `${payloadToSave.dbId}-${payloadToSave.responseKey}`

      if (saveTimeouts.current[timeoutKey]) {
        clearTimeout(saveTimeouts.current[timeoutKey])
      }

      saveTimeouts.current[timeoutKey] = setTimeout(() => {
        void (async () => {
          try {
            setError(null)

            const { error: responseError } = await supabase
              .from("responses")
              .upsert(
                {
                  group_id: payloadToSave.dbId,
                  response_key: payloadToSave.responseKey,
                  content: payloadToSave.content,
                  updated_at: payloadToSave.lastSavedAt,
                },
                {
                  onConflict: "group_id,response_key",
                }
              )

            if (responseError) throw responseError

            const { error: groupError } = await supabase
              .from("workshop_groups")
              .update({
                status: payloadToSave.status,
                progress: payloadToSave.progress,
                last_saved_at: payloadToSave.lastSavedAt,
              })
              .eq("id", payloadToSave.dbId)

            if (groupError) throw groupError
          } catch (caughtError) {
            const message =
              caughtError instanceof Error
                ? caughtError.message
                : "Kunde inte spara gruppsvaret."

            setError(message)
          }
        })()
      }, 700)
    },
    [state, supabase]
  )

  const markGroupReady = useCallback(
    async (groupId: string) => {
      const group = state?.groups.find((item) => item.id === groupId)
      const dbId = group?.dbId

      if (!group || !dbId) return

      const now = new Date().toISOString()

      setState((current) => {
        if (!current) return current

        return {
          ...current,
          groups: current.groups.map((item) => {
            if (item.id !== groupId) return item

            return {
              ...item,
              status: "Redo för sammanfattning",
              progress: 100,
              readyAt: now,
              lastSavedAt: now,
            }
          }),
          updatedAt: now,
        }
      })

      try {
        setError(null)

        const { error: groupError } = await supabase
          .from("workshop_groups")
          .update({
            status: "Redo för sammanfattning",
            progress: 100,
            ready_at: now,
            last_saved_at: now,
          })
          .eq("id", dbId)

        if (groupError) throw groupError
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Kunde inte markera gruppen som redo."

        setError(message)
      }
    },
    [state, supabase]
  )

  const createInsightCardFromData = useCallback(
    async (
      groupId: string,
      cardInput: AiInsightCardInput,
      aiGenerated = true
    ) => {
      const group = state?.groups.find((item) => item.id === groupId)
      const dbId = group?.dbId

      if (!group || !dbId) return

      const insight: InsightCard = {
        id: crypto.randomUUID(),
        groupId: group.id,
        title: cardInput.title,
        problem: cardInput.problem,
        consequence: cardInput.consequence,
        rootCause: cardInput.rootCause,
        idea: cardInput.idea,
        impact: cardInput.impact,
        difficulty: cardInput.difficulty,
        suggestedOwner: cardInput.suggestedOwner,
        nextStep: cardInput.nextStep,
        votes: 0,
        createdAt: new Date().toISOString(),
        aiGenerated,
      }

      const now = new Date().toISOString()

      setState((current) => {
        if (!current) return current

        return {
          ...current,
          groups: current.groups.map((item) => {
            if (item.id !== groupId) return item

            return {
              ...item,
              insights: [insight, ...item.insights],
              progress: Math.max(item.progress, 82),
              lastSavedAt: now,
            }
          }),
          updatedAt: now,
        }
      })

      try {
        setError(null)

        const { error: insightError } = await supabase
          .from("insight_cards")
          .insert({
            id: insight.id,
            group_id: dbId,
            title: insight.title,
            problem: insight.problem,
            consequence: insight.consequence,
            root_cause: insight.rootCause,
            idea: insight.idea,
            impact: insight.impact,
            difficulty: insight.difficulty,
            suggested_owner: insight.suggestedOwner,
            next_step: insight.nextStep,
            votes: insight.votes,
            ai_generated: insight.aiGenerated,
          })

        if (insightError) throw insightError

        const { error: groupError } = await supabase
          .from("workshop_groups")
          .update({
            progress: Math.max(group.progress, 82),
            last_saved_at: now,
          })
          .eq("id", dbId)

        if (groupError) throw groupError
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Kunde inte skapa insiktskort."

        setError(message)
      }
    },
    [state, supabase]
  )

  const createInsightFromGroup = useCallback(
    async (groupId: string) => {
      const group = state?.groups.find((item) => item.id === groupId)

      if (!group) return

      await createInsightCardFromData(
        groupId,
        buildInsightFromGroup(group),
        false
      )
    },
    [createInsightCardFromData, state]
  )

  const voteForInsight = useCallback(
    async (groupId: string, insightId: string) => {
      setState((current) => {
        if (!current) return current

        return {
          ...current,
          groups: current.groups.map((group) => {
            if (group.id !== groupId) return group

            return {
              ...group,
              insights: group.insights.map((insight) => {
                if (insight.id !== insightId) return insight

                return {
                  ...insight,
                  votes: insight.votes + 1,
                }
              }),
              lastSavedAt: new Date().toISOString(),
            }
          }),
          updatedAt: new Date().toISOString(),
        }
      })

      try {
        setError(null)

        const { error: voteError } = await supabase.rpc(
          "increment_insight_votes",
          {
            insight_id: insightId,
          }
        )

        if (voteError) throw voteError
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Kunde inte spara röst."

        setError(message)
      }
    },
    [supabase]
  )

  const resetWorkshop = useCallback(async () => {
    const initialState = createInitialWorkshopState()

    try {
      setIsLoading(true)
      setError(null)

      await supabase.from("events").delete().eq("slug", eventSlug)

      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .insert({
          slug: eventSlug,
          name: initialState.event.name,
          subtitle: initialState.event.subtitle,
          description: initialState.event.description,
          event_date: null,
          status: "active",
          moderator_questions: initialState.moderatorQuestions,
          common_themes: initialState.commonThemes,
        })
        .select("*")
        .single()

      if (eventError) throw eventError

      const eventRow = eventData as EventRow

      const questionRows = responseConfigs.map((config, index) => ({
        event_id: eventRow.id,
        response_key: config.key,
        title: config.title,
        description: config.description,
        placeholder: config.placeholder,
        sort_order: index + 1,
        is_required: config.isRequired ?? true,
        helper_text: config.helperText ?? "",
      }))

      const { error: questionError } = await supabase
        .from("questions")
        .insert(questionRows)

      if (questionError) throw questionError

      for (const group of initialState.groups) {
        const { data: groupData, error: groupError } = await supabase
          .from("workshop_groups")
          .insert({
            event_id: eventRow.id,
            slug: group.id,
            name: group.name,
            access_code: group.accessCode,
            topic_title: group.topicTitle,
            topic_description: group.topicDescription,
            status: group.status,
            participants: group.participants,
            progress: group.progress,
          })
          .select("*")
          .single()

        if (groupError) throw groupError

        const groupRow = groupData as GroupRow

        const responseRows = Object.entries(group.responses).map(
          ([responseKey, content]) => ({
            group_id: groupRow.id,
            response_key: responseKey,
            content,
          })
        )

        if (responseRows.length > 0) {
          const { error: responseError } = await supabase
            .from("responses")
            .insert(responseRows)

          if (responseError) throw responseError
        }
      }

      await fetchWorkshop(false)
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Kunde inte nollställa workshopdata."

      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [eventSlug, fetchWorkshop, supabase])

  const groups = state?.groups ?? []

  const allInsights = useMemo(
    () =>
      groups.flatMap((group) =>
        group.insights.map((insight) => ({
          ...insight,
          groupName: group.name,
          topicTitle: group.topicTitle,
        }))
      ),
    [groups]
  )

  return {
    eventSlug,
    state,
    groups,
    allInsights,
    isLoading,
    error,
    realtimeStatus,
    updateGroupResponse,
    markGroupReady,
    createInsightFromGroup,
    createInsightCardFromData,
    voteForInsight,
    resetWorkshop,
    syncNow: fetchWorkshop,
  }
}