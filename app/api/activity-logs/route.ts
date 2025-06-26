import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/server-only/auth"
import { ActivityLogModel } from "@/lib/server-only/models/ActivityLog"

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get("teamId")
    if (!teamId) {
      return NextResponse.json({ error: "Missing teamId" }, { status: 400 })
    }
    const userId = searchParams.get("userId")
    const type = searchParams.get("type")
    const activities = await ActivityLogModel.findRecentByTeam(teamId, undefined, 20, userId, type)
    return NextResponse.json({ activities })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 