// Only import MongoDB on server side
let getDatabase: typeof import("@/lib/mongodb").getDatabase
let ObjectId: typeof import("mongodb").ObjectId

const getServerModules = async () => {
  if (typeof window !== "undefined") {
    throw new Error("User model should only be used on server side")
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

export interface User {
  _id?: import("mongodb").ObjectId
  name: string
  email: string
  password: string
  role: "admin" | "member"
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

export class UserModel {
  static async create(userData: Omit<User, "_id" | "createdAt" | "updatedAt">): Promise<User> {
    const { getDatabase } = await getServerModules()
    const db = await getDatabase()
    const now = new Date()

    const user: User = {
      ...userData,
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection("users").insertOne(user)
    return { ...user, _id: result.insertedId }
  }

  static async findByEmail(email: string): Promise<User | null> {
    const { getDatabase } = await getServerModules()
    const db = await getDatabase()
    return (await db.collection("users").findOne({ email })) as User | null
  }

  static async findById(id: string): Promise<User | null> {
    const { getDatabase, ObjectId } = await getServerModules()
    const db = await getDatabase()
    return (await db.collection("users").findOne({ _id: new ObjectId(id) })) as User | null
  }

  static async findAll(): Promise<User[]> {
    const { getDatabase } = await getServerModules()
    const db = await getDatabase()
    return (await db.collection("users").find({}).toArray()) as User[]
  }

  static async updateById(id: string, updates: Partial<User>): Promise<User | null> {
    const { getDatabase, ObjectId } = await getServerModules()
    const db = await getDatabase()
    const result = await db
      .collection("users")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...updates, updatedAt: new Date() } },
        { returnDocument: "after" },
      )
    return result as User | null
  }

  static async deleteById(id: string): Promise<boolean> {
    const { getDatabase, ObjectId } = await getServerModules()
    const db = await getDatabase()
    const result = await db.collection("users").deleteOne({ _id: new ObjectId(id) })
    return result.deletedCount === 1
  }
}
