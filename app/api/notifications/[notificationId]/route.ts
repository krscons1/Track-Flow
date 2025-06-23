import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/server-only/auth"
import { NotificationModel } from "@/lib/server-only/models/Notification"

interface RouteParams {
  params: { notificationId: string }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const deleted = await NotificationModel.deleteById(params.notificationId, user._id)
    if (deleted) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Notification not found or not yours" }, { status: 404 })
    }
  } catch (error) {
    console.error("Delete notification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 