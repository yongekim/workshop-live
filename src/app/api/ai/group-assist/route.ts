import { NextResponse } from "next/server"

import { createStructuredAiResponse } from "@/lib/ai/openai"
import { formatGroupForAi, workshopSystemPrompt } from "@/lib/ai/workshop-prompts"
import type { WorkshopGroup } from "@/types/workshop"

type GroupAssistAction = "deepen" | "concrete" | "travelManager"

const groupAssistSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    suggestion: { type: "string" },
  },
  required: ["title", "suggestion"],
}

function actionInstruction(action: GroupAssistAction) {
  if (action === "deepen") {
    return [
      "Skapa ett kort men vasst stöd till gruppen som hjälper dem fördjupa resonemanget.",
      "Returnera 4–6 följdfrågor.",
      "Frågorna ska hjälpa gruppen att hitta ansvar, rotorsak, konsekvens och konkret förbättring.",
    ].join(" ")
  }

  if (action === "concrete") {
    return [
      "Hjälp gruppen göra sina tankar mer konkreta.",
      "Omvandla inputen till praktiska punkter: exakt problem, påverkad part, föreslagen åtgärd, möjlig ägare och första test inom 30–60 dagar.",
    ].join(" ")
  }

  return [
    "Analysera gruppens input ur Travel Manager-perspektiv.",
    "Fokusera på policy compliance, kostnadskontroll, avtalstrohet, hållbarhet, resenärsupplevelse, säkerhet och uppföljning.",
  ].join(" ")
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: GroupAssistAction
      group?: WorkshopGroup
    }

    if (!body.group || !body.action) {
      return NextResponse.json(
        { error: "Saknar group eller action." },
        { status: 400 }
      )
    }

    const result = await createStructuredAiResponse<{
      title: string
      suggestion: string
    }>({
      name: "group_assist_response",
      schema: groupAssistSchema,
      messages: [
        {
          role: "system",
          content: workshopSystemPrompt(),
        },
        {
          role: "user",
          content: [
            actionInstruction(body.action),
            "",
            formatGroupForAi(body.group),
            "",
            "Skriv på svenska. Var konkret. Använd gärna punktlista i suggestion.",
          ].join("\n"),
        },
      ],
    })

    return NextResponse.json(result)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Kunde inte skapa AI-förslag."

    return NextResponse.json({ error: message }, { status: 500 })
  }
}