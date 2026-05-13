import { NextResponse } from "next/server"

import { createStructuredAiResponse } from "@/lib/ai/openai"
import { workshopSystemPrompt } from "@/lib/ai/workshop-prompts"
import type { ModeratorAnalysis, WorkshopGroup } from "@/types/workshop"

const moderatorAnalysisSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    themes: {
      type: "array",
      items: { type: "string" },
    },
    tensions: {
      type: "array",
      items: { type: "string" },
    },
    moderatorQuestions: {
      type: "array",
      items: { type: "string" },
    },
    quickWins: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["themes", "tensions", "moderatorQuestions", "quickWins"],
}

function formatGroups(groups: WorkshopGroup[]) {
  return groups
    .map((group) =>
      [
        `Grupp: ${group.name}`,
        `Ämne: ${group.topicTitle}`,
        `Status: ${group.status}`,
        `Nuläge: ${group.responses.currentState || "Ej ifyllt"}`,
        `Friktion: ${group.responses.friction || "Ej ifyllt"}`,
        `Förbättringar: ${group.responses.improvements || "Ej ifyllt"}`,
        `Insiktskort: ${group.insights.map((card) => card.title).join(", ") || "Inga"}`,
      ].join("\n")
    )
    .join("\n\n---\n\n")
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      groups?: WorkshopGroup[]
    }

    if (!body.groups || body.groups.length === 0) {
      return NextResponse.json({ error: "Saknar grupper." }, { status: 400 })
    }

    const analysis = await createStructuredAiResponse<ModeratorAnalysis>({
      name: "moderator_analysis",
      schema: moderatorAnalysisSchema,
      temperature: 0.25,
      messages: [
        {
          role: "system",
          content: workshopSystemPrompt(),
        },
        {
          role: "user",
          content: [
            "Analysera workshopens grupper för moderatorn.",
            "Returnera återkommande teman, möjliga spänningar/skillnader, följdfrågor att ställa live och quick wins.",
            "Följdfrågorna ska vara formulerade så moderatorn kan läsa upp dem i rummet.",
            "",
            formatGroups(body.groups),
          ].join("\n"),
        },
      ],
    })

    return NextResponse.json({ analysis })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Kunde inte skapa moderatoranalys."

    return NextResponse.json({ error: message }, { status: 500 })
  }
}