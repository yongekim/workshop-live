import { NextResponse, type NextRequest } from "next/server"

const ADMIN_COOKIE = "workshop_admin_auth"
const MODERATOR_COOKIE = "workshop_moderator_auth"
const EVENT_COOKIE = "workshop_event_auth"

function hasCookie(request: NextRequest, cookieName: string) {
  return request.cookies.get(cookieName)?.value === "true"
}

function redirectToAccess({
  request,
  mode,
}: {
  request: NextRequest
  mode: "admin" | "moderator" | "event"
}) {
  const url = request.nextUrl.clone()

  url.pathname = "/access"
  url.searchParams.set("mode", mode)
  url.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`
  )

  return NextResponse.redirect(url)
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const isAdmin = hasCookie(request, ADMIN_COOKIE)
  const isModerator = hasCookie(request, MODERATOR_COOKIE)
  const isEventParticipant = hasCookie(request, EVENT_COOKIE)

  const eventCodeEnabled = Boolean(process.env.EVENT_ACCESS_CODE)

  if (pathname.startsWith("/admin") || pathname.startsWith("/event-check")) {
    if (!isAdmin) {
      return redirectToAccess({ request, mode: "admin" })
    }
  }

  if (
    pathname.startsWith("/moderator") ||
    pathname.startsWith("/report") ||
    pathname.startsWith("/present")
  ) {
    if (!isAdmin && !isModerator) {
      return redirectToAccess({ request, mode: "moderator" })
    }
  }

  if (
    eventCodeEnabled &&
    (pathname === "/join" || pathname.startsWith("/group"))
  ) {
    if (!isAdmin && !isModerator && !isEventParticipant) {
      return redirectToAccess({ request, mode: "event" })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/event-check/:path*",
    "/moderator/:path*",
    "/report/:path*",
    "/present/:path*",
    "/join",
    "/group/:path*",
  ],
}