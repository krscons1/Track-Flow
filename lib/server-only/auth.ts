import * as jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { UserModel } from "@/lib/server-only/models/User"

// Validate JWT secret with proper type assertion
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error("Missing required environment variable: JWT_SECRET")
}

// Type assertion after validation
const VALIDATED_JWT_SECRET: string = JWT_SECRET

if (VALIDATED_JWT_SECRET.length < 32) {
  console.warn("JWT_SECRET should be at least 32 characters long for security")
}

export interface User {
  _id: string
  name: string
  email: string
  role: "admin" | "member"
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

export interface JWTPayload extends jwt.JwtPayload {
  userId: string
  email: string
  role: string
}

export async function hashPassword(password: string): Promise<string> {
  try {
    if (!password || password.length < 6) {
      throw new Error("Password must be at least 6 characters long")
    }
    return await bcrypt.hash(password, 12)
  } catch (error) {
    console.error("Password hashing error:", error)
    throw new Error("Failed to hash password")
  }
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    if (!password || !hashedPassword) {
      return false
    }
    return await bcrypt.compare(password, hashedPassword)
  } catch (error) {
    console.error("Password verification error:", error)
    return false
  }
}

export function generateToken(payload: Omit<JWTPayload, "iat" | "exp" | "iss" | "aud">): string {
  try {
    return jwt.sign(payload, VALIDATED_JWT_SECRET, {
      expiresIn: "7d",
      issuer: "trackflow",
      audience: "trackflow-users",
    })
  } catch (error) {
    console.error("Token generation error:", error)
    throw new Error("Failed to generate authentication token")
  }
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    if (!token) {
      return null
    }

    const decoded = jwt.verify(token, VALIDATED_JWT_SECRET, {
      issuer: "trackflow",
      audience: "trackflow-users",
    }) as JWTPayload

    return decoded
  } catch (error) {
    console.error("Token verification error:", error)
    return null
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return null
    }

    const payload = verifyToken(token)
    if (!payload || !payload.userId) {
      return null
    }

    // Fetch the actual user from the database
    const user = await UserModel.findById(payload.userId)
    if (!user) {
      console.warn(`User not found for token payload: ${payload.userId}`)
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

export async function setAuthCookie(token: string): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })
  } catch (error) {
    console.error("Set auth cookie error:", error)
    throw new Error("Failed to set authentication cookie")
  }
}

export async function removeAuthCookie(): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("auth-token")
  } catch (error) {
    console.error("Remove auth cookie error:", error)
    throw new Error("Failed to remove authentication cookie")
  }
}

export async function getServerSession(): Promise<User | null> {
  return await getCurrentUser()
}
