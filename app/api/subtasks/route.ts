import { NextRequest, NextResponse } from "next/server";
import { SubtaskModel } from "@/lib/server-only/models/Subtask";
import { getCurrentUser } from "@/lib/server-only/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const subtasks = await SubtaskModel.findAll();
    const sanitized = subtasks.map(s => ({
      ...s,
      _id: s._id?.toString(),
      taskId: s.taskId?.toString(),
      assignee: s.assignee?.toString(),
    }));
    return NextResponse.json({ subtasks: sanitized });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 