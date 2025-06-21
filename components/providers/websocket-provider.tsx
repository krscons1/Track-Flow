"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { wsClient } from "@/lib/websocket/websocket-client"
import { useAuth } from "./auth-provider"
import type { Socket } from "socket.io-client"

interface WebSocketContextType {
  socket: Socket | null
  isConnected: boolean
  emit: (event: string, data: any) => void
  on: (event: string, callback: (data: any) => void) => void
  off: (event: string, callback?: (data: any) => void) => void
}

const WebSocketContext = createContext<WebSocketContextType | null>(null)

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider")
  }
  return context
}

interface WebSocketProviderProps {
  children: React.ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { user, token } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (user && token) {
      const socketInstance = wsClient.connect(token)
      setSocket(socketInstance)

      socketInstance.on("connect", () => {
        setIsConnected(true)
        console.log("WebSocket connected")
      })

      socketInstance.on("disconnect", () => {
        setIsConnected(false)
        console.log("WebSocket disconnected")
      })

      return () => {
        wsClient.disconnect()
        setSocket(null)
        setIsConnected(false)
      }
    }
  }, [user, token])

  const emit = (event: string, data: any) => {
    wsClient.emit(event, data)
  }

  const on = (event: string, callback: (data: any) => void) => {
    wsClient.on(event, callback)
  }

  const off = (event: string, callback?: (data: any) => void) => {
    wsClient.off(event, callback)
  }

  return (
    <WebSocketContext.Provider value={{ socket, isConnected, emit, on, off }}>{children}</WebSocketContext.Provider>
  )
}
