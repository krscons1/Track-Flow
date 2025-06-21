import { getCurrentUser } from "@/lib/server-only/auth"
import { redirect } from "next/navigation"
import CreateProjectForm from "@/components/projects/create-project-form"

export default async function NewProjectPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Create New Project 🚀
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Set up a new project and start collaborating with your team</p>
        </div>
        <CreateProjectForm user={user} />
      </div>
    </div>
  )
}
