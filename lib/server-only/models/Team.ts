import { getDatabase } from "@/lib/server-only/mongodb"
import { ObjectId } from "mongodb"

export interface TeamInvitation {
  _id?: ObjectId
  projectId: ObjectId
  invitedBy: ObjectId
  invitedUser: ObjectId
  email: string
  role: "team_leader" | "member"
  status: "pending" | "accepted" | "declined"
  token: string
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface TimeEntry {
  _id?: ObjectId
  userId: ObjectId
  projectId: ObjectId
  taskId?: ObjectId
  description: string
  startTime: Date
  endTime?: Date
  duration: number // in minutes
  isApproved: boolean
  approvedBy?: ObjectId
  createdAt: Date
  updatedAt: Date
}

export interface Comment {
  _id?: ObjectId
  taskId: ObjectId
  userId: ObjectId
  content: string
  mentions: ObjectId[]
  parentId?: ObjectId // for threading
  attachments: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Notification {
  _id?: ObjectId
  userId: ObjectId
  type: "task_assigned" | "deadline_reminder" | "team_invitation" | "comment_mention" | "time_approval"
  title: string
  message: string
  data: any
  read: boolean
  emailSent: boolean
  createdAt: Date
}

export interface Team {
  _id?: ObjectId
  name: string
  createdBy: ObjectId
  projectId: ObjectId
  createdAt: Date
  updatedAt: Date
}

export class TeamInvitationModel {
  static async create(
    invitationData: Omit<TeamInvitation, "_id" | "createdAt" | "updatedAt">,
  ): Promise<TeamInvitation> {
    const db = await getDatabase()
    const now = new Date()

    const invitation: TeamInvitation = {
      ...invitationData,
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection("team_invitations").insertOne(invitation)
    return { ...invitation, _id: result.insertedId }
  }

  static async findByToken(token: string): Promise<TeamInvitation | null> {
    const db = await getDatabase()
    return (await db.collection("team_invitations").findOne({ token })) as TeamInvitation | null
  }

  static async findByProject(projectId: string): Promise<TeamInvitation[]> {
    const db = await getDatabase()
    return (await db
      .collection("team_invitations")
      .find({ projectId: new ObjectId(projectId) })
      .toArray()) as TeamInvitation[]
  }

  static async updateStatus(id: string, status: string): Promise<TeamInvitation | null> {
    const db = await getDatabase()
    const result = await db
      .collection("team_invitations")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { status, updatedAt: new Date() } },
        { returnDocument: "after" },
      )
    return result as TeamInvitation | null
  }
}

export class TimeEntryModel {
  static async create(timeEntryData: Omit<TimeEntry, "_id" | "createdAt" | "updatedAt">): Promise<TimeEntry> {
    const db = await getDatabase()
    const now = new Date()

    const timeEntry: TimeEntry = {
      ...timeEntryData,
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection("time_entries").insertOne(timeEntry)
    return { ...timeEntry, _id: result.insertedId }
  }

  static async findByUser(userId: string): Promise<TimeEntry[]> {
    const db = await getDatabase()
    return (await db
      .collection("time_entries")
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray()) as TimeEntry[]
  }

  static async findByProject(projectId: string): Promise<TimeEntry[]> {
    const db = await getDatabase()
    return (await db
      .collection("time_entries")
      .find({ projectId: new ObjectId(projectId) })
      .sort({ createdAt: -1 })
      .toArray()) as TimeEntry[]
  }

  static async updateById(id: string, updates: Partial<TimeEntry>): Promise<TimeEntry | null> {
    const db = await getDatabase()
    const result = await db
      .collection("time_entries")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...updates, updatedAt: new Date() } },
        { returnDocument: "after" },
      )
    return result as TimeEntry | null
  }
}

export class CommentModel {
  static async create(commentData: Omit<Comment, "_id" | "createdAt" | "updatedAt">): Promise<Comment> {
    const db = await getDatabase()
    const now = new Date()

    const comment: Comment = {
      ...commentData,
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection("comments").insertOne(comment)
    return { ...comment, _id: result.insertedId }
  }

  static async findByTask(taskId: string): Promise<Comment[]> {
    const db = await getDatabase()
    return (await db
      .collection("comments")
      .find({ taskId: new ObjectId(taskId) })
      .sort({ createdAt: 1 })
      .toArray()) as Comment[]
  }

  static async deleteById(id: string): Promise<boolean> {
    const db = await getDatabase()
    const result = await db.collection("comments").deleteOne({ _id: new ObjectId(id) })
    return result.deletedCount === 1
  }
}

export class NotificationModel {
  static async create(notificationData: Omit<Notification, "_id" | "createdAt">): Promise<Notification> {
    const db = await getDatabase()
    const now = new Date()

    const notification: Notification = {
      ...notificationData,
      createdAt: now,
    }

    const result = await db.collection("notifications").insertOne(notification)
    return { ...notification, _id: result.insertedId }
  }

  static async findByUser(userId: string, limit = 50): Promise<Notification[]> {
    const db = await getDatabase()
    return (await db
      .collection("notifications")
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()) as Notification[]
  }

  static async markAsRead(id: string): Promise<boolean> {
    const db = await getDatabase()
    const result = await db.collection("notifications").updateOne({ _id: new ObjectId(id) }, { $set: { read: true } })
    return result.modifiedCount === 1
  }

  static async getUnreadCount(userId: string): Promise<number> {
    const db = await getDatabase()
    return await db.collection("notifications").countDocuments({
      userId: new ObjectId(userId),
      read: false,
    })
  }
}

export const TeamModel = {
  async create(team: Omit<Team, "_id" | "createdAt" | "updatedAt">): Promise<Team> {
    const db = await getDatabase()
    const now = new Date()
    const result = await db.collection<Omit<Team, "_id">>("teams").insertOne({
      ...team,
      createdAt: now,
      updatedAt: now,
    })
    return { ...team, _id: result.insertedId, createdAt: now, updatedAt: now }
  },

  async findById(id: string): Promise<Team | null> {
    const db = await getDatabase()
    return db.collection<Team>("teams").findOne({ _id: new ObjectId(id) })
  },

  async searchByName(query: string): Promise<Team[]> {
    const db = await getDatabase()
    return db
      .collection<Team>("teams")
      .find({ name: { $regex: query, $options: "i" } })
      .limit(10)
      .toArray()
  },

  async updateById(id: string, updates: Partial<Team>): Promise<Team | null> {
    const db = await getDatabase()
    const result = await db
      .collection("teams")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...updates, updatedAt: new Date() } },
        { returnDocument: "after" },
      )
    return result as Team | null
  },
}
