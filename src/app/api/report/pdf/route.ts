import { NextResponse } from "next/server"
import PDFDocument from "pdfkit"
import { createClient } from "@supabase/supabase-js"

import { DEFAULT_EVENT_SLUG } from "@/lib/workshop-state"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type EventRow = {
  id: string
  slug: string
  name: string
  subtitle: string | null
  description: string
  event_date: string | null
  status: string
}

type GroupRow = {
  id: string
  slug: string
  name: string
  access_code: string
  topic_title: string
  topic_description: string
  status: string
  participants: number
  progress: number
}

type QuestionRow = {
  id: string
  response_key: string
  title: string
  description: string
  placeholder: string
  sort_order: number
}

type ResponseRow = {
  group_id: string
  response_key: string
  content: string
}

type InsightRow = {
  id: string
  group_id: string
  title: string
  problem: string
  consequence: string
  root_cause: string
  idea: string
  impact: string
  difficulty: string
  suggested_owner: string
  next_step: string
  votes: number
  ai_generated: boolean
}

type ReportSnapshotRow = {
  report_json: {
    summary?: {
      executiveSummary?: string[]
      keyFindings?: string[]
      recommendedNextSteps?: {
        timeframe: string
        action: string
      }[]
    }
  } | null
}

const PAGE_MARGIN = 50
const CONTENT_WIDTH = 495

function requireEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`${name} saknas i miljövariabler.`)
  }

  return value
}

function safeText(value: unknown) {
  const text = String(value ?? "").trim()
  return text || "Ej ifyllt."
}

function createPdfBuffer(doc: PDFKit.PDFDocument) {
  const chunks: Buffer[] = []

  return new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    })

    doc.on("end", () => {
      resolve(Buffer.concat(chunks))
    })

    doc.on("error", reject)
  })
}

function ensureSpace(doc: PDFKit.PDFDocument, height: number) {
  const bottom = doc.page.height - PAGE_MARGIN

  if (doc.y + height > bottom) {
    doc.addPage()
  }
}

function addDivider(doc: PDFKit.PDFDocument) {
  ensureSpace(doc, 20)

  doc
    .moveTo(PAGE_MARGIN, doc.y)
    .lineTo(doc.page.width - PAGE_MARGIN, doc.y)
    .strokeColor("#e2e8f0")
    .lineWidth(1)
    .stroke()

  doc.moveDown(1)
}

function addSectionTitle(doc: PDFKit.PDFDocument, title: string) {
  ensureSpace(doc, 55)
  doc.moveDown(0.8)

  doc
    .font("Helvetica-Bold")
    .fontSize(17)
    .fillColor("#0f172a")
    .text(title, PAGE_MARGIN, doc.y, {
      width: CONTENT_WIDTH,
      lineGap: 3,
    })

  doc.moveDown(0.5)
}

function addSmallTitle(doc: PDFKit.PDFDocument, title: string) {
  ensureSpace(doc, 35)

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#0f172a")
    .text(title, PAGE_MARGIN, doc.y, {
      width: CONTENT_WIDTH,
    })

  doc.moveDown(0.25)
}

function addParagraph(doc: PDFKit.PDFDocument, text: string) {
  ensureSpace(doc, 50)

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#334155")
    .text(safeText(text), PAGE_MARGIN, doc.y, {
      width: CONTENT_WIDTH,
      lineGap: 4,
    })

  doc.moveDown(0.7)
}

function addBullet(doc: PDFKit.PDFDocument, text: string) {
  ensureSpace(doc, 24)

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#334155")
    .text(`• ${safeText(text)}`, PAGE_MARGIN + 10, doc.y, {
      width: CONTENT_WIDTH - 10,
      lineGap: 3,
    })

  doc.moveDown(0.35)
}

function addMetric(
  doc: PDFKit.PDFDocument,
  input: {
    x: number
    y: number
    value: string | number
    label: string
  }
) {
  doc
    .roundedRect(input.x, input.y, 115, 62, 14)
    .fillAndStroke("#f8fafc", "#e2e8f0")

  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor("#0f172a")
    .text(String(input.value), input.x + 14, input.y + 13, {
      width: 90,
    })

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#64748b")
    .text(input.label, input.x + 14, input.y + 39, {
      width: 90,
    })
}

function addPageHeader(doc: PDFKit.PDFDocument, eventName: string) {
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#64748b")
    .text(eventName, PAGE_MARGIN, 28, {
      width: 350,
    })

  doc
    .moveTo(PAGE_MARGIN, 44)
    .lineTo(doc.page.width - PAGE_MARGIN, 44)
    .strokeColor("#e2e8f0")
    .lineWidth(1)
    .stroke()

  doc.y = 64
}

