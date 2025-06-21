import { getCurrentUser } from "@/lib/server-only/auth"
import { redirect } from "next/navigation"
import CreateTaskForm from "@/components/tasks/create-task-form"

export default async function NewTaskPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Create New Task ✅
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Add a new task to keep your projects moving forward</p>
        </div>
        <CreateTaskForm user={user} />
      </div>
    </div>
  )
}
