"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import Sidebar from "./sidebar"
import { AuthProvider } from "@/components/providers/auth-provider"
import { Toaster } from "@/components/ui/toaster"

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname()

  // Hide sidebar on authentication pages
  const isAuthPage =
    pathname?.startsWith("/auth/") || pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password"

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        {!isAuthPage && <Sidebar />}
        <div className={`${!isAuthPage ? "lg:ml-64" : ""} transition-all duration-300`}>{children}</div>
        <Toaster />
      </div>
    </AuthProvider>
  )
}
