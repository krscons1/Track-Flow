import { getDatabase } from "@/lib/server-only/mongodb"
import { ObjectId } from "mongodb"

export interface Comment {
  _id?: ObjectId
  content: string
  userId: ObjectId
  taskId: ObjectId
  createdAt: Date
}

export class CommentModel {
  static async create(commentData: Omit<Comment, "_id" | "createdAt">): Promise<Comment> {
    const db = await getDatabase()
    const now = new Date()

    const comment: Comment = {
      ...commentData,
      createdAt: now,
    }

    const result = await db.collection("comments").insertOne(comment)
    return { ...comment, _id: result.insertedId }
  }

  static async findByTaskId(taskId: string): Promise<any[]> {
    const db = await getDatabase()
    return await db
      .collection("comments")
      .aggregate([
        { $match: { taskId: new ObjectId(taskId) } },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "author",
          },
        },
        { $unwind: "$author" },
        {
          $project: {
            content: 1,
            createdAt: 1,
            "author._id": 1,
            "author.name": 1,
            "author.avatar": 1,
          },
        },
      ])
      .toArray()
  }
} 