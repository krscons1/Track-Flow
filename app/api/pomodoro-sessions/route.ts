import { NextRequest, NextResponse } from "next/server"
import { PomodoroSessionModel } from "@/lib/models/PomodoroSession"

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    // TODO: Add authentication and validation
    const session = await PomodoroSessionModel.create(data)
    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    const sessions = await PomodoroSessionModel.findByUser(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    )
    return NextResponse.json(sessions)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
} 