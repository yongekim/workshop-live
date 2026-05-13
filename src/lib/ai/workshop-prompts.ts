import type { WorkshopGroup } from "@/types/workshop"

export function formatGroupForAi(group: WorkshopGroup) {
  return [
    `Grupp: ${group.name}`,
    `Ämne: ${group.topicTitle}`,
    `Ämnesbeskrivning: ${group.topicDescription}`,
    "",
    "Gruppens svar:",
    `Nuläge: ${group.responses.currentState || "Ej ifyllt"}`,
    `Friktion: ${group.responses.friction || "Ej ifyllt"}`,
    `Förbättringar: ${group.responses.improvements || "Ej ifyllt"}`,
  ].join("\n")
}

export function workshopSystemPrompt() {
  return [
    "Du är en senior workshopfacilitator och affärsreseexpert.",
    "Du hjälper leverantörer, resebyråer, betalpartners och hotell/flyg/tåg-aktörer att analysera affärsreseprocesser.",
    "Fokus är kundnytta för Travel Manager, kostnadskontroll, policy compliance, hållbarhet, säkerhet, datakvalitet, bokningsflöden och uppföljning.",
    "Svara på svenska.",
    "Var konkret, professionell och användbar.",
    "Hitta inte på specifika fakta om företag, system eller avtal som inte finns i inputen.",
    "Undvik känsliga kundnamn, priser och affärshemligheter.",
  ].join(" ")
}