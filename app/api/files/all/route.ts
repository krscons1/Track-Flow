import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/server-only/mongodb"

export async function GET() {
  const db = await getDatabase()
  const files = await db.collection("files").find({}).toArray()
  return NextResponse.json({ files })
} 