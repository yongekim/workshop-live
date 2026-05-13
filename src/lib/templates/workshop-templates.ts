import type { WorkshopResponseConfig } from "@/types/workshop"

export type WorkshopTemplate = {
  id: string
  name: string
  description: string
  subtitle: string
  eventDescription: string
  commonThemes: string[]
  moderatorQuestions: string[]
  questions: WorkshopResponseConfig[]
  groups: {
    slug: string
    name: string
    accessCode: string
    topicTitle: string
    topicDescription: string
  }[]
}

const baseQuestions: WorkshopResponseConfig[] = [
  {
    key: "currentState",
    title: "1. Beskriv nuläget",
    description:
      "Hur fungerar detta idag från kundens, användarens och organisationens perspektiv?",
    placeholder:
      "Beskriv processen, parterna, ansvaret och vad som brukar hända i praktiken...",
    sortOrder: 1,
    isRequired: true,
  },
  {
    key: "friction",
    title: "2. Identifiera friktion",
    description:
      "Var går det långsamt, blir fel, skapar osäkerhet eller kräver manuell hantering?",
    placeholder:
      "Beskriv var friktionen uppstår, vem som påverkas och vad konsekvensen blir...",
    sortOrder: 2,
    isRequired: true,
  },
  {
    key: "improvements",
    title: "3. Föreslå förbättringar",
    description:
      "Vilka idéer skulle göra störst skillnad och vara möjliga att testa?",
    placeholder:
      "Skriv konkreta förbättringsförslag, möjliga ägare och nästa steg...",
    sortOrder: 3,
    isRequired: true,
  },
]

