"use client"

export type ParticipantProfile = {
  sessionId: string
  name: string
  company: string
  email: string
}

const STORAGE_KEY = "workshop-live-participant-profile"

function createSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `participant-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function getParticipantProfile(): ParticipantProfile | null {
  if (typeof window === "undefined") return null

  const value = window.localStorage.getItem(STORAGE_KEY)

  if (!value) return null

  try {
    const parsed = JSON.parse(value) as ParticipantProfile

    if (!parsed.sessionId || !parsed.name || !parsed.company || !parsed.email) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function saveParticipantProfile(input: {
  name: string
  company: string
  email: string
}) {
  const existing = getParticipantProfile()

  const profile: ParticipantProfile = {
    sessionId: existing?.sessionId ?? createSessionId(),
    name: input.name.trim(),
    company: input.company.trim(),
    email: input.email.trim(),
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))

  return profile
}

export function clearParticipantProfile() {
  if (typeof window === "undefined") return

  window.localStorage.removeItem(STORAGE_KEY)
}