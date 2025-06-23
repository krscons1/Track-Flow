"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, Copy, Trash2, MessageSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Task {
  _id: string
  title: string
  description: string
  status: string
  priority: string
}

interface TaskActionsDropdownProps {
  task: Task
  onUpdate: () => void
}

export default function TaskActionsDropdown({ task, onUpdate }: TaskActionsDropdownProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [renameLoading, setRenameLoading] = useState(false)
  const [renameError, setRenameError] = useState("")
  const [newTitle, setNewTitle] = useState(task.title)
  const { toast } = useToast()

  const handleRename = async () => {
    setRenameLoading(true)
    setRenameError("")
    try {
      const response = await fetch(`/api/tasks/${task._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      })
      if (response.ok) {
        toast({ title: "Task renamed", description: "Task name updated successfully." })
        setShowRenameDialog(false)
        onUpdate()
      } else {
        const data = await response.json()
        setRenameError(data.error || "Failed to rename task")
      }
    } catch (error) {
      setRenameError("Failed to rename task")
    } finally {
      setRenameLoading(false)
    }
  }

  const handleAddComment = () => {
    // Navigate to task detail with comments section
    window.location.href = `/dashboard/projects/${task._id}/tasks/${task._id}#comments`
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/tasks/${task._id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Task deleted",
          description: "Task has been deleted successfully.",
        })
        onUpdate()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      })
    }
    setShowDeleteDialog(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open task actions menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setShowRenameDialog(true)}>
            <Copy className="h-4 w-4 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600 focus:text-red-600">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{task.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Dialog */}
      <AlertDialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename Task</AlertDialogTitle>
            <AlertDialogDescription>Enter a new name for this task.</AlertDialogDescription>
          </AlertDialogHeader>
          <input
            className="w-full border rounded px-3 py-2 mt-2"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            disabled={renameLoading}
            autoFocus
          />
          {renameError && <div className="text-red-500 text-sm mt-2">{renameError}</div>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={renameLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRename}
              disabled={renameLoading || !newTitle.trim() || newTitle === task.title}
            >
              {renameLoading ? "Renaming..." : "Rename"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
