import { type NextRequest, NextResponse } from "next/server"
import { TeamModel } from "@/lib/server-only/models/Team"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    if (!query || query.trim().length < 1) {
      return NextResponse.json({ teams: [] })
    }
    const teams = await TeamModel.searchByName(query)
    return NextResponse.json({ teams })
  } catch (error) {
    console.error("Team search error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 