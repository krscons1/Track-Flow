"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Users, Search, Plus, Mail, Crown, Clock, UserCheck, UserX, Send, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useDebounce } from "@/hooks/use-debounce"

interface User {
  _id: string
  name: string
  email: string
  role: "admin" | "member"
  teamRole?: "team_leader" | "member"
  avatar?: string
  lastActive: string
  projects: string[]
}

interface TeamMember {
  _id: string
  name: string
  email: string
  teamRole: "team_leader" | "member"
  avatar?: string
  lastActive: string
  tasksCompleted: number
  hoursWorked: number
  status: "active" | "inactive"
}

interface TeamInvitation {
  _id: string
  email: string
  role: "team_leader" | "member"
  status: "pending" | "accepted" | "declined"
  invitedBy: string
  createdAt: string
}

interface TeamManagementContentProps {
  user: User
  projectId: string
}

export default function TeamManagementContent({ user, projectId }: TeamManagementContentProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<TeamInvitation[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState<"team_leader" | "member">("member")
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const { toast } = useToast()

  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  useEffect(() => {
    loadTeamData()
  }, [projectId])

  useEffect(() => {
    if (debouncedSearchQuery.length >= 2) {
      searchUsers(debouncedSearchQuery)
    } else {
      setSearchResults([])
    }
  }, [debouncedSearchQuery])

  const loadTeamData = async () => {
    try {
      // Mock team members data
      const mockTeamMembers: TeamMember[] = [
        {
          _id: "1",
          name: "John Doe",
          email: "john@example.com",
          teamRole: "team_leader",
          avatar: "/placeholder.svg?height=40&width=40",
          lastActive: new Date().toISOString(),
          tasksCompleted: 15,
          hoursWorked: 120,
          status: "active",
        },
        {
          _id: "2",
          name: "Jane Smith",
          email: "jane@example.com",
          teamRole: "member",
          avatar: "/placeholder.svg?height=40&width=40",
          lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          tasksCompleted: 8,
          hoursWorked: 64,
          status: "active",
        },
        {
          _id: "3",
          name: "Mike Johnson",
          email: "mike@example.com",
          teamRole: "member",
          lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          tasksCompleted: 12,
          hoursWorked: 96,
          status: "inactive",
        },
      ]

      const mockInvitations: TeamInvitation[] = [
        {
          _id: "1",
          email: "sarah@example.com",
          role: "member",
          status: "pending",
          invitedBy: user._id,
          createdAt: new Date().toISOString(),
        },
        {
          _id: "2",
          email: "alex@example.com",
          role: "team_leader",
          status: "pending",
          invitedBy: user._id,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]

      setTeamMembers(mockTeamMembers)
      setInvitations(mockInvitations)
    } catch (error) {
      console.error("Failed to load team data:", error)
      toast({
        title: "Error",
        description: "Failed to load team data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const searchUsers = async (query: string) => {
    if (!query.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (response.ok) {
        // Filter out users already in the team
        const existingMemberIds = teamMembers.map((m) => m._id)
        const filteredResults = (data.users || []).filter((user: User) => !existingMemberIds.includes(user._id))
        setSearchResults(filteredResults)
      }
    } catch (error) {
      console.error("Failed to search users:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const sendInvitation = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch("/api/team/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          userId: selectedUser._id,
          email: selectedUser.email,
          role: selectedRole,
        }),
      })

      if (response.ok) {
        toast({
          title: "Invitation sent",
          description: `Invitation sent to ${selectedUser.email}`,
        })

        // Add to pending invitations
        const newInvitation: TeamInvitation = {
          _id: Date.now().toString(),
          email: selectedUser.email,
          role: selectedRole,
          status: "pending",
          invitedBy: user._id,
          createdAt: new Date().toISOString(),
        }
        setInvitations([...invitations, newInvitation])

        setIsInviteDialogOpen(false)
        setSelectedUser(null)
        setSearchQuery("")
        setSearchResults([])
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      })
    }
  }

  const removeMember = async (memberId: string) => {
    try {
      const response = await fetch(`/api/team/members/${memberId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setTeamMembers(teamMembers.filter((m) => m._id !== memberId))
        toast({
          title: "Member removed",
          description: "Team member has been removed successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove team member",
        variant: "destructive",
      })
    }
  }

  const changeRole = async (memberId: string, newRole: "team_leader" | "member") => {
    try {
      const response = await fetch(`/api/team/members/${memberId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ teamRole: newRole }),
      })

      if (response.ok) {
        setTeamMembers(teamMembers.map((m) => (m._id === memberId ? { ...m, teamRole: newRole } : m)))
        toast({
          title: "Role updated",
          description: "Team member role has been updated successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update member role",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getInvitationStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "accepted":
        return "bg-green-100 text-green-800"
      case "declined":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getLastActiveText = (lastActive: string) => {
    const now = new Date()
    const lastActiveDate = new Date(lastActive)
    const diffInHours = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Active now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Team Management 👥
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Manage your project team and collaborate effectively</p>
        </div>
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
              <Plus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Search for users and send them an invitation to join your project team.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {isSearching && <div className="text-center py-4 text-gray-500">Searching...</div>}

              {searchResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {searchResults.map((user) => (
                    <div
                      key={user._id}
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedUser?._id === user._id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      {selectedUser?._id === user._id && <CheckCircle className="h-5 w-5 text-blue-600" />}
                    </div>
                  ))}
                </div>
              )}

              {selectedUser && (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedUser.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{selectedUser.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{selectedUser.name}</p>
                        <p className="text-sm text-gray-600">{selectedUser.email}</p>
                      </div>
                    </div>
                  </div>

                  <Select
                    value={selectedRole}
                    onValueChange={(value: "team_leader" | "member") => setSelectedRole(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="team_leader">Team Leader</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={sendInvitation} disabled={!selectedUser} className="bg-blue-600 hover:bg-blue-700">
                <Send className="h-4 w-4 mr-2" />
                Send Invitation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-slide-in">
        <Card className="hover-lift shadow-lg border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Total Members</p>
                <p className="text-3xl font-bold">{teamMembers.length}</p>
              </div>
              <Users className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift shadow-lg border-0 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Active Members</p>
                <p className="text-3xl font-bold">{teamMembers.filter((m) => m.status === "active").length}</p>
              </div>
              <UserCheck className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift shadow-lg border-0 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Pending Invites</p>
                <p className="text-3xl font-bold">{invitations.filter((i) => i.status === "pending").length}</p>
              </div>
              <Mail className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift shadow-lg border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Team Leaders</p>
                <p className="text-3xl font-bold">{teamMembers.filter((m) => m.teamRole === "team_leader").length}</p>
              </div>
              <Crown className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members */}
      <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map((member, index) => (
              <Card
                key={member._id}
                className="hover-lift transition-all duration-200 animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900">{member.name}</h3>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                    </div>
                    {member.teamRole === "team_leader" && <Crown className="h-5 w-5 text-yellow-500" />}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Role</span>
                      <Badge
                        className={
                          member.teamRole === "team_leader"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                        }
                      >
                        {member.teamRole === "team_leader" ? "Team Leader" : "Member"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <Badge className={getStatusColor(member.status)}>{member.status}</Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Last Active</span>
                      <span className="text-sm font-medium">{getLastActiveText(member.lastActive)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{member.tasksCompleted}</p>
                        <p className="text-xs text-gray-600">Tasks</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{member.hoursWorked}h</p>
                        <p className="text-xs text-gray-600">Hours</p>
                      </div>
                    </div>

                    {user.role === "admin" && member._id !== user._id && (
                      <div className="flex gap-2 pt-3 border-t">
                        <Select
                          value={member.teamRole}
                          onValueChange={(value: "team_leader" | "member") => changeRole(member._id, value)}
                        >
                          <SelectTrigger className="flex-1 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="team_leader">Team Leader</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeMember(member._id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Pending Invitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invitations.map((invitation, index) => (
                <div
                  key={invitation._id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <Mail className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{invitation.email}</p>
                      <p className="text-sm text-gray-600">
                        Invited as {invitation.role === "team_leader" ? "Team Leader" : "Member"} •{" "}
                        {new Date(invitation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={getInvitationStatusColor(invitation.status)}>
                      {invitation.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                      {invitation.status === "accepted" && <CheckCircle className="h-3 w-3 mr-1" />}
                      {invitation.status === "declined" && <XCircle className="h-3 w-3 mr-1" />}
                      {invitation.status}
                    </Badge>
                    {invitation.status === "pending" && (
                      <Button variant="outline" size="sm">
                        Resend
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
