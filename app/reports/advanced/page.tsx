import { Suspense } from "react"
import { getServerSession } from "@/lib/server-only/auth"
import { redirect } from "next/navigation"
import AdvancedReportsContent from "@/components/reports/advanced-reports-content"
import MainLayout from "@/components/layout/main-layout"

export default async function AdvancedReportsPage() {
  const session = await getServerSession()

  if (!session) {
    redirect("/auth/login")
  }

  return (
    <MainLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <AdvancedReportsContent user={session.user} />
      </Suspense>
    </MainLayout>
  )
}
