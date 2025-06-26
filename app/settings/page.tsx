"use client"

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { MdSettings } from "react-icons/md"

export default function SettingsPage() {
  // Mock user data (replace with real user data from context or props)
  const [user, setUser] = useState({
    name: "Mohammed Adiyaan R",
    email: "adiyaan126@gmail.com",
    avatarUrl: "https://ui-avatars.com/api/?name=Mohammed+Adiyaan+R&background=4f46e5&color=fff&size=128"
  })
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [theme, setTheme] = useState("light")
  // Store only the username part
  const [emailUser, setEmailUser] = useState(user.email.replace(/@gmail\.com$/, ""));

  // Placeholder save handlers
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    setUser((u) => ({ ...u, name, email: emailUser + "@gmail.com" }))
    // Show toast or feedback here
  }
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPassword("")
    setNewPassword("")
    // Show toast or feedback here
  }
  const handleThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTheme(e.target.value)
    // Integrate with real theme switcher if available
  }
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove any @gmail.com the user tries to type or paste
    setEmailUser(e.target.value.replace(/@gmail\.com/g, ""));
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-4xl font-bold flex items-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent gap-4">
          <MdSettings className="text-blue-700" size={48} />
          Settings
        </h1>
        <p className="text-gray-600 mt-2 text-lg">Manage your profile, password, and preferences</p>
      </div>
      {/* Wide Card Form below header */}
      <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-slide-in max-w-6xl mx-auto mt-8">
        <CardContent className="p-8 flex flex-col gap-8 lg:flex-row lg:items-start">
          {/* Avatar and Basic Info */}
          <div className="flex flex-col items-center lg:items-start lg:w-1/3" style={{ marginLeft: 20 }}>
            <Avatar className="h-28 w-28 mb-4">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold mb-1">{user.name}</h2>
            <p className="text-gray-500 mb-6">{user.email}</p>
          </div>
          {/* Forms */}
          <div className="flex-1 flex flex-col gap-8">
            {/* Editable Profile Fields */}
            <form onSubmit={handleSaveProfile} className="w-full space-y-4 animate-fade-in">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center">
                  <Input
                    id="email"
                    type="text"
                    value={emailUser}
                    onChange={handleEmailChange}
                    className="mt-1"
                    autoComplete="off"
                  />
                  <span className="ml-2 text-gray-500">@gmail.com</span>
                </div>
              </div>
              <Button type="submit" className="w-full mt-2">Save Profile</Button>
            </form>
            {/* Password Change */}
            <form onSubmit={handleChangePassword} className="w-full space-y-4 animate-fade-in">
              <div>
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="mt-1" autoComplete="current-password" />
              </div>
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-1" autoComplete="new-password" />
              </div>
              <Button type="submit" className="w-full mt-2" variant="outline">Change Password</Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 