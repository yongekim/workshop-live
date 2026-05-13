import type {
  InsightCard,
  ResponseKey,
  WorkshopGroup,
  WorkshopResponseConfig,
  WorkshopState,
} from "@/types/workshop"

export const DEFAULT_EVENT_SLUG = "affarsresans-ekosystem"

export const responseConfigs: WorkshopResponseConfig[] = [
  {
    key: "currentState",
    title: "1. Beskriv nuläget",
    description:
      "Hur fungerar detta idag från kundens, resebyråns och leverantörens perspektiv?",
    placeholder:
      "Beskriv hur processen fungerar idag, vilka parter som är inblandade och vad som brukar hända i praktiken...",
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
      "Vilka idéer skulle göra störst skillnad för Travel Manager, resenärer, resebyråer och leverantörer?",
    placeholder:
      "Skriv konkreta förbättringsförslag, möjliga ägare och nästa steg...",
    sortOrder: 3,
    isRequired: true,
  },
]

export const workshopEvent = {
  slug: DEFAULT_EVENT_SLUG,
  name: "Affärsresans ekosystem",
  subtitle: "Business Travel Insight Lab",
  date: "Demo-event",
  status: "active" as const,
  description:
    "En AI-stödd workshop där leverantörer och resebyråer tillsammans identifierar friktion, möjligheter och konkreta förbättringar för Travel Managers och affärsresenärer.",
}

export const moderatorQuestions = [
  "Vem borde äga verifieringen av att ett kundunikt avtal är korrekt laddat?",
  "Vilken friktion påverkar Travel Manager mest: pris, policy, betalning, uppföljning eller support?",
  "Vad kan standardiseras mellan resebyråer och leverantörer utan att ta bort flexibilitet?",
  "Vilken förbättring skulle vara enklast att testa med en pilotkund inom 60 dagar?",
]

export const commonThemes = [
  "Otydligt processägarskap",
  "Brist på gemensam validering",
  "Skillnader mellan hotell, flyg och tåg",
  "Travel Manager saknar ibland enkel kontrollvy",
  "Behov av tydligare uppföljning och ansvarsfördelning",
]

function createInsightCard(
  groupId: string,
  overrides: Partial<InsightCard>
): InsightCard {
  return {
    id: `insight-${groupId}-${Math.random().toString(36).slice(2, 10)}`,
    groupId,
    title: "Ny insikt",
    problem: "",
    consequence: "",
    rootCause: "",
    idea: "",
    impact: "Medel",
    difficulty: "Medel",
    suggestedOwner: "Leverantör + resebyrå",
    nextStep: "",
    votes: 0,
    createdAt: new Date().toISOString(),
    aiGenerated: false,
    ...overrides,
  }
}