function buildResponsesByGroup(
  groups: GroupRow[],
  questions: QuestionRow[],
  responses: ResponseRow[]
) {
  const map = new Map<string, Record<string, string>>()

  groups.forEach((group) => {
    const values: Record<string, string> = {}

    questions.forEach((question) => {
      values[question.response_key] = ""
    })

    responses
      .filter((response) => response.group_id === group.id)
      .forEach((response) => {
        values[response.response_key] = response.content
      })

    map.set(group.id, values)
  })

  return map
}

function buildInsightsByGroup(groups: GroupRow[], insights: InsightRow[]) {
  const map = new Map<string, InsightRow[]>()

  groups.forEach((group) => {
    map.set(
      group.id,
      insights
        .filter((insight) => insight.group_id === group.id)
        .sort((a, b) => b.votes - a.votes)
    )
  })

  return map
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const eventSlug = url.searchParams.get("event") || DEFAULT_EVENT_SLUG

    const supabase = createClient(
      requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    )

    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("id,slug,name,subtitle,description,event_date,status")
      .eq("slug", eventSlug)
      .single()

    if (eventError) throw eventError

    const event = eventData as EventRow

    const { data: groupData, error: groupError } = await supabase
      .from("workshop_groups")
      .select(
        "id,slug,name,access_code,topic_title,topic_description,status,participants,progress"
      )
      .eq("event_id", event.id)
      .order("name", { ascending: true })

    if (groupError) throw groupError

    const groups = (groupData ?? []) as GroupRow[]
    const groupIds = groups.map((group) => group.id)

    const { data: questionData, error: questionError } = await supabase
      .from("questions")
      .select("id,response_key,title,description,placeholder,sort_order")
      .eq("event_id", event.id)
      .order("sort_order", { ascending: true })

    if (questionError) throw questionError

    const questions = (questionData ?? []) as QuestionRow[]

    let responses: ResponseRow[] = []
    let insights: InsightRow[] = []

    if (groupIds.length > 0) {
      const { data: responseData, error: responseError } = await supabase
        .from("responses")
        .select("group_id,response_key,content")
        .in("group_id", groupIds)

      if (responseError) throw responseError

      responses = (responseData ?? []) as ResponseRow[]

      const { data: insightData, error: insightError } = await supabase
        .from("insight_cards")
        .select(
          "id,group_id,title,problem,consequence,root_cause,idea,impact,difficulty,suggested_owner,next_step,votes,ai_generated"
        )
        .in("group_id", groupIds)
        .order("votes", { ascending: false })

      if (insightError) throw insightError

      insights = (insightData ?? []) as InsightRow[]
    }

    const { count: participantCount } = await supabase
      .from("participants")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event.id)

    const { data: snapshotData } = await supabase
      .from("report_snapshots")
      .select("report_json")
      .eq("event_id", event.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    const snapshot = snapshotData as ReportSnapshotRow | null
    const summary = snapshot?.report_json?.summary ?? null

    const totalResponses = responses.filter(
      (response) => response.content.trim().length > 0
    ).length

    const totalVotes = insights.reduce(
      (total, insight) => total + insight.votes,
      0
    )

    const responsesByGroup = buildResponsesByGroup(groups, questions, responses)
    const insightsByGroup = buildInsightsByGroup(groups, insights)

    const doc = new PDFDocument({
      size: "A4",
      margin: PAGE_MARGIN,
      info: {
        Title: `Workshoprapport - ${event.name}`,
        Author: "Workshop Live",
        Subject: event.subtitle ?? "",
      },
    })

    let pageNumber = 1

    doc.on("pageAdded", () => {
      pageNumber += 1
      addPageHeader(doc, event.name)
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#94a3b8")
        .text(`Sida ${pageNumber}`, PAGE_MARGIN, 28, {
          width: CONTENT_WIDTH,
          align: "right",
        })
    })

    const bufferPromise = createPdfBuffer(doc)

    doc.rect(0, 0, doc.page.width, 190).fill("#0f172a")

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#67e8f9")
      .text("WORKSHOP LIVE REPORT", PAGE_MARGIN, 48, {
        characterSpacing: 1.2,
      })

    doc
      .font("Helvetica-Bold")
      .fontSize(28)
      .fillColor("#ffffff")
      .text(event.name, PAGE_MARGIN, 72, {
        width: CONTENT_WIDTH,
        lineGap: 4,
      })

    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#cbd5e1")
      .text(event.subtitle ?? "Workshoprapport", PAGE_MARGIN, 135, {
        width: CONTENT_WIDTH,
      })

    doc.y = 220

    addParagraph(doc, event.description)

    const metricsY = doc.y + 10
    addMetric(doc, {
      x: PAGE_MARGIN,
      y: metricsY,
      value: groups.length,
      label: "Grupper",
    })
    addMetric(doc, {
      x: PAGE_MARGIN + 125,
      y: metricsY,
      value: participantCount ?? 0,
      label: "Deltagare",
    })
    addMetric(doc, {
      x: PAGE_MARGIN + 250,
      y: metricsY,
      value: totalResponses,
      label: "Ifyllda svar",
    })
    addMetric(doc, {
      x: PAGE_MARGIN + 375,
      y: metricsY,
      value: totalVotes,
      label: "Röster",
    })

    doc.y = metricsY + 88

    addSectionTitle(doc, "Executive summary")

    const executiveSummary =
      summary?.executiveSummary && summary.executiveSummary.length > 0
        ? summary.executiveSummary
        : [
            "Rapporten sammanfattar grupparbetets viktigaste observationer, friktioner och förbättringsidéer.",
            "För en mer utvecklad AI-sammanfattning kan rapporten först genereras och sparas i rapportvyn, därefter inkluderas senaste sparade rapportversion som underlag i PDF-exporten.",
          ]

    executiveSummary.forEach((paragraph) => addParagraph(doc, paragraph))

    if (summary?.keyFindings?.length) {
      addSectionTitle(doc, "Nyckelinsikter")
      summary.keyFindings.forEach((finding) => addBullet(doc, finding))
    }

    addSectionTitle(doc, "Prioriterade förbättringsidéer")

    if (insights.length === 0) {
      addParagraph(doc, "Inga insiktskort har skapats ännu.")
    } else {
      insights
        .slice()
        .sort((a, b) => b.votes - a.votes)
        .forEach((insight, index) => {
          const group = groups.find((item) => item.id === insight.group_id)

          ensureSpace(doc, 120)

          doc
            .roundedRect(PAGE_MARGIN, doc.y, CONTENT_WIDTH, 104, 12)
            .fillAndStroke("#f8fafc", "#e2e8f0")

          const cardY = doc.y + 14

          doc
            .font("Helvetica-Bold")
            .fontSize(11)
            .fillColor("#0f172a")
            .text(`${index + 1}. ${insight.title}`, PAGE_MARGIN + 16, cardY, {
              width: CONTENT_WIDTH - 32,
            })

          doc
            .font("Helvetica")
            .fontSize(8)
            .fillColor("#64748b")
            .text(
              `${group?.name ?? "Okänd grupp"} · Effekt: ${insight.impact} · Svårighet: ${insight.difficulty} · Röster: ${insight.votes}`,
              PAGE_MARGIN + 16,
              cardY + 18,
              {
                width: CONTENT_WIDTH - 32,
              }
            )

          doc
            .font("Helvetica")
            .fontSize(9)
            .fillColor("#334155")
            .text(`Nästa steg: ${safeText(insight.next_step)}`, PAGE_MARGIN + 16, cardY + 42, {
              width: CONTENT_WIDTH - 32,
              lineGap: 3,
            })

          doc.y = cardY + 100
        })
    }

    addSectionTitle(doc, "Gruppsammanfattningar")

    groups.forEach((group) => {
      ensureSpace(doc, 160)

      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .fillColor("#0f172a")
        .text(`${group.name}: ${group.topic_title}`, PAGE_MARGIN, doc.y, {
          width: CONTENT_WIDTH,
        })

      doc.moveDown(0.2)

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#64748b")
        .text(
          `Kod: ${group.access_code} · Status: ${group.status} · Progress: ${group.progress}% · Deltagare: ${group.participants}`,
          PAGE_MARGIN,
          doc.y,
          {
            width: CONTENT_WIDTH,
          }
        )

      doc.moveDown(0.6)
      addParagraph(doc, group.topic_description)

      const groupResponses = responsesByGroup.get(group.id) ?? {}

      questions.forEach((question) => {
        addSmallTitle(doc, question.title)
        addParagraph(doc, groupResponses[question.response_key] || "Ej ifyllt.")
      })

      const groupInsights = insightsByGroup.get(group.id) ?? []

      if (groupInsights.length > 0) {
        addSmallTitle(doc, "Insiktskort")
        groupInsights.forEach((insight) => {
          addBullet(
            doc,
            `${insight.title}. Nästa steg: ${safeText(insight.next_step)}`
          )
        })
      }

      addDivider(doc)
    })

    if (summary?.recommendedNextSteps?.length) {
      addSectionTitle(doc, "Föreslagen uppföljning")

      summary.recommendedNextSteps.forEach((step) => {
        addSmallTitle(doc, step.timeframe)
        addParagraph(doc, step.action)
      })
    }

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#94a3b8")
      .text(
        `Genererad av Workshop Live · ${new Intl.DateTimeFormat("sv-SE", {
          dateStyle: "short",
          timeStyle: "short",
        }).format(new Date())}`,
        PAGE_MARGIN,
        doc.page.height - 38,
        {
          width: CONTENT_WIDTH,
          align: "center",
        }
      )

    doc.end()

    const buffer = await bufferPromise
    const filename = `workshoprapport-${event.slug}.pdf`

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Kunde inte skapa PDF."

    return NextResponse.json({ error: message }, { status: 500 })
  }
}