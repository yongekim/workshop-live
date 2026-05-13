export type WorkshopGroup = {
  id: string
  name: string
  accessCode: string
  topicTitle: string
  topicDescription: string
  status: "Inte startad" | "Aktiv" | "Redo för sammanfattning"
  participants: number
  progress: number
  responses: {
    label: string
    content: string
  }[]
  insights: {
    title: string
    impact: "Låg" | "Medel" | "Hög"
    difficulty: "Låg" | "Medel" | "Hög"
    nextStep: string
  }[]
}

export const workshopEvent = {
  name: "Affärsresans ekosystem",
  subtitle: "Business Travel Insight Lab",
  date: "Demo-event",
  description:
    "En AI-stödd workshop där leverantörer och resebyråer tillsammans identifierar friktion, möjligheter och konkreta förbättringar för Travel Managers och affärsresenärer.",
}

export const workshopGroups: WorkshopGroup[] = [
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
    responses: [
      {
        label: "Nuläge",
        content:
          "Processen skiljer sig mellan hotell, flyg och tåg. För hotell kan Travel Manager ibland själv initiera laddningsinstruktioner, medan flyg och tåg ofta kräver mer supportinblandning.",
      },
      {
        label: "Friktion",
        content:
          "Det är inte alltid tydligt vem som äger kontrollen av att rätt pris faktiskt är laddat, synligt och bokningsbart i rätt kanal.",
      },
    ],
    insights: [
      {
        title: "Gemensam valideringschecklista",
        impact: "Hög",
        difficulty: "Medel",
        nextStep:
          "Ta fram en enkel checklista som kan användas av leverantör, resebyrå och Travel Manager före avtalsstart.",
      },
      {
        title: "Tydligare processägarskap",
        impact: "Hög",
        difficulty: "Medel",
        nextStep:
          "Definiera vem som ansvarar för instruktion, laddning, verifiering och uppföljning.",
      },
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
    responses: [
      {
        label: "Nuläge",
        content:
          "Travel Manager får ofta uppföljning i efterhand, men saknar ibland tydlig realtidskontroll över om rätt avtal och rätt betalflöde används vid bokning.",
      },
    ],
    insights: [
      {
        title: "Bättre kontrollvy för avtalsanvändning",
        impact: "Hög",
        difficulty: "Hög",
        nextStep:
          "Identifiera vilken minsta datamängd Travel Manager behöver för att följa upp avtalstrohet.",
      },
    ],
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
    responses: [],
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
    responses: [
      {
        label: "Möjlighet",
        content:
          "Om hållbara alternativ, policyinformation och kostnadseffekt visualiseras tydligare i bokningsflödet kan resenären fatta bättre beslut utan extra administration.",
      },
    ],
    insights: [
      {
        title: "Policy som vägledning, inte hinder",
        impact: "Medel",
        difficulty: "Medel",
        nextStep:
          "Kartlägg var i bokningsflödet resenären behöver guidning snarare än efterhandskontroll.",
      },
    ],
  },
]

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

export function getGroupById(groupId: string) {
  return workshopGroups.find((group) => group.id === groupId)
}