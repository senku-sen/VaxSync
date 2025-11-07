"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function DeleteUserModal({ open, onOpenChange, user, onConfirm }) {
  if (!open || !user) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg max-w-sm w-full mx-4">
        <div className="p-6 border-b border-border flex items-start gap-4">
          <div className="bg-red-100 p-3 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Delete User</h2>
            <p className="text-sm text-muted-foreground mt-1">This action cannot be undone</p>
          </div>
        </div>

        <div className="p-6">
          <p className="text-sm text-foreground mb-2">
            Are you sure you want to delete <strong>{user.name}</strong>?
          </p>
          <p className="text-xs text-muted-foreground">Email: {user.email}</p>
        </div>

        <div className="p-6 border-t border-border flex gap-3">
          <Button onClick={() => onOpenChange(false)} className="flex-1 bg-muted text-foreground hover:bg-muted/80">
            Cancel
          </Button>
          <Button onClick={onConfirm} className="flex-1 bg-red-600 text-white hover:bg-red-700">
            Delete User
          </Button>
        </div>
      </div>
    </div>
  )
}
