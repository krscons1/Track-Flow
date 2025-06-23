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
import { Users, Search, Plus, Mail, Crown, Clock, UserCheck, UserX, Send, CheckCircle, XCircle, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useDebounce } from "@/hooks/use-debounce"
import { useRouter } from "next/navigation"

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
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
  const [teamSearchQuery, setTeamSearchQuery] = useState("")
  const [teamSearchResults, setTeamSearchResults] = useState<any[]>([])
  const [isTeamSearching, setIsTeamSearching] = useState(false)
  const [myJoinRequests, setMyJoinRequests] = useState<any[]>([])
  const [teamJoinRequests, setTeamJoinRequests] = useState<any[]>([])
  const [isLoadingJoinRequests, setIsLoadingJoinRequests] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newTeamName, setNewTeamName] = useState("")
  const [selectedProjectId, setSelectedProjectId] = useState("")
  const [userProjects, setUserProjects] = useState<any[]>([])
  const [isCreatingTeam, setIsCreatingTeam] = useState(false)
  const [myTeams, setMyTeams] = useState<any[]>([])
  const [teamDescription, setTeamDescription] = useState("")
  const { toast } = useToast()
  const router = useRouter()

  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const debouncedTeamSearchQuery = useDebounce(teamSearchQuery, 300)

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

  useEffect(() => {
    if (debouncedTeamSearchQuery.length >= 2) {
      searchTeams(debouncedTeamSearchQuery)
    } else {
      setTeamSearchResults([])
    }
  }, [debouncedTeamSearchQuery])

  // Fetch my join requests
  useEffect(() => {
    const fetchMyJoinRequests = async () => {
      try {
        const response = await fetch("/api/my-join-requests")
        const data = await response.json()
        if (response.ok) setMyJoinRequests(data.joinRequests || [])
      } catch {}
    }
    fetchMyJoinRequests()
  }, [])

  // Fetch join requests for my team if I'm a leader
  useEffect(() => {
    const fetchTeamJoinRequests = async () => {
      if (teamMembers.length > 0 && teamMembers.find((m) => m._id === user._id && m.teamRole === "team_leader")) {
        setIsLoadingJoinRequests(true)
        try {
          // Assume the first team is the current team
          const myTeam = teamMembers[0].workspaceId || teamMembers[0].teamId
          if (!myTeam) return
          const response = await fetch(`/api/teams/${myTeam}/join-requests`)
          const data = await response.json()
          if (response.ok) setTeamJoinRequests(data.joinRequests || [])
        } catch {}
        setIsLoadingJoinRequests(false)
      }
    }
    fetchTeamJoinRequests()
  }, [teamMembers, user._id])

  // Fetch user projects for project selection
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects")
        const data = await response.json()
        if (response.ok) setUserProjects(data.projects || [])
      } catch {}
    }
    if (isCreateDialogOpen) fetchProjects()
  }, [isCreateDialogOpen])

  // Fetch my teams for My Teams section
  useEffect(() => {
    const fetchMyTeams = async () => {
      try {
        const response = await fetch("/api/my-teams")
        const data = await response.json()
        if (response.ok) setMyTeams(data.teams || [])
      } catch {}
    }
    fetchMyTeams()
  }, [])

  const loadTeamData = async () => {
    setIsLoading(true)
    try {
      const [membersResponse, invitationsResponse] = await Promise.all([
        fetch("/api/team/members"),
        fetch("/api/team/invitations"),
      ])

      const membersData = await membersResponse.json()
      const invitationsData = await invitationsResponse.json()

      if (membersResponse.ok) {
        setTeamMembers(membersData.members || [])
      } else {
        throw new Error(membersData.error || "Failed to load team members")
      }

      if (invitationsResponse.ok) {
        setInvitations(invitationsData.invitations || [])
      } else {
        throw new Error(invitationsData.error || "Failed to load invitations")
      }
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

  const searchTeams = async (query: string) => {
    setIsTeamSearching(true)
    try {
      const response = await fetch(`/api/teams/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      if (response.ok) {
        setTeamSearchResults(data.teams || [])
      }
    } catch (error) {
      setTeamSearchResults([])
    } finally {
      setIsTeamSearching(false)
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
          description: `An invitation has been sent to ${selectedUser.email}.`,
        })
        loadTeamData() // Refresh data
        setIsInviteDialogOpen(false)
        setSelectedUser(null)
        setSearchQuery("")
        setSearchResults([])
      } else {
        const data = await response.json()
        throw new Error(data.error || "Failed to send invitation")
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

  const sendJoinRequest = async (teamId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/join-requests`, {
        method: "POST",
      })
      if (response.ok) {
        toast({
          title: "Request Sent",
          description: "Your join request has been sent to the team leader.",
        })
        setIsJoinDialogOpen(false)
        setTeamSearchQuery("")
        setTeamSearchResults([])
      } else {
        const data = await response.json()
        throw new Error(data.error || "Failed to send join request")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
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

  const handleTeamJoinRequestResponse = async (joinRequestId: string, status: "accepted" | "declined") => {
    try {
      const response = await fetch(`/api/teams/join-requests/${joinRequestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (response.ok) {
        toast({
          title: `Request ${status}`,
          description: `You have ${status} the join request.`,
        })
        setTeamJoinRequests((prev) => prev.filter((r) => r._id !== joinRequestId))
      } else {
        const data = await response.json()
        throw new Error(data.error || "Failed to respond to join request")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to respond to join request",
        variant: "destructive",
      })
    }
  }

  const handleCreateTeam = async () => {
    if (!newTeamName.trim() || !selectedProjectId) return
    setIsCreatingTeam(true)
    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTeamName, projectId: selectedProjectId, description: teamDescription }),
      })
      if (response.ok) {
        toast({ title: "Team Created", description: "Your team has been created." })
        setIsCreateDialogOpen(false)
        setNewTeamName("")
        setSelectedProjectId("")
        setTeamDescription("")
        loadTeamData()
      } else {
        const data = await response.json()
        throw new Error(data.error || "Failed to create team")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsCreatingTeam(false)
    }
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
            Team Management <Users className="inline h-8 w-8 ml-2 text-purple-400" />
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Manage your project team and collaborate effectively</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Create a Team
          </Button>
          <Button
            onClick={() => setIsJoinDialogOpen(true)}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50 hover:scale-105 transition-all duration-200 shadow"
          >
            Join a Team
          </Button>
        </div>
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

      {/* Join Team Dialog */}
      <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
        <DialogTrigger asChild></DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join a Team</DialogTitle>
            <DialogDescription>Search for a team by name and send a join request.</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Search team name..."
            value={teamSearchQuery}
            onChange={(e) => setTeamSearchQuery(e.target.value)}
            className="mb-4"
          />
          {isTeamSearching ? (
            <div className="text-center py-4 text-gray-500">Searching...</div>
          ) : teamSearchResults.length === 0 && teamSearchQuery.length >= 2 ? (
            <div className="text-center py-4 text-gray-500">No teams found.</div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {teamSearchResults.map((team) => (
                <div key={team._id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium text-gray-900">{team.name}</div>
                    <div className="text-xs text-gray-500">Team ID: {team._id}</div>
                  </div>
                  <Button size="sm" onClick={() => sendJoinRequest(team._id)}>
                    Request to Join
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* My Teams Section */}
      <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-fade-in mb-8">
        <CardHeader>
          <CardTitle>My Teams</CardTitle>
        </CardHeader>
        <CardContent>
          {myTeams.length === 0 ? (
            <div className="text-center py-4 text-gray-500">You are not a member of any teams yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myTeams.map((team) => (
                <div
                  key={team._id}
                  className="group cursor-pointer rounded-xl bg-white/90 border border-gray-200 shadow-md hover:shadow-xl hover:scale-[1.03] transition-all duration-200 p-6 flex flex-col gap-2"
                  onClick={() => router.push(`/teams/${team._id}`)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow">
                      {team.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 font-semibold text-lg text-gray-900 group-hover:text-blue-700 transition-colors">
                        {team.role === "team_leader" ? <Crown className="h-5 w-5 text-yellow-500" /> : <User className="h-5 w-5 text-blue-500" />}
                        {team.name}
                      </div>
                      <div className="text-xs text-gray-500">Project: {team.projectTitle || team.projectId}</div>
                      <p className="text-sm text-muted-foreground mt-1">{team.description || "No mission statement yet."}</p>
                      <p className="text-xs text-gray-500">Last updated: {team.lastUpdated ? team.lastUpdated : "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Active</span>
                    <p className="text-xs text-gray-500 ml-2">{team.memberCount} member{team.memberCount > 1 ? "s" : ""}</p>
                    <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                      {team.role === "team_leader" ? "Team Leader" : "Member"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Join Requests Section */}
      <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-fade-in mb-8">
        <CardHeader>
          <CardTitle>My Join Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {myJoinRequests.length === 0 ? (
            <div className="text-center py-4 text-gray-500">You have not requested to join any teams.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myJoinRequests.map((req) => (
                <div key={req._id} className="group rounded-xl bg-white/90 border border-gray-200 shadow-md hover:shadow-xl hover:scale-[1.03] transition-all duration-200 p-6 flex flex-col gap-2">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow">
                      {typeof req.teamName === 'string' && req.teamName.length > 0 ? req.teamName.charAt(0).toUpperCase() : 'T'}
                    </div>
                    <div>
                      <div className="font-semibold text-lg text-gray-900 group-hover:text-blue-700 transition-colors">
                        {req.teamName || req.teamId}
                      </div>
                      <div className="text-xs text-gray-500">Requested: {new Date(req.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={req.status === "pending" ? "bg-yellow-100 text-yellow-800" : req.status === "accepted" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>{req.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Team Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild></DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a Team</DialogTitle>
            <DialogDescription>Fill in the details to create a new team and assign it to a project.</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Team name..."
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            className="mb-4"
          />
          <Input
            placeholder="Team description or mission statement..."
            value={teamDescription}
            onChange={(e) => setTeamDescription(e.target.value)}
            className="mb-4"
          />
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-full mb-4">
              <SelectValue placeholder="Assign to project..." />
            </SelectTrigger>
            <SelectContent>
              {userProjects.map((project) => (
                <SelectItem key={project._id} value={project._id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTeam} disabled={isCreatingTeam || !newTeamName.trim() || !selectedProjectId} className="bg-blue-600 hover:bg-blue-700">
              {isCreatingTeam ? "Creating..." : "Create Team"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
