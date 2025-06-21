"use client"

import { io, type Socket } from "socket.io-client"

class WebSocketClient {
  private socket: Socket | null = null
  private token: string | null = null

  connect(token: string) {
    if (this.socket?.connected) {
      return this.socket
    }

    this.token = token
    this.socket = io(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000", {
      auth: {
        token,
      },
    })

    this.socket.on("connect", () => {
      console.log("Connected to WebSocket server")
    })

    this.socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server")
    })

    this.socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error)
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback)
    }
  }

  off(event: string, callback?: (data: any) => void) {
    if (this.socket) {
      this.socket.off(event, callback)
    }
  }

  getSocket() {
    return this.socket
  }
}

export const wsClient = new WebSocketClient()
