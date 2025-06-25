// Only import MongoDB on server side
let getDatabase: typeof import("@/lib/mongodb").getDatabase
let ObjectId: typeof import("mongodb").ObjectId

const getServerModules = async () => {
  if (typeof window !== "undefined") {
    throw new Error("PomodoroSession model should only be used on server side")
  }

  if (!getDatabase) {
    const mongoModule = await import("@/lib/mongodb")
    getDatabase = mongoModule.getDatabase
  }
  if (!ObjectId) {
    const mongodbModule = await import("mongodb")
    ObjectId = mongodbModule.ObjectId
  }

  return { getDatabase, ObjectId }
}

export interface PomodoroSession {
  _id?: import("mongodb").ObjectId
  userId: import("mongodb").ObjectId
  startTime: Date
  endTime: Date
  type: "focus" | "break"
  status: "completed" | "skipped"
  projectId?: import("mongodb").ObjectId
  taskId?: import("mongodb").ObjectId
  createdAt: Date
  updatedAt: Date
}

export class PomodoroSessionModel {
  static async create(sessionData: Omit<PomodoroSession, "_id" | "createdAt" | "updatedAt">): Promise<PomodoroSession> {
    const { getDatabase } = await getServerModules()
    const db = await getDatabase()
    const now = new Date()

    const session: PomodoroSession = {
      ...sessionData,
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection("pomodoroSessions").insertOne(session)
    return { ...session, _id: result.insertedId }
  }

  static async findByUser(userId: string, startDate?: Date, endDate?: Date): Promise<PomodoroSession[]> {
    const { getDatabase, ObjectId } = await getServerModules()
    const db = await getDatabase()
    const query: any = { userId: new ObjectId(userId) }
    if (startDate || endDate) {
      query.startTime = {}
      if (startDate) query.startTime.$gte = startDate
      if (endDate) query.startTime.$lte = endDate
    }
    return (await db.collection("pomodoroSessions").find(query).toArray()) as PomodoroSession[]
  }

  static async findById(id: string): Promise<PomodoroSession | null> {
    const { getDatabase, ObjectId } = await getServerModules()
    const db = await getDatabase()
    return (await db.collection("pomodoroSessions").findOne({ _id: new ObjectId(id) })) as PomodoroSession | null
  }

  static async updateById(id: string, updates: Partial<PomodoroSession>): Promise<PomodoroSession | null> {
    const { getDatabase, ObjectId } = await getServerModules()
    const db = await getDatabase()
    const result = await db
      .collection("pomodoroSessions")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...updates, updatedAt: new Date() } },
        { returnDocument: "after" },
      )
    return result as PomodoroSession | null
  }

  static async deleteById(id: string): Promise<boolean> {
    const { getDatabase, ObjectId } = await getServerModules()
    const db = await getDatabase()
    const result = await db.collection("pomodoroSessions").deleteOne({ _id: new ObjectId(id) })
    return result.deletedCount === 1
  }
} 