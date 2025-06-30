"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { BarChart, Bar, PieChart, Pie, Cell } from "recharts"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

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

export default function TeamDetailsClient({ team, project, members, isLeader, leaveRequests, user, analytics, subtasks }: any) {
  const [requests, setRequests] = useState(leaveRequests || [])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState("")
  const router = useRouter()
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState("")
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("")
  const deleteConfirmString = `${user?.name || user?.email || "username"}@${team.name}`

  // For expanding/collapsing description in work details table
  const [expandedRows, setExpandedRows] = useState<{ [key: string]: boolean }>({});
  const maxDescLength = 40;
  const handleDescClick = (rowKey: string) => {
    setExpandedRows(prev => ({ ...prev, [rowKey]: !prev[rowKey] }));
  };

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
                  <Avatar className="w-16 h-16">
                    {member.userAvatar ? (
                      <AvatarImage src={member.userAvatar} alt={member.userName} />
                    ) : (
                      <AvatarFallback>{member.userName?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                    )}
                  </Avatar>
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
                  {user && member.userId?.toString() === user._id?.toString() ? (
                    <Badge className="bg-green-100 text-green-800">Active now</Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-700">
                      Last Active: {member.lastLogout ? timeAgo(member.lastLogout) : member.lastLogin ? timeAgo(member.lastLogin) : "-"}
                    </Badge>
                  )}
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
                  <div>
                    <div className="font-bold text-lg">{member.subtasksCompleted}</div>
                    <div className="text-xs text-gray-500">Subtasks</div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center mb-6">
            <div className="p-4">
              <div className="text-3xl font-bold text-blue-700">{analytics?.totalTasks ?? 0}</div>
              <div className="text-gray-500 text-sm">Total Tasks</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-green-700">{analytics?.totalCompletedTasks ?? 0}</div>
              <div className="text-gray-500 text-sm">Completed Tasks</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-purple-700">{analytics?.totalHours ?? 0}h</div>
              <div className="text-gray-500 text-sm">Total Hours Worked</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-yellow-700">{analytics?.avgHoursPerMember?.toFixed(1) ?? 0}h</div>
              <div className="text-gray-500 text-sm">Avg Hours/Member</div>
            </div>
          </div>
          {analytics?.topPerformer ? (
            <div className="text-center mt-4">
              <span className="font-semibold text-lg">Top Performer:</span> <span className="text-blue-700 font-bold">{analytics.topPerformer.name}</span> <span className="text-gray-500">({analytics.topPerformer.hours}h)</span>
            </div>
          ) : (
            <div className="text-center text-gray-400">No top performer yet.</div>
          )}

          {/* Productivity Over Time Chart */}
          <div className="mt-10">
            <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-fade-in rounded-2xl transition-all duration-200 p-6">
              <h3 className="text-lg font-semibold mb-2">Productivity Over Time</h3>
              <ProductivityLineChart members={members} />
            </Card>
          </div>

          {/* Top Performers Chart */}
          <div className="mt-10">
            <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-fade-in rounded-2xl transition-all duration-200 p-6">
              <h3 className="text-lg font-semibold mb-2">Top Performers</h3>
              <TopPerformersBarChart members={members} />
            </Card>
          </div>

          {/* Member Work Table */}
          <div className="mt-10">
            <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-fade-in rounded-2xl transition-all duration-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Work Details</h3>
              <div className="overflow-x-auto">
                <Table className="fade-in w-full rounded-xl overflow-hidden shadow-md border-0">
                  <TableHeader className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-200 animate-fade-in">
                    <TableRow>
                      <TableHead className="px-4 py-3 text-gray-700 font-bold">Member</TableHead>
                      <TableHead className="px-4 py-3 text-gray-700 font-bold">Type</TableHead>
                      <TableHead className="px-4 py-3 text-gray-700 font-bold">Title</TableHead>
                      <TableHead className="px-4 py-3 text-gray-700 font-bold">Hours</TableHead>
                      <TableHead className="px-4 py-3 text-gray-700 font-bold">Description</TableHead>
                      <TableHead className="px-4 py-3 text-gray-700 font-bold">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member: any) =>
                      member.memberWork.length > 0 ? member.memberWork.map((work: any, idx: number) => {
                        const rowKey = member.userId + '-' + idx;
                        const isLong = work.description && work.description.length > maxDescLength;
                        const expanded = expandedRows[rowKey];
                        const displayDesc = isLong && !expanded
                          ? work.description.slice(0, maxDescLength) + '...'
                          : work.description;
                        return (
                          <TableRow
                            key={rowKey}
                            className={
                              idx % 2 === 0
                                ? 'bg-gray-50 hover:bg-blue-50 transition-all duration-200 ease-in-out'
                                : 'bg-white hover:bg-blue-50 transition-all duration-200 ease-in-out'
                            }
                          >
                            <TableCell className="px-4 py-2 font-semibold text-gray-900">{member.userName}</TableCell>
                            <TableCell className="px-4 py-2 text-gray-700">{work.type}</TableCell>
                            <TableCell className="px-4 py-2 text-gray-700">{work.title}</TableCell>
                            <TableCell className="px-4 py-2 text-blue-700 font-bold">{work.hours}</TableCell>
                            <TableCell
                              className={
                                'px-4 py-2 text-gray-600 max-w-xs cursor-pointer select-none transition-all duration-200'
                              }
                              title={isLong ? (expanded ? 'Click to collapse' : 'Click to expand') : ''}
                              onClick={() => isLong && handleDescClick(rowKey)}
                            >
                              <span>{displayDesc}</span>
                            </TableCell>
                            <TableCell className="px-4 py-2 text-gray-500">{work.date ? (typeof work.date === 'string' ? new Date(work.date).toLocaleString() : new Date(work.date).toLocaleString()) : ''}</TableCell>
                          </TableRow>
                        );
                      }) : (
                        <TableRow key={member.userId + '-none'}>
                          <TableCell className="px-4 py-2 font-semibold text-gray-900">{member.userName}</TableCell>
                          <TableCell className="px-4 py-2 text-gray-500" colSpan={5}>No work entries</TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
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
                          <Button size="sm" variant="default" disabled={actionLoading === req._id+"accepted"} onClick={() => handleAction(req._id, "accepted")}>{actionLoading === req._id+"accepted" ? "Accepting..." : "Accept"}</Button>
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

      {/* Team Actions Section (no card, just a button at the bottom) */}
      <div className="flex flex-col items-start space-y-4 mt-8">
        {isLeader ? (
          <>
            <Button variant="destructive" className="w-full md:w-auto" onClick={() => setDeleteDialog(true)}>Delete Team</Button>
            <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Team</DialogTitle>
                  <DialogDescription>
                    <div className="mb-2">This action <b>cannot be undone</b>.</div>
                    <div className="mb-2">Please type your <span className="font-mono bg-gray-100 px-2 py-1 rounded">username@teamname</span> to confirm deletion of this team.</div>
                    <div className="mb-2 text-xs text-gray-500">For you, type: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{deleteConfirmString}</span></div>
                  </DialogDescription>
                </DialogHeader>
                <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
                  Confirmation
                </label>
                <Input
                  value={deleteConfirmInput}
                  onChange={e => setDeleteConfirmInput(e.target.value)}
                  placeholder={deleteConfirmString}
                  className="mt-0"
                  autoFocus
                />
                {deleteError && <div className="text-red-500 text-sm mb-2">{deleteError}</div>}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDialog(false)} disabled={deleteLoading}>Cancel</Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteLoading || deleteConfirmInput !== deleteConfirmString}
                  >
                    {deleteLoading ? "Deleting..." : "Delete"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <LeaveTeamButton teamId={team._id?.toString()} />
        )}
      </div>
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

function getLastNDates(n: number) {
  const dates = []
  const today = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    dates.push(d.toISOString().substring(0, 10))
  }
  return dates
}