export const workshopTemplates: WorkshopTemplate[] = [
  {
    id: "business-travel",
    name: "Affärsresor och Travel Manager",
    subtitle: "Business Travel Insight Lab",
    description:
      "För leverantörer, resebyråer, Travel Managers och partners i affärsreseekosystemet.",
    eventDescription:
      "En AI-stödd workshop där leverantörer, resebyråer och partners identifierar friktion, möjligheter och konkreta förbättringar för Travel Managers och affärsresenärer.",
    commonThemes: [
      "Otydligt processägarskap",
      "Brist på gemensam validering",
      "Travel Manager saknar ibland enkel kontrollvy",
      "Skillnader mellan online och offline",
      "Behov av bättre uppföljning",
    ],
    moderatorQuestions: [
      "Vilken friktion påverkar Travel Manager mest?",
      "Vad kan standardiseras utan att ta bort flexibilitet?",
      "Vilken förbättring kan testas inom 60 dagar?",
      "Vem borde äga nästa steg?",
    ],
    questions: baseQuestions,
    groups: [
      {
        slug: "neg-rates",
        name: "Grupp 1",
        accessCode: "G1",
        topicTitle: "Laddning av avtalspriser / neg rates",
        topicDescription:
          "Hur kan resebyråer och leverantörer skapa en tydligare och mer verifierbar process för laddning, kontroll och uppföljning av kundunika avtalspriser?",
      },
      {
        slug: "travel-manager-control",
        name: "Grupp 2",
        accessCode: "G2",
        topicTitle: "Travel Managerns kontroll och uppföljning",
        topicDescription:
          "Hur kan Travel Manager enklare följa upp policy, avtalade priser, hållbarhetsmål och betalflöden?",
      },
      {
        slug: "online-offline",
        name: "Grupp 3",
        accessCode: "G3",
        topicTitle: "Bokningsflöde online och offline",
        topicDescription:
          "Var uppstår tapp i kvalitet, styrning eller kundupplevelse mellan agentbokning och självbokning?",
      },
      {
        slug: "policy-sustainability",
        name: "Grupp 4",
        accessCode: "G4",
        topicTitle: "Policy, hållbarhet och beteendestyrning",
        topicDescription:
          "Hur kan fler aktörer tillsammans göra det enklare för företag att styra resor enligt policy, hållbarhet och kostnadsmål?",
      },
    ],
  },
  {
    id: "process-improvement",
    name: "Processförbättring och samarbete",
    subtitle: "Process Improvement Lab",
    description:
      "För workshops där flera parter behöver förbättra ett gemensamt arbetssätt.",
    eventDescription:
      "En workshop där deltagarna kartlägger nuläge, friktion, ansvar och förbättringsidéer för en gemensam process.",
    commonThemes: [
      "Otydligt ansvar",
      "Manuella överlämningar",
      "Bristande uppföljning",
      "Systemglapp",
      "Behov av enklare styrning",
    ],
    moderatorQuestions: [
      "Var uppstår mest värdeförlust i processen?",
      "Vilken part påverkas mest av friktionen?",
      "Vad kan förenklas utan systemutveckling?",
      "Vad kan testas i liten skala först?",
    ],
    questions: [
      ...baseQuestions,
      {
        key: "ownership",
        title: "4. Ansvar och ägarskap",
        description:
          "Vem äger frågan idag och vem borde äga den framåt?",
        placeholder:
          "Beskriv ansvar, beslutsmandat, beroenden och möjliga ägare...",
        sortOrder: 4,
        isRequired: false,
      },
    ],
    groups: [
      {
        slug: "process-map",
        name: "Grupp 1",
        accessCode: "G1",
        topicTitle: "Processkarta och nuläge",
        topicDescription:
          "Kartlägg hur processen fungerar idag och vilka steg som skapar mest osäkerhet.",
      },
      {
        slug: "handover",
        name: "Grupp 2",
        accessCode: "G2",
        topicTitle: "Överlämningar och ansvar",
        topicDescription:
          "Identifiera var ansvar tappas eller blir otydligt mellan olika parter.",
      },
      {
        slug: "quick-wins",
        name: "Grupp 3",
        accessCode: "G3",
        topicTitle: "Quick wins",
        topicDescription:
          "Identifiera förbättringar som går att testa snabbt utan större systemprojekt.",
      },
    ],
  },
  {
    id: "customer-insight",
    name: "Kundinsiktsworkshop",
    subtitle: "Customer Insight Lab",
    description:
      "För workshops där deltagarna ska förstå kundens behov, friktion och önskad framtida upplevelse.",
    eventDescription:
      "En workshop där deltagarna analyserar kundens nuläge, behov, hinder och möjligheter till förbättrad kundupplevelse.",
    commonThemes: [
      "Kundens behov är otydliga",
      "Friktion i användarresan",
      "Brist på uppföljning",
      "Behov av enklare kommunikation",
    ],
    moderatorQuestions: [
      "Vad försöker kunden egentligen uppnå?",
      "Vilken friktion märks mest i kundens vardag?",
      "Vilken förbättring skulle kunden märka direkt?",
      "Hur kan effekten mätas?",
    ],
    questions: [
      ...baseQuestions,
      {
        key: "customerValue",
        title: "4. Kundvärde",
        description:
          "Vilket värde skapar förbättringen för kunden eller slutanvändaren?",
        placeholder:
          "Beskriv värde, effekt, mätbarhet och vilken målgrupp som påverkas...",
        sortOrder: 4,
        isRequired: false,
      },
    ],
    groups: [
      {
        slug: "customer-needs",
        name: "Grupp 1",
        accessCode: "G1",
        topicTitle: "Kundbehov",
        topicDescription:
          "Vilka behov, mål och förväntningar har kunden i detta område?",
      },
      {
        slug: "customer-friction",
        name: "Grupp 2",
        accessCode: "G2",
        topicTitle: "Kundfriktion",
        topicDescription:
          "Vilken friktion påverkar kundupplevelsen mest idag?",
      },
      {
        slug: "future-experience",
        name: "Grupp 3",
        accessCode: "G3",
        topicTitle: "Framtida upplevelse",
        topicDescription:
          "Hur skulle en bättre upplevelse se ut, och vad krävs för att nå dit?",
      },
    ],
  },
]

export function getTemplateById(templateId: string) {
  return workshopTemplates.find((template) => template.id === templateId)
}