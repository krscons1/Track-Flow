import { getDatabase } from "@/lib/server-only/mongodb"
import { ObjectId } from "mongodb"

export interface User {
  _id?: ObjectId
  name: string
  email: string
  password: string
  role: "admin" | "member"
  teamRole?: "team_leader" | "member"
  avatar?: string
  projects: ObjectId[]
  notificationPreferences: {
    email: boolean
    inApp: boolean
    deadlineReminders: boolean
    taskAssignments: boolean
    mentions: boolean
  }
  lastActive: Date
  lastLogin?: Date
  lastLogout?: Date
  createdAt: Date
  updatedAt: Date
}

export class UserModel {
  static async create(userData: Omit<User, "_id" | "createdAt" | "updatedAt">): Promise<User> {
    try {
      console.log("🔄 Creating new user...")

      // Validate input data
      if (!userData.name || !userData.email || !userData.password) {
        throw new Error("Missing required user data")
      }

      if (!userData.email.includes("@")) {
        throw new Error("Invalid email format")
      }

      const db = await getDatabase()
      const now = new Date()

      const user: User = {
        ...userData,
        email: userData.email.toLowerCase().trim(),
        name: userData.name.trim(),
        projects: userData.projects || [],
        notificationPreferences: userData.notificationPreferences || {
          email: true,
          inApp: true,
          deadlineReminders: true,
          taskAssignments: true,
          mentions: true,
        },
        lastActive: now,
        createdAt: now,
        updatedAt: now,
      }

      const result = await db.collection("users").insertOne(user)

      if (!result.insertedId) {
        throw new Error("Failed to create user")
      }

      console.log("✅ User created successfully:", result.insertedId)
      return { ...user, _id: result.insertedId }
    } catch (error) {
      console.error("❌ User creation error:", error)
      throw error
    }
  }

  static async findByEmail(email: string): Promise<User | null> {
    try {
      console.log("🔄 Finding user by email:", email)

      if (!email) {
        return null
      }

      const db = await getDatabase()
      console.log("✅ Database connection established for user search")

      const user = (await db.collection("users").findOne({
        email: email.toLowerCase().trim(),
      })) as User | null

      console.log("✅ User search completed, found:", !!user)
      return user
    } catch (error) {
      console.error("❌ Find user by email error:", error)
      throw new Error(`Failed to find user by email: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  static async findById(id: string): Promise<User | null> {
    try {
      if (!id || !ObjectId.isValid(id)) {
        return null
      }

      const db = await getDatabase()
      const user = (await db.collection("users").findOne({
        _id: new ObjectId(id),
      })) as User | null

      return user
    } catch (error) {
      console.error("❌ Find user by ID error:", error)
      throw new Error(`Failed to find user by ID: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  static async findAll(): Promise<User[]> {
    try {
      const db = await getDatabase()
      const users = (await db.collection("users").find({}).toArray()) as User[]
      return users
    } catch (error) {
      console.error("❌ Find all users error:", error)
      throw new Error(`Failed to find users: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  static async searchUsers(query: string, limit = 10): Promise<User[]> {
    try {
      const db = await getDatabase()
      const users = (await db
        .collection("users")
        .find({
          $or: [{ name: { $regex: query, $options: "i" } }, { email: { $regex: query, $options: "i" } }],
        })
        .limit(limit)
        .toArray()) as User[]
      return users
    } catch (error) {
      console.error("❌ Search users error:", error)
      throw new Error(`Failed to search users: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  static async updateById(id: string, updates: Partial<User>): Promise<User | null> {
    try {
      if (!id || !ObjectId.isValid(id)) {
        throw new Error("Invalid user ID")
      }

      const db = await getDatabase()
      const result = await db
        .collection("users")
        .findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: { ...updates, updatedAt: new Date() } },
          { returnDocument: "after" },
        )

      return result as User | null
    } catch (error) {
      console.error("❌ Update user error:", error)
      throw new Error(`Failed to update user: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  static async updateLastActive(id: string): Promise<void> {
    try {
      if (!id || !ObjectId.isValid(id)) {
        return
      }

      const db = await getDatabase()
      await db.collection("users").updateOne({ _id: new ObjectId(id) }, { $set: { lastActive: new Date() } })
    } catch (error) {
      console.error("❌ Update last active error:", error)
    }
  }

  static async deleteById(id: string): Promise<boolean> {
    try {
      if (!id || !ObjectId.isValid(id)) {
        return false
      }

      const db = await getDatabase()
      const result = await db.collection("users").deleteOne({ _id: new ObjectId(id) })
      return result.deletedCount === 1
    } catch (error) {
      console.error("❌ Delete user error:", error)
      throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  static async findManyByIds(ids: string[]): Promise<User[]> {
    try {
      if (!ids || ids.length === 0) return [];
      const objectIds = ids.filter(id => id && id.length === 24).map(id => new ObjectId(id));
      if (objectIds.length === 0) return [];
      const db = await getDatabase();
      const users = (await db.collection("users").find({ _id: { $in: objectIds } }).toArray()) as User[];
      return users;
    } catch (error) {
      console.error("❌ Find many users by IDs error:", error);
      throw new Error(`Failed to find users by IDs: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}
