"use client"

import { Button } from "@/components/ui/button"
import { Clock, CheckCircle } from "lucide-react"

export default function ViewActivityModal({ open, onOpenChange, user }) {
  if (!open || !user) return null

  const activityLog = [
    { time: "Today 10:30 AM", action: "Logged in", status: "success" },
    { time: "Today 9:15 AM", action: "Updated vaccination records", status: "success" },
    { time: "Yesterday 3:45 PM", action: "Viewed resident data", status: "success" },
    { time: "Yesterday 2:20 PM", action: "Generated reports", status: "success" },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg max-w-lg w-full mx-4">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">User Activity Status</h2>
          <p className="text-sm text-muted-foreground mt-1">Activity log for {user.name}</p>
        </div>

        <div className="p-6">
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-foreground">
              <strong>Last Activity:</strong> {user.lastActivity}
            </p>
          </div>

          <div className="space-y-3">
            {activityLog.map((log, idx) => (
              <div key={idx} className="flex items-start gap-3 pb-3 border-b border-border last:border-b-0">
                <div className="mt-1">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{log.action}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Clock className="w-3 h-3" />
                    {log.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-border">
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
