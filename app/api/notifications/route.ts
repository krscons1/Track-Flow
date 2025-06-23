import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/server-only/auth"
import { NotificationModel } from "@/lib/server-only/models/Notification"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get("unreadOnly") === "1"
    let notifications = await NotificationModel.findByUserId(user._id)
    if (unreadOnly) {
      notifications = notifications.filter((n) => !n.read)
    }
    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("Get notifications error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const deletedCount = await NotificationModel.deleteAllByUserId(user._id)
    return NextResponse.json({ success: true, deletedCount })
  } catch (error) {
    console.error("Delete all notifications error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { markAllRead } = await request.json().catch(() => ({}))
    if (markAllRead) {
      const modifiedCount = await NotificationModel.markAllAsReadByUserId(user._id)
      return NextResponse.json({ success: true, modifiedCount })
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  } catch (error) {
    console.error("Mark all as read error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 