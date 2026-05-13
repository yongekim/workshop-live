import { NextResponse } from "next/server"

const COOKIES = [
  "workshop_admin_auth",
  "workshop_moderator_auth",
  "workshop_event_auth",
]

export async function POST() {
  const response = NextResponse.json({ ok: true })

  COOKIES.forEach((cookieName) => {
    response.cookies.set(cookieName, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    })
  })

  return response
}