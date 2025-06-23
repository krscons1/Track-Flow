"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"

function timeAgo(dateString: string | Date | undefined): string {
  if (!dateString) return "-"
  const date = typeof dateString === "string" ? new Date(dateString) : dateString
  if (isNaN(date.getTime())) return "-"
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 120) return "Active now"
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? "s" : ""} ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`
}

export default function TeamDetailsClient({ team, project, members, isLeader, leaveRequests }: any) {
  const [requests, setRequests] = useState(leaveRequests || [])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState("")
  const router = useRouter()
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  const handleAction = async (requestId: string, status: "accepted" | "declined") => {
    setActionLoading(requestId + status)
    setError("")
    try {
      const res = await fetch(`/api/teams/leave-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setRequests((prev: any[]) => prev.map(r => r._id === requestId ? { ...r, status } : r))
      } else {
        const data = await res.json()
        setError(data.error || "Failed to update request")
      }
    } catch (e) {
      setError("Failed to update request")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    setDeleteError("")
    try {
      const res = await fetch(`/api/teams/${team._id}`, { method: "DELETE" })
      if (res.ok) {
        setDeleteDialog(false)
        router.push("/team")
      } else {
        const data = await res.json()
        setDeleteError(data.error || "Failed to delete team")
      }
    } catch (e) {
      setDeleteError("Failed to delete team")
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-8">
      {/* Team Members Section */}
      <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-fade-in mb-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-gray-900 flex items-center gap-4">
            Team Members
            <span className="ml-3 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">{team.name}</span>
            <span className="ml-3 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-medium">Project: {project?.title || team.projectId?.toString()}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {members.map((member: any) => (
              <div
                key={member._id?.toString()}
                className="rounded-2xl border bg-white/90 shadow-md hover:shadow-xl transition-all duration-200 p-6 flex flex-col gap-2 min-w-[260px]"
              >
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl shadow overflow-hidden">
                    {member.userAvatar ? (
                      <img src={member.userAvatar} alt={member.userName} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      member.userName?.charAt(0).toUpperCase() || "U"
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg text-gray-900">{member.userName || member.userEmail}</span>
                      {member.role === "team_leader" && (
                        <span title="Team Leader" className="ml-1 text-yellow-500">&#x1F451;</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">{member.userEmail}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge className={member.role === "team_leader" ? "bg-yellow-100 text-yellow-800" : "bg-blue-100 text-blue-700"}>{member.role === "team_leader" ? "Team Leader" : "Member"}</Badge>
                  <Badge className={member.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}>{member.status}</Badge>
                  <Badge className="bg-gray-100 text-gray-700">Last Active: {timeAgo(member.lastActive)}</Badge>
                </div>
                <div className="flex justify-between items-center border-t pt-3 mt-2 text-center">
                  <div>
                    <div className="font-bold text-lg">{member.tasksCompleted}</div>
                    <div className="text-xs text-gray-500">Tasks</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg">{member.hoursWorked}h</div>
                    <div className="text-xs text-gray-500">Hours</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analytics/Charts Section */}
      <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-fade-in mb-8">
        <CardHeader>
          <CardTitle>Team Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">Analytics and charts coming soon...</div>
        </CardContent>
      </Card>

      {/* Team Actions Section */}
      <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-fade-in">
        <CardHeader>
          <CardTitle>Team Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {isLeader ? (
              <>
                <Button variant="destructive" className="w-full md:w-auto" onClick={() => setDeleteDialog(true)}>Delete Team</Button>
                <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Team</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete this team? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    {deleteError && <div className="text-red-500 text-sm mb-2">{deleteError}</div>}
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDeleteDialog(false)} disabled={deleteLoading}>Cancel</Button>
                      <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>{deleteLoading ? "Deleting..." : "Delete"}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <LeaveTeamButton teamId={team._id?.toString()} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Leave Requests Management (Leader only) */}
      {isLeader && (
        <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-fade-in mb-8">
          <CardHeader>
            <CardTitle>Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-gray-500 py-4">No leave requests.</div>
            ) : (
              <div className="space-y-4">
                {requests.map((req: any) => {
                  const member = members.find((m: any) => m.userId?.toString() === req.userId?.toString())
                  return (
                    <div key={req._id} className="rounded-xl border bg-white/90 shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow overflow-hidden">
                          {member?.userAvatar ? (
                            <img src={member.userAvatar} alt={member.userName} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            member?.userName?.charAt(0).toUpperCase() || "U"
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-lg text-gray-900">{member?.userName || member?.userEmail || "User"}</div>
                          <div className="text-xs text-gray-500">{member?.userEmail}</div>
                          <div className="text-xs text-gray-500 mt-1">Reason: <span className="italic">{req.reason}</span></div>
                          <div className="text-xs text-gray-500 mt-1">Status: <span className={req.status === "pending" ? "text-yellow-600" : req.status === "accepted" ? "text-green-600" : "text-red-600"}>{req.status}</span></div>
                        </div>
                      </div>
                      {req.status === "pending" && (
                        <div className="flex gap-2 mt-2 md:mt-0">
                          <Button size="sm" variant="success" disabled={actionLoading === req._id+"accepted"} onClick={() => handleAction(req._id, "accepted")}>{actionLoading === req._id+"accepted" ? "Accepting..." : "Accept"}</Button>
                          <Button size="sm" variant="destructive" disabled={actionLoading === req._id+"declined"} onClick={() => handleAction(req._id, "declined")}>{actionLoading === req._id+"declined" ? "Declining..." : "Decline"}</Button>
                        </div>
                      )}
                    </div>
                  )
                })}
                {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function LeaveTeamButton({ teamId }: { teamId: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    setSubmitting(true)
    setError("")
    try {
      const response = await fetch(`/api/teams/${teamId}/leave-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      })
      if (response.ok) {
        setOpen(false)
        setReason("")
      } else {
        const data = await response.json()
        setError(data.error || "Failed to submit leave request")
      }
    } catch (e) {
      setError("Failed to submit leave request")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button variant="outline" className="w-full md:w-auto" onClick={() => setOpen(true)}>
        Leave Team
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request to Leave Team</DialogTitle>
            <DialogDescription>
              Please provide a reason for leaving. Your request will be sent to the team leader for approval.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for leaving..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            className="mb-4"
          />
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !reason.trim()}>
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 