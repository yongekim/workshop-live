import { NextResponse } from "next/server"

import { createStructuredAiResponse } from "@/lib/ai/openai"
import { workshopSystemPrompt } from "@/lib/ai/workshop-prompts"
import type { ReportAiSummary, WorkshopGroup } from "@/types/workshop"

const reportSummarySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    executiveSummary: {
      type: "array",
      items: { type: "string" },
    },
    keyFindings: {
      type: "array",
      items: { type: "string" },
    },
    recommendedNextSteps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          timeframe: { type: "string" },
          action: { type: "string" },
        },
        required: ["timeframe", "action"],
      },
    },
  },
  required: ["executiveSummary", "keyFindings", "recommendedNextSteps"],
}

function formatGroups(groups: WorkshopGroup[]) {
  return groups
    .map((group) =>
      [
        `Grupp: ${group.name}`,
        `Ämne: ${group.topicTitle}`,
        `Nuläge: ${group.responses.currentState || "Ej ifyllt"}`,
        `Friktion: ${group.responses.friction || "Ej ifyllt"}`,
        `Förbättringar: ${group.responses.improvements || "Ej ifyllt"}`,
        "Insiktskort:",
        group.insights.length > 0
          ? group.insights
              .map(
                (card) =>
                  `- ${card.title}; Effekt: ${card.impact}; Svårighet: ${card.difficulty}; Nästa steg: ${card.nextStep}`
              )
              .join("\n")
          : "Inga insiktskort",
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

    const summary = await createStructuredAiResponse<ReportAiSummary>({
      name: "workshop_report_summary",
      schema: reportSummarySchema,
      temperature: 0.25,
      messages: [
        {
          role: "system",
          content: workshopSystemPrompt(),
        },
        {
          role: "user",
          content: [
            "Skapa ett professionellt rapportunderlag från workshopdata.",
            "Executive summary ska vara neutral, affärsmässig och möjlig att skicka vidare.",
            "Key findings ska vara konkreta insikter.",
            "Recommended next steps ska gärna innehålla 30 dagar, 60 dagar och 90 dagar om det passar.",
            "",
            formatGroups(body.groups),
          ].join("\n"),
        },
      ],
    })

    return NextResponse.json({ summary })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Kunde inte skapa rapportanalys."

    return NextResponse.json({ error: message }, { status: 500 })
  }
}