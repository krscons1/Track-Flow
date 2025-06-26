"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Eye, EyeOff, TrendingUp, Shield, Zap, Globe } from "lucide-react"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [emailUser, setEmailUser] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"admin" | "member">("member")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailUser(e.target.value.replace(/@gmail\.com/g, ""))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const email = emailUser + "@gmail.com"

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, role }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Account created!",
          description: "Welcome to TrackFlow! You can now start managing your projects.",
        })
        router.push("/dashboard")
      } else {
        toast({
          title: "Registration failed",
          description: data.error || "Failed to create account. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Connection error",
        description: "Unable to connect to the server. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 to-blue-700 p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex flex-col justify-center max-w-md">
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold">TrackFlow</h1>
            </div>
            <h2 className="text-4xl font-bold mb-4 leading-tight">Start Your Journey Today</h2>
            <p className="text-xl text-purple-100 mb-8">
              Join thousands of teams who trust TrackFlow to manage their projects efficiently and deliver exceptional
              results.
            </p>
          </div>

          <div className="space-y-6 animate-slide-in">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Quick Setup</h3>
                <p className="text-purple-100 text-sm">Get started in minutes, not hours</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Secure & Reliable</h3>
                <p className="text-purple-100 text-sm">Enterprise-grade security for your data</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Global Access</h3>
                <p className="text-purple-100 text-sm">Access your projects from anywhere</p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-32 w-20 h-20 bg-white/10 rounded-full animate-bounce-slow"></div>
      </div>

      {/* Right side - Register form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md animate-scale-in hover-lift">
          <CardHeader className="text-center space-y-2">
            <div className="lg:hidden flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mr-3">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">TrackFlow</h1>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Create your account</CardTitle>
            <CardDescription className="text-gray-600">Get started with TrackFlow today</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Full name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="focus-ring"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email address
                </Label>
                <div className="flex items-center">
                  <Input
                    id="email"
                    type="text"
                    placeholder="Enter your email"
                    value={emailUser}
                    onChange={handleEmailChange}
                    required
                    disabled={isLoading}
                    className="focus-ring"
                    autoComplete="off"
                  />
                  <span className="ml-2 text-gray-500">@gmail.com</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="focus-ring pr-10"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">Password must be at least 6 characters long</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                  Role
                </Label>
                <Select value={role} onValueChange={(value: "admin" | "member") => setRole(value)}>
                  <SelectTrigger className="focus-ring">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Team Member</SelectItem>
                    <SelectItem value="admin">Project Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2.5 transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="font-medium text-purple-600 hover:text-purple-500 transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
