import { getCurrentUser } from "@/lib/server-only/auth"
import { redirect } from "next/navigation"
import CalendarContent from "@/components/calendar/calendar-content"

export default async function CalendarPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <CalendarContent user={user} />
    </div>
  )
}
