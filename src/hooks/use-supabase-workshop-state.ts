"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  calculateGroupProgress,
  createInitialWorkshopState,
  responseConfigs,
} from "@/lib/workshop-state"
import type {
  AiInsightCardInput,
  GroupStatus,
  ImpactLevel,
  InsightCard,
  DifficultyLevel,
  ResponseKey,
  WorkshopGroup,
  WorkshopState,
} from "@/types/workshop"

const DEMO_EVENT_SLUG = "affarsresans-ekosystem"

type EventRow = {
  id: string
  slug: string
  name: string
  subtitle: string | null
  description: string
  event_date: string | null
  status: string
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

function createEmptyResponses(): Record<ResponseKey, string> {
  return {
    currentState: "",
    friction: "",
    improvements: "",
  }
}

function createTitleFromText(text: string, fallback: string) {
  const cleaned = text.trim().replace(/\s+/g, " ")

  if (!cleaned) return fallback

  const firstSentence = cleaned.split(/[.!?]/)[0]

  if (firstSentence.length <= 70) {
    return firstSentence
  }

  return `${firstSentence.slice(0, 67)}...`
}

function buildInsightFromGroup(group: WorkshopGroup): AiInsightCardInput {
  const currentState = group.responses.currentState.trim()
  const friction = group.responses.friction.trim()
  const improvements = group.responses.improvements.trim()

  const title = createTitleFromText(
    improvements || friction || group.topicTitle,
    `Insikt från ${group.name}`
  )

  return {
    title,
    problem:
      friction ||
      "Gruppen har identifierat ett område där processen behöver förtydligas.",
    consequence:
      "Detta kan skapa mer manuell hantering, otydligt ansvar och svårare uppföljning för Travel Manager.",
    rootCause:
      currentState ||
      "Bakomliggande orsak behöver fördjupas av gruppen innan nästa steg.",
    idea:
      improvements ||
      "Formulera ett konkret förbättringsförslag som kan testas med utvalda parter.",
    impact: improvements.length > 40 ? "Hög" : "Medel",
    difficulty: friction.toLowerCase().includes("system") ? "Hög" : "Medel",
    suggestedOwner: "Leverantör + resebyrå",
    nextStep:
      improvements ||
      "Definiera ansvarig part, önskad effekt och första praktiska test.",
  }
}

function mapRowsToState(
  eventRow: EventRow,
  groupRows: GroupRow[],
  responseRows: ResponseRow[],
  insightRows: InsightRow[]
): WorkshopState {
  const groups = groupRows.map((groupRow) => {
    const responses = createEmptyResponses()

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
      name: eventRow.name,
      subtitle: eventRow.subtitle ?? "",
      date: eventRow.event_date ?? "Demo-event",
      description: eventRow.description,
    },
    groups,
    moderatorQuestions: eventRow.moderator_questions ?? [],
    commonThemes: eventRow.common_themes ?? [],
    updatedAt: eventRow.updated_at,
  }
}

export function useSupabaseWorkshopState() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const saveTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const [state, setState] = useState<WorkshopState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [realtimeStatus, setRealtimeStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting")

  const fetchWorkshop = useCallback(
    async (showLoading = false) => {
      if (showLoading) {
        setIsLoading(true)
      }

      try {
        setError(null)

        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("*")
          .eq("slug", DEMO_EVENT_SLUG)
          .single()

        if (eventError) throw eventError

        const eventRow = eventData as EventRow

        const { data: groupData, error: groupError } = await supabase
          .from("workshop_groups")
          .select("*")
          .eq("event_id", eventRow.id)
          .order("name", { ascending: true })

        if (groupError) throw groupError

        const groupRows = (groupData ?? []) as GroupRow[]
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

        setState(mapRowsToState(eventRow, groupRows, responseRows, insightRows))
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
    [supabase]
  )

  useEffect(() => {
    void fetchWorkshop(true)

    const channel = supabase
      .channel("workshop-live-db-changes")
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
        { event: "*", schema: "public", table: "responses" },
        () => void fetchWorkshop(false)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "insight_cards" },
        () => void fetchWorkshop(false)
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeStatus("connected")
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setRealtimeStatus("disconnected")
        }
      })

    return () => {
      setRealtimeStatus("disconnected")
      void supabase.removeChannel(channel)
    }
  }, [fetchWorkshop, supabase])

  const updateGroupResponse = useCallback(
    (groupId: string, key: ResponseKey, value: string) => {
      const currentGroup = state?.groups.find((group) => group.id === groupId)

      if (!currentGroup?.dbId) {
        return
      }

      const responses = {
        ...currentGroup.responses,
        [key]: value,
      }

      const nextStatus =
        currentGroup.status === "Redo för sammanfattning"
          ? currentGroup.status
          : "Aktiv"

      const lastSavedAt = new Date().toISOString()
      const progress = calculateGroupProgress(responses, nextStatus)

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

      await createInsightCardFromData(groupId, buildInsightFromGroup(group), false)
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

      await supabase.from("events").delete().eq("slug", DEMO_EVENT_SLUG)

      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .insert({
          slug: DEMO_EVENT_SLUG,
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

        if (group.insights.length > 0) {
          const insightRows = group.insights.map((insight) => ({
            group_id: groupRow.id,
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
          }))

          const { error: insightError } = await supabase
            .from("insight_cards")
            .insert(insightRows)

          if (insightError) throw insightError
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
  }, [fetchWorkshop, supabase])

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