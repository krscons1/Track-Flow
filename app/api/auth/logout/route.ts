import { NextResponse } from "next/server"
import { removeAuthCookie } from "@/lib/server-only/auth"
import { UserModel } from "@/lib/server-only/models/User"
import { getCurrentUser } from "@/lib/server-only/auth"

export async function POST() {
  try {
    // Get current user
    const user = await getCurrentUser()
    if (user && user._id) {
      await UserModel.updateById(user._id.toString(), { lastLogout: new Date() })
    }
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
