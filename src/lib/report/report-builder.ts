import type {
  ReportAction,
  ReportAiSummary,
  WorkshopGroup,
  WorkshopState,
} from "@/types/workshop"

export function getTotalResponses(groups: WorkshopGroup[]) {
  return groups.reduce((total, group) => {
    return (
      total +
      Object.values(group.responses).filter((value) => value.trim().length > 0)
        .length
    )
  }, 0)
}

export function getTotalVotes(groups: WorkshopGroup[]) {
  return groups.reduce((total, group) => {
    return (
      total +
      group.insights.reduce((groupTotal, insight) => groupTotal + insight.votes, 0)
    )
  }, 0)
}

export function buildReportActions(groups: WorkshopGroup[]): ReportAction[] {
  return groups
    .flatMap((group) =>
      group.insights.map((insight) => ({
        priority: 0,
        title: insight.title,
        sourceGroup: group.name,
        impact: insight.impact,
        difficulty: insight.difficulty,
        suggestedOwner: insight.suggestedOwner,
        nextStep: insight.nextStep,
        votes: insight.votes,
      }))
    )
    .sort((a, b) => {
      if (b.votes !== a.votes) return b.votes - a.votes

      const impactScore = { Hög: 3, Medel: 2, Låg: 1 }
      return impactScore[b.impact] - impactScore[a.impact]
    })
    .map((action, index) => ({
      ...action,
      priority: index + 1,
    }))
}

export function buildReportMarkdown({
  state,
  groups,
  summary,
}: {
  state: WorkshopState
  groups: WorkshopGroup[]
  summary: ReportAiSummary | null
}) {
  const actions = buildReportActions(groups)
  const totalResponses = getTotalResponses(groups)
  const totalVotes = getTotalVotes(groups)

  const executiveSummary =
    summary?.executiveSummary.length
      ? summary.executiveSummary
      : [
          "Workshopen visar att flera aktörer i affärsreseekosystemet delar liknande utmaningar kring ansvarsfördelning, avtalade priser, kontrollmöjligheter och uppföljning.",
          "Ett återkommande tema är behovet av tydligare processer mellan leverantör, resebyrå och Travel Manager.",
        ]

  const nextSteps =
    summary?.recommendedNextSteps.length
      ? summary.recommendedNextSteps
      : [
          {
            timeframe: "30 dagar",
            action:
              "Sammanställa processkarta och bekräfta prioriterade områden.",
          },
          {
            timeframe: "60 dagar",
            action:
              "Testa en konkret förbättring med utvalda parter och eventuell pilotkund.",
          },
          {
            timeframe: "90 dagar",
            action:
              "Utvärdera effekt och besluta om nästa gemensamma initiativ.",
          },
        ]

  const lines = [
    `# Workshoprapport: ${state.event.name}`,
    "",
    `**Underrubrik:** ${state.event.subtitle}`,
    "",
    state.event.description,
    "",
    "## Sammanfattning i siffror",
    "",
    `- Workshopgrupper: ${groups.length}`,
    `- Ifyllda svar: ${totalResponses}`,
    `- Insiktskort: ${actions.length}`,
    `- Röster: ${totalVotes}`,
    "",
    "## Executive summary",
    "",
    ...executiveSummary.flatMap((paragraph) => [paragraph, ""]),
    "## Gemensamma teman",
    "",
    ...state.commonThemes.map((theme) => `- ${theme}`),
    "",
  ]

  if (summary?.keyFindings.length) {
    lines.push("## AI-genererade nyckelinsikter", "")
    lines.push(...summary.keyFindings.map((finding) => `- ${finding}`), "")
  }

  lines.push("## Gruppsammanfattningar", "")

  groups.forEach((group) => {
    lines.push(`### ${group.name}: ${group.topicTitle}`, "")
    lines.push(`**Status:** ${group.status}`)
    lines.push("")
    lines.push("**Nuläge**")
    lines.push("")
    lines.push(group.responses.currentState || "Ej ifyllt.")
    lines.push("")
    lines.push("**Friktion**")
    lines.push("")
    lines.push(group.responses.friction || "Ej ifyllt.")
    lines.push("")
    lines.push("**Förbättringar**")
    lines.push("")
    lines.push(group.responses.improvements || "Ej ifyllt.")
    lines.push("")
  })

  lines.push("## Prioriterade förbättringsidéer", "")

  if (actions.length === 0) {
    lines.push("Inga insiktskort har skapats ännu.", "")
  } else {
    actions.forEach((action) => {
      lines.push(`### ${action.priority}. ${action.title}`, "")
      lines.push(`- Källa: ${action.sourceGroup}`)
      lines.push(`- Röster: ${action.votes}`)
      lines.push(`- Effekt: ${action.impact}`)
      lines.push(`- Svårighet: ${action.difficulty}`)
      lines.push(`- Möjlig ägare: ${action.suggestedOwner}`)
      lines.push(`- Nästa steg: ${action.nextStep}`)
      lines.push("")
    })
  }

  lines.push("## Föreslagen uppföljning", "")

  nextSteps.forEach((step) => {
    lines.push(`### ${step.timeframe}`, "")
    lines.push(step.action)
    lines.push("")
  })

  lines.push("## Bilaga: rådata per grupp", "")

  groups.forEach((group) => {
    lines.push(`### ${group.name}`, "")
    lines.push(`Ämne: ${group.topicTitle}`)
    lines.push("")
    lines.push(`Beskrivning: ${group.topicDescription}`)
    lines.push("")
    lines.push(`Antal insiktskort: ${group.insights.length}`)
    lines.push("")
  })

  return lines.join("\n")
}

export function buildActionsCsv(actions: ReportAction[]) {
  const headers = [
    "Prioritet",
    "Titel",
    "Grupp",
    "Effekt",
    "Svårighet",
    "Möjlig ägare",
    "Nästa steg",
    "Röster",
  ]

  const rows = actions.map((action) => [
    action.priority,
    action.title,
    action.sourceGroup,
    action.impact,
    action.difficulty,
    action.suggestedOwner,
    action.nextStep,
    action.votes,
  ])

  return [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "")
          return `"${value.replace(/"/g, '""')}"`
        })
        .join(",")
    )
    .join("\n")
}

export function downloadTextFile({
  filename,
  content,
  mimeType,
}: {
  filename: string
  content: string
  mimeType: string
}) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()

  link.remove()
  URL.revokeObjectURL(url)
}

export function buildParticipantsCsv(
  participants: {
    name: string
    company: string
    email: string
    groupName: string
    joinedAt: string
  }[]
) {
  const headers = ["Namn", "Företag", "E-post", "Grupp", "Registrerad"]

  const rows = participants.map((participant) => [
    participant.name,
    participant.company,
    participant.email,
    participant.groupName,
    participant.joinedAt,
  ])

  return [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "")
          return `"${value.replace(/"/g, '""')}"`
        })
        .join(",")
    )
    .join("\n")
}