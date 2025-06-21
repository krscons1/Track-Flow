import { NextResponse } from "next/server"
import { removeAuthCookie } from "@/lib/server-only/auth"

export async function POST() {
  try {
    await removeAuthCookie()
    return NextResponse.json({ message: "Logout successful" })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : undefined,
      },
      { status: 500 },
    )
  }
}
