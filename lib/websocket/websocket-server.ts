import { Server as SocketIOServer, type Socket } from "socket.io"
import type { Server as HTTPServer } from "http"
import jwt from "jsonwebtoken"
import { UserModel } from "@/lib/server-only/models/User"

interface AuthenticatedSocket extends Socket {
  userId?: string
  user?: any
}

export class WebSocketServer {
  private io: SocketIOServer
  private connectedUsers: Map<string, string> = new Map() // userId -> socketId

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
      },
    })

    this.setupMiddleware()
    this.setupEventHandlers()
  }

  private setupMiddleware() {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token
        if (!token) {
          return next(new Error("Authentication error"))
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
        const user = await UserModel.findById(decoded.userId)

        if (!user) {
          return next(new Error("User not found"))
        }

        socket.userId = user._id!.toString()
        socket.user = user
        next()
      } catch (error) {
        next(new Error("Authentication error"))
      }
    })
  }

  private setupEventHandlers() {
    this.io.on("connection", (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.user?.name} connected`)

      if (socket.userId) {
        this.connectedUsers.set(socket.userId, socket.id)

        // Join user to their project rooms
        if (socket.user?.projects) {
          socket.user.projects.forEach((projectId: string) => {
            socket.join(`project:${projectId}`)
          })
        }

        // Update user's last active status
        UserModel.updateLastActive(socket.userId)
      }

      // Handle real-time task updates
      socket.on("task:update", (data) => {
        socket.to(`project:${data.projectId}`).emit("task:updated", data)
      })

      // Handle real-time comments
      socket.on("comment:new", (data) => {
        socket.to(`project:${data.projectId}`).emit("comment:added", data)
      })

      // Handle time tracking updates
      socket.on("time:start", (data) => {
        socket.to(`project:${data.projectId}`).emit("time:started", {
          userId: socket.userId,
          userName: socket.user?.name,
          taskId: data.taskId,
          startTime: data.startTime,
        })
      })

      socket.on("time:stop", (data) => {
        socket.to(`project:${data.projectId}`).emit("time:stopped", {
          userId: socket.userId,
          userName: socket.user?.name,
          taskId: data.taskId,
          duration: data.duration,
        })
      })

      // Handle typing indicators
      socket.on("typing:start", (data) => {
        socket.to(`project:${data.projectId}`).emit("user:typing", {
          userId: socket.userId,
          userName: socket.user?.name,
          taskId: data.taskId,
        })
      })

      socket.on("typing:stop", (data) => {
        socket.to(`project:${data.projectId}`).emit("user:stopped_typing", {
          userId: socket.userId,
          taskId: data.taskId,
        })
      })

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log(`User ${socket.user?.name} disconnected`)
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId)
        }
      })
    })
  }

  // Send notification to specific user
  public sendNotificationToUser(userId: string, notification: any) {
    const socketId = this.connectedUsers.get(userId)
    if (socketId) {
      this.io.to(socketId).emit("notification:new", notification)
    }
  }

  // Send update to all project members
  public sendToProject(projectId: string, event: string, data: any) {
    this.io.to(`project:${projectId}`).emit(event, data)
  }

  // Get online users for a project
  public getOnlineUsers(projectId: string): string[] {
    const room = this.io.sockets.adapter.rooms.get(`project:${projectId}`)
    if (!room) return []

    const onlineUsers: string[] = []
    room.forEach((socketId) => {
      const socket = this.io.sockets.sockets.get(socketId) as AuthenticatedSocket
      if (socket?.userId) {
        onlineUsers.push(socket.userId)
      }
    })

    return onlineUsers
  }
}
