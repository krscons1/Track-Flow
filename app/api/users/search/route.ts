import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/server-only/mongodb"
import { getCurrentUser } from "@/lib/server-only/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const users = await db
      .collection("users")
      .find({
        $and: [
          {
            $or: [{ name: { $regex: query, $options: "i" } }, { email: { $regex: query, $options: "i" } }],
          },
          { _id: { $ne: user._id } }, // Exclude current user
        ],
      })
      .limit(10)
      .toArray()

    const sanitizedUsers = users.map((u) => ({
      _id: u._id.toString(),
      name: u.name,
      email: u.email,
    }))

    return NextResponse.json({ users: sanitizedUsers })
  } catch (error) {
    console.error("User search error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 