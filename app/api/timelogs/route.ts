import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/server-only/auth'
import { TimeLogModel } from '@/lib/server-only/models/TimeLog'
import { ObjectId } from 'mongodb'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const logs = await TimeLogModel.find({ userId: new ObjectId(user._id) })
    // Sanitize ObjectIds
    const sanitized = logs.map(log => ({
      ...log,
      _id: log._id?.toString(),
      taskId: log.taskId?.toString(),
      userId: log.userId?.toString(),
      subtaskId: log.subtaskId?.toString(),
    }))
    return NextResponse.json({ timeLogs: sanitized })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 