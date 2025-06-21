import { formatDistanceToNow, format, isToday, isTomorrow, isYesterday } from "date-fns"

export function formatTimeAgo(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return formatDistanceToNow(dateObj, { addSuffix: true })
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date

  if (isToday(dateObj)) {
    return "Today"
  }

  if (isTomorrow(dateObj)) {
    return "Tomorrow"
  }

  if (isYesterday(dateObj)) {
    return "Yesterday"
  }

  return format(dateObj, "MMM d, yyyy")
}

export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return format(dateObj, "MMM d, yyyy 'at' h:mm a")
}
