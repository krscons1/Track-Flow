export function autoUpdateProjectStatus(progress: number, currentStatus: string): string {
  if (progress === 100 && currentStatus !== "completed") {
    return "completed"
  }
  if (progress > 0 && progress < 100 && currentStatus === "not-started") {
    return "in-progress"
  }
  return currentStatus
}

export function recalculateDueDate(tasks: any[]): Date | null {
  if (tasks.length === 0) return null

  const latestDueDate = tasks.reduce((latest, task) => {
    const taskDueDate = new Date(task.dueDate)
    return taskDueDate > latest ? taskDueDate : latest
  }, new Date(0))

  return latestDueDate
}

export function calculateProjectProgress(tasks: any[]): number {
  if (tasks.length === 0) return 0

  const completedTasks = tasks.filter((task) => task.status === "completed")
  return Math.round((completedTasks.length / tasks.length) * 100)
}
