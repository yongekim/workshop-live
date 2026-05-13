import { NextResponse } from "next/server"

type AccessMode = "admin" | "moderator" | "event"

const COOKIE_BY_MODE: Record<AccessMode, string> = {
  admin: "workshop_admin_auth",
  moderator: "workshop_moderator_auth",
  event: "workshop_event_auth",
}

function getExpectedCode(mode: AccessMode) {
  if (mode === "admin") return process.env.ADMIN_PASSWORD
  if (mode === "moderator") return process.env.MODERATOR_PASSWORD
  return process.env.EVENT_ACCESS_CODE
}

function isValidMode(value: unknown): value is AccessMode {
  return value === "admin" || value === "moderator" || value === "event"
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      mode?: unknown
      code?: unknown
    }

    if (!isValidMode(body.mode)) {
      return NextResponse.json(
        { error: "Ogiltigt accessläge." },
        { status: 400 }
      )
    }

    const providedCode = String(body.code ?? "")
    const expectedCode = getExpectedCode(body.mode)

    if (!expectedCode) {
      return NextResponse.json(
        {
          error:
            "Accesskod saknas i miljövariablerna. Kontrollera .env.local eller Vercel Environment Variables.",
        },
        { status: 500 }
      )
    }

    if (providedCode !== expectedCode) {
      return NextResponse.json({ error: "Fel kod." }, { status: 401 })
    }

    const response = NextResponse.json({ ok: true })

    response.cookies.set(COOKIE_BY_MODE[body.mode], "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 10,
    })

    return response
  } catch {
    return NextResponse.json(
      { error: "Kunde inte logga in." },
      { status: 500 }
    )
  }
}