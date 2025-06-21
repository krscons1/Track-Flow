"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatTimeAgo } from "@/lib/utils/date"

interface User {
  _id: string
  name: string
  email: string
}

interface Comment {
  _id: string
  content: string
  author: {
    _id: string
    name: string
    avatar?: string
  }
  createdAt: string
  mentions?: string[]
}

interface CommentSectionProps {
  taskId: string
  user: User
}

export default function CommentSection({ taskId, user }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadComments()
  }, [taskId])

  const loadComments = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`)
      const data = await response.json()
      if (response.ok) {
        setComments(data.comments)
      } else {
        throw new Error(data.error || "Failed to load comments")
      }
    } catch (error) {
      console.error("Failed to load comments:", error)
    }
  }

  const addComment = async () => {
    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      })
      const data = await response.json()

      if (response.ok) {
        setComments([...comments, data.comment])
        setNewComment("")
        toast({
          title: "Comment added",
          description: "Your comment has been posted successfully.",
        })
      } else {
        throw new Error(data.error || "Failed to add comment")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      addComment()
    }
  }

  return (
    <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comments List */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start a Conversation</h3>
              <p className="text-gray-500">Ask a question, share an update, or communicate an issue.</p>
            </div>
          ) : (
            comments.map((comment, index) => (
              <div
                key={comment._id}
                className="flex space-x-3 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={comment.author.avatar || "/placeholder.svg"} alt={comment.author.name} />
                  <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{comment.author.name}</span>
                      <span className="text-xs text-gray-500">{formatTimeAgo(new Date(comment.createdAt))}</span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Form */}
        <div className="border-t pt-4">
          <div className="flex space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarImage
                src={`https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face`}
                alt={user.name}
              />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="Add a comment... (Cmd/Ctrl + Enter to submit)"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyPress}
                className="focus-ring resize-none"
                rows={3}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">Use @ to mention team members</p>
                <Button
                  onClick={addComment}
                  disabled={!newComment.trim() || isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
