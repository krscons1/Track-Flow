import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/server-only/auth"
import { getDatabase } from "@/lib/server-only/mongodb"
import { ObjectId } from "mongodb"

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const contributions = await db
      .collection("tasks")
      .aggregate([
        { $match: { project: new ObjectId(params.id) } },
        {
          $lookup: {
            from: "timelogs",
            localField: "_id",
            foreignField: "taskId",
            as: "timelogs",
          },
        },
        { $unwind: "$timelogs" },
        {
          $group: {
            _id: "$timelogs.userId",
            totalHours: { $sum: "$timelogs.hours" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        { $unwind: "$userDetails" },
        {
          $project: {
            _id: 0,
            userId: "$_id",
            userName: "$userDetails.name",
            totalHours: 1,
          },
        },
      ])
      .toArray()

    return NextResponse.json({ contributions })
  } catch (error) {
    console.error("Get project contributions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 