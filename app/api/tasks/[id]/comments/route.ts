import { type NextRequest, NextResponse } from "next/server"
import { CommentModel } from "@/lib/server-only/models/Comment"
import { getCurrentUser } from "@/lib/server-only/auth"
import { ObjectId } from "mongodb"

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const comments = await CommentModel.findByTaskId(params.id)
    const sanitizedComments = comments.map((comment) => ({
      ...comment,
      _id: comment._id.toString(),
      author: {
        ...comment.author,
        _id: comment.author._id.toString(),
      },
    }))

    return NextResponse.json({ comments: sanitizedComments })
  } catch (error) {
    console.error("Get comments error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const { content } = data

    if (!content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const comment = await CommentModel.create({
      content,
      taskId: new ObjectId(params.id),
      userId: new ObjectId(user._id),
    })

    // We need to fetch the comment with the author details
    const newComment = (await CommentModel.findByTaskId(params.id)).find(
      (c) => c._id.toString() === comment._id?.toString(),
    )

    const sanitizedComment = {
      ...newComment,
      _id: newComment._id.toString(),
      author: {
        ...newComment.author,
        _id: newComment.author._id.toString(),
      },
    }

    return NextResponse.json({ comment: sanitizedComment }, { status: 201 })
  } catch (error) {
    console.error("Create comment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 