export const initialGroups: WorkshopGroup[] = [
  {
    id: "neg-rates",
    name: "Grupp 1",
    accessCode: "G1",
    topicTitle: "Laddning av avtalspriser / neg rates",
    topicDescription:
      "Hur kan resebyråer och leverantörer skapa en tydligare, mer verifierbar och mindre personberoende process för laddning, kontroll och uppföljning av kundunika avtalspriser?",
    status: "Aktiv",
    participants: 5,
    progress: 68,
    responses: {
      currentState:
        "Processen skiljer sig mellan hotell, flyg och tåg. För hotell kan Travel Manager ibland själv initiera laddningsinstruktioner, medan flyg och tåg ofta kräver mer supportinblandning.",
      friction:
        "Det är inte alltid tydligt vem som äger kontrollen av att rätt pris faktiskt är laddat, synligt och bokningsbart i rätt kanal.",
      improvements:
        "Skapa en gemensam valideringschecklista som kan användas före avtalsstart och vid större förändringar.",
    },
    insights: [
      createInsightCard("neg-rates", {
        id: "insight-neg-rates-checklist",
        title: "Gemensam valideringschecklista",
        problem:
          "Det saknas en gemensam miniminivå för hur laddade avtalade priser kontrolleras.",
        consequence:
          "Risk för fel pris, mer support och lägre förtroende hos Travel Manager.",
        rootCause:
          "Olika aktörer arbetar med olika instruktioner, roller och kontrollpunkter.",
        idea:
          "Ta fram en enkel checklista som kan användas av leverantör, resebyrå och Travel Manager före avtalsstart.",
        impact: "Hög",
        difficulty: "Medel",
        suggestedOwner: "Leverantörer + resebyråer",
        nextStep:
          "Ta fram ett första utkast och testa med en pilotkund och två leverantörer.",
        votes: 3,
      }),
    ],
  },
  {
    id: "travel-manager-control",
    name: "Grupp 2",
    accessCode: "G2",
    topicTitle: "Travel Managerns kontroll och uppföljning",
    topicDescription:
      "Hur kan Travel Manager enklare följa upp att policy, avtalade priser, hållbarhetsmål och betalflöden fungerar i praktiken?",
    status: "Aktiv",
    participants: 4,
    progress: 52,
    responses: {
      currentState:
        "Travel Manager får ofta uppföljning i efterhand, men saknar ibland tydlig realtidskontroll över om rätt avtal och rätt betalflöde används vid bokning.",
      friction:
        "Uppföljning kräver ofta flera rapporter eller kontaktpunkter. Det är inte alltid enkelt att veta om felet ligger hos byrå, leverantör, betalflöde eller bokningskanal.",
      improvements:
        "Skapa en tydligare kontrollvy där Travel Manager kan se avtalstrohet, policyavvikelser och betalflöde på en mer samlad nivå.",
    },
    insights: [],
  },
  {
    id: "online-offline",
    name: "Grupp 3",
    accessCode: "G3",
    topicTitle: "Bokningsflöde online och offline",
    topicDescription:
      "Vilka skillnader finns mellan agentbokning via telefon/mail och självbokning online, och var uppstår tapp i kvalitet, styrning eller kundupplevelse?",
    status: "Inte startad",
    participants: 0,
    progress: 10,
    responses: {
      currentState: "",
      friction: "",
      improvements: "",
    },
    insights: [],
  },
  {
    id: "policy-sustainability",
    name: "Grupp 4",
    accessCode: "G4",
    topicTitle: "Policy, hållbarhet och beteendestyrning",
    topicDescription:
      "Hur kan leverantörer, resebyråer och betallösningar tillsammans göra det enklare för företagskunder att styra resor enligt policy, hållbarhet och kostnadsmål?",
    status: "Redo för sammanfattning",
    participants: 5,
    progress: 86,
    responses: {
      currentState:
        "Policy, hållbarhetsval och kostnadsmål syns inte alltid tillräckligt tydligt i bokningsögonblicket.",
      friction:
        "Resenären får ibland för lite vägledning i själva bokningsflödet och Travel Manager får arbeta mer med uppföljning i efterhand.",
      improvements:
        "Visualisera hållbara alternativ, policyinformation och kostnadseffekt tydligare i bokningsflödet.",
    },
    insights: [
      createInsightCard("policy-sustainability", {
        id: "insight-policy-guidance",
        title: "Policy som vägledning, inte hinder",
        problem:
          "Policy upplevs ofta som kontroll i efterhand snarare än stöd i bokningsögonblicket.",
        consequence:
          "Resenärer kan göra val som avviker från policy utan att förstå konsekvensen.",
        rootCause:
          "Policyinformation är inte alltid tillräckligt integrerad eller pedagogiskt presenterad i bokningsflödet.",
        idea:
          "Kartlägg var i bokningsflödet resenären behöver guidning snarare än efterhandskontroll.",
        impact: "Medel",
        difficulty: "Medel",
        suggestedOwner: "Resebyrå + leverantörer",
        nextStep:
          "Välj ett bokningsscenario och testa hur policyinformation kan presenteras tydligare.",
        votes: 2,
      }),
    ],
  },
]

export function createInitialWorkshopState(): WorkshopState {
  return {
    event: workshopEvent,
    groups: initialGroups,
    questions: responseConfigs,
    moderatorQuestions,
    commonThemes,
    updatedAt: new Date().toISOString(),
  }
}

export function calculateGroupProgress(
  responses: Record<ResponseKey, string>,
  status: WorkshopGroup["status"],
  totalQuestions?: number
) {
  const questionCount = Math.max(totalQuestions ?? Object.keys(responses).length, 1)
  const filledResponses = Object.values(responses).filter(
    (value) => value.trim().length > 0
  ).length

  let progress = 10 + Math.round((filledResponses / questionCount) * 70)

  if (responses.improvements?.trim().length > 0) {
    progress += 10
  }

  if (status === "Redo för sammanfattning") {
    progress = 100
  }

  return Math.min(100, Math.max(0, progress))
}