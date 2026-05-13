import type { WorkshopGroup } from "@/types/workshop"

export function formatGroupForAi(group: WorkshopGroup) {
  const responseLines = Object.entries(group.responses).map(([key, value]) => {
    return `${key}: ${value || "Ej ifyllt"}`
  })

  return [
    `Grupp: ${group.name}`,
    `Ämne: ${group.topicTitle}`,
    `Ämnesbeskrivning: ${group.topicDescription}`,
    "",
    "Gruppens svar:",
    ...responseLines,
  ].join("\n")
}

export function workshopSystemPrompt() {
  return [
    "Du är en senior workshopfacilitator och affärsutvecklingsspecialist.",
    "Du hjälper grupper att analysera processer, kundbehov, ansvar, friktion, förbättringsidéer och nästa steg.",
    "Fokus är konkret nytta, tydligt ägarskap, genomförbarhet och uppföljning.",
    "Svara på svenska.",
    "Var konkret, professionell och användbar.",
    "Hitta inte på specifika fakta om företag, system eller avtal som inte finns i inputen.",
    "Undvik känsliga kundnamn, priser och affärshemligheter.",
  ].join(" ")
}