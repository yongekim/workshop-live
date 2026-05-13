"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import {
  calculateGroupProgress,
  createInitialWorkshopState,
} from "@/lib/workshop-state"
import type {
  InsightCard,
  ResponseKey,
  WorkshopGroup,
  WorkshopState,
} from "@/types/workshop"

const STORAGE_KEY = "workshop-live-local-state-v1"
const STORAGE_EVENT = "workshop-live-local-state-updated"

function safeParseState(value: string | null): WorkshopState | null {
  if (!value) return null

  try {
    const parsed = JSON.parse(value) as WorkshopState

    if (!parsed.groups || !Array.isArray(parsed.groups)) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function loadStateFromStorage(): WorkshopState {
  if (typeof window === "undefined") {
    return createInitialWorkshopState()
  }

  const stored = safeParseState(window.localStorage.getItem(STORAGE_KEY))

  if (stored) {
    return stored
  }

  const initialState = createInitialWorkshopState()
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState))

  return initialState
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

function buildInsightFromGroup(group: WorkshopGroup): InsightCard {
  const currentState = group.responses.currentState.trim()
  const friction = group.responses.friction.trim()
  const improvements = group.responses.improvements.trim()

  const title = createTitleFromText(
    improvements || friction || group.topicTitle,
    `Insikt från ${group.name}`
  )

  return {
    id: `insight-${group.id}-${Date.now()}`,
    groupId: group.id,
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
    votes: 0,
    createdAt: new Date().toISOString(),
    aiGenerated: false,
  }
}

export function useLocalWorkshopState() {
  const [state, setState] = useState<WorkshopState | null>(null)

  useEffect(() => {
    setState(loadStateFromStorage())

    function handleStorageUpdate() {
      setState(loadStateFromStorage())
    }

    window.addEventListener("storage", handleStorageUpdate)
    window.addEventListener(STORAGE_EVENT, handleStorageUpdate)

    return () => {
      window.removeEventListener("storage", handleStorageUpdate)
      window.removeEventListener(STORAGE_EVENT, handleStorageUpdate)
    }
  }, [])

  const persistState = useCallback(
    (updater: WorkshopState | ((current: WorkshopState) => WorkshopState)) => {
      setState((current) => {
        const base = current ?? loadStateFromStorage()
        const next =
          typeof updater === "function"
            ? (updater as (current: WorkshopState) => WorkshopState)(base)
            : updater

        const stamped = {
          ...next,
          updatedAt: new Date().toISOString(),
        }

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stamped))
        window.dispatchEvent(new Event(STORAGE_EVENT))

        return stamped
      })
    },
    []
  )

  const updateGroupResponse = useCallback(
    (groupId: string, key: ResponseKey, value: string) => {
      persistState((current) => ({
        ...current,
        groups: current.groups.map((group) => {
          if (group.id !== groupId) return group

          const responses = {
            ...group.responses,
            [key]: value,
          }

          const nextStatus =
            group.status === "Redo för sammanfattning" ? group.status : "Aktiv"

          return {
            ...group,
            responses,
            status: nextStatus,
            progress: calculateGroupProgress(responses, nextStatus),
            lastSavedAt: new Date().toISOString(),
          }
        }),
      }))
    },
    [persistState]
  )

  const markGroupReady = useCallback(
    (groupId: string) => {
      persistState((current) => ({
        ...current,
        groups: current.groups.map((group) => {
          if (group.id !== groupId) return group

          return {
            ...group,
            status: "Redo för sammanfattning",
            progress: 100,
            readyAt: new Date().toISOString(),
            lastSavedAt: new Date().toISOString(),
          }
        }),
      }))
    },
    [persistState]
  )

  const createInsightFromGroup = useCallback(
    (groupId: string) => {
      persistState((current) => ({
        ...current,
        groups: current.groups.map((group) => {
          if (group.id !== groupId) return group

          const insight = buildInsightFromGroup(group)

          return {
            ...group,
            insights: [insight, ...group.insights],
            progress: Math.max(group.progress, 82),
            lastSavedAt: new Date().toISOString(),
          }
        }),
      }))
    },
    [persistState]
  )

  const voteForInsight = useCallback(
    (groupId: string, insightId: string) => {
      persistState((current) => ({
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
      }))
    },
    [persistState]
  )

  const resetWorkshop = useCallback(() => {
    const initialState = createInitialWorkshopState()
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState))
    window.dispatchEvent(new Event(STORAGE_EVENT))
    setState(initialState)
  }, [])

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
    updateGroupResponse,
    markGroupReady,
    createInsightFromGroup,
    voteForInsight,
    resetWorkshop,
  }
}