function ProductivityLineChart({ members }: { members: any[] }) {
  // Prepare data: for each day, for each member, sum hours
  const days = getLastNDates(7)
  const data = days.map(date => {
    const entry: any = { date }
    members.forEach(member => {
      const hours = member.memberWork
        .filter((w: any) => {
          if (!w.date) return false
          // Use local date string for grouping
          const dateObj = typeof w.date === 'string' ? new Date(w.date) : new Date(w.date)
          const localDateStr = dateObj.getFullYear() + '-' + String(dateObj.getMonth() + 1).padStart(2, '0') + '-' + String(dateObj.getDate()).padStart(2, '0')
          return localDateStr === date
        })
        .reduce((sum: number, w: any) => sum + (w.hours || 0), 0)
      entry[member.userName] = hours
    })
    return entry
  })
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        {members.map((member, idx) => (
          <Line
            key={member.userName}
            type="monotone"
            dataKey={member.userName}
            stroke={["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#6366F1"][idx % 5]}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

// Top Performers: Horizontal Bar Chart
function TopPerformersBarChart({ members }: { members: any[] }) {
  // Sort by hours worked, take top 5
  const data = [...members]
    .sort((a, b) => b.hoursWorked - a.hoursWorked)
    .slice(0, 5)
    .map((m: any) => ({ name: m.userName, Hours: m.hoursWorked, Tasks: m.tasksCompleted }))
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" />
        <Tooltip />
        <Legend />
        <Bar dataKey="Hours" fill="#3B82F6" />
        <Bar dataKey="Tasks" fill="#10B981" />
      </BarChart>
    </ResponsiveContainer>
  )
} 