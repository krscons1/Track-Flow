import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    const { pathname } = request.nextUrl

    const isAuthPage = pathname.startsWith("/auth")
    const isApiAuthRoute = pathname.startsWith("/api/auth")
    const isRootPage = pathname === "/"
    const isPublicFile =
      pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.startsWith("/public")

    // Allow public files and API auth routes
    if (isPublicFile || isApiAuthRoute) {
      return NextResponse.next()
    }

    // Handle root page
    if (isRootPage) {
      if (token && isValidTokenFormat(token)) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      } else {
        return NextResponse.redirect(new URL("/auth/login", request.url))
      }
    }

    // Handle auth pages
    if (isAuthPage) {
      if (token && isValidTokenFormat(token)) {
        // Redirect authenticated users away from auth pages
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
      return NextResponse.next()
    }

    // Protect all other routes
    if (!token || !isValidTokenFormat(token)) {
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }

    return NextResponse.next()
  } catch (error) {
    console.error("Middleware error:", error)
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }
}

function isValidTokenFormat(token: string): boolean {
  try {
    // Basic JWT structure validation (header.payload.signature)
    const parts = token.split(".")
    if (parts.length !== 3) {
      return false
    }

    // Check if parts are base64 encoded
    for (const part of parts) {
      if (!part || part.length === 0) {
        return false
      }
    }

    return true
  } catch {
    return false
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}
