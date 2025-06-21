import { cookies } from "next/headers"

// Only import these on server side
let jwt: typeof import("jsonwebtoken")
let bcrypt: typeof import("bcryptjs")
let UserModel: typeof import("@/lib/models/User").UserModel

// Dynamic imports to ensure server-side only
const getServerModules = async () => {
  if (typeof window !== "undefined") {
    throw new Error("Auth utilities should only be used on server side")
  }

  if (!jwt) {
    jwt = await import("jsonwebtoken")
  }
  if (!bcrypt) {
    bcrypt = await import("bcryptjs")
  }
  if (!UserModel) {
    const userModule = await import("@/lib/models/User")
    UserModel = userModule.UserModel
  }

  return { jwt, bcrypt, UserModel }
}

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-for-development"

export interface User {
  _id: string
  name: string
  email: string
  role: "admin" | "member"
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

export interface JWTPayload {
  userId: string
  email: string
  role: string
}

export async function hashPassword(password: string): Promise<string> {
  const { bcrypt } = await getServerModules()
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const { bcrypt } = await getServerModules()
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(payload: JWTPayload): string {
  if (typeof window !== "undefined") {
    throw new Error("Token generation should only happen on server side")
  }

  // Use require for server-side only
  const jwt = require("jsonwebtoken")
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyToken(token: string): JWTPayload | null {
  if (typeof window !== "undefined") {
    throw new Error("Token verification should only happen on server side")
  }

  try {
    const jwt = require("jsonwebtoken")
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<User | null> {
  if (typeof window !== "undefined") {
    throw new Error("getCurrentUser should only be called on server side")
  }

  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return null
    }

    const payload = verifyToken(token)
    if (!payload) {
      return null
    }

    // Fetch the actual user from the database
    const { UserModel } = await getServerModules()
    const user = await UserModel.findById(payload.userId)
    if (!user) {
      return null
    }

    return {
      _id: user._id!.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  } catch (error) {
    console.error("Get current user error:", error)
    return null
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })
}

export async function removeAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete("auth-token")
}
