import { NextResponse } from "next/server"

import { createStructuredAiResponse } from "@/lib/ai/openai"
import { formatGroupForAi, workshopSystemPrompt } from "@/lib/ai/workshop-prompts"
import type { AiInsightCardInput, WorkshopGroup } from "@/types/workshop"

const insightCardSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    problem: { type: "string" },
    consequence: { type: "string" },
    rootCause: { type: "string" },
    idea: { type: "string" },
    impact: {
      type: "string",
      enum: ["Låg", "Medel", "Hög"],
    },
    difficulty: {
      type: "string",
      enum: ["Låg", "Medel", "Hög"],
    },
    suggestedOwner: { type: "string" },
    nextStep: { type: "string" },
  },
  required: [
    "title",
    "problem",
    "consequence",
    "rootCause",
    "idea",
    "impact",
    "difficulty",
    "suggestedOwner",
    "nextStep",
  ],
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      group?: WorkshopGroup
    }

    if (!body.group) {
      return NextResponse.json({ error: "Saknar group." }, { status: 400 })
    }

    const card = await createStructuredAiResponse<AiInsightCardInput>({
      name: "workshop_insight_card",
      schema: insightCardSchema,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: workshopSystemPrompt(),
        },
        {
          role: "user",
          content: [
            "Skapa ett professionellt insiktskort från gruppens workshopinput.",
            "Kortet ska kunna användas direkt i moderatorvy och rapport.",
            "Var konkret och undvik generiska formuleringar.",
            "",
            formatGroupForAi(body.group),
          ].join("\n"),
        },
      ],
    })

    return NextResponse.json({ card })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Kunde inte skapa insiktskort."

    return NextResponse.json({ error: message }, { status: 500 })
  }
}