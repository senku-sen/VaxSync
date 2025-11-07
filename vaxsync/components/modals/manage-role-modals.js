"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function ManageRolesModal({ open, onOpenChange, user, onUpdate }) {
  const [role, setRole] = useState("")
  const [permissions, setPermissions] = useState([])

  const availablePermissions = [
    { id: "view_users", label: "View Users" },
    { id: "edit_users", label: "Edit Users" },
    { id: "delete_users", label: "Delete Users" },
    { id: "manage_roles", label: "Manage Roles" },
    { id: "view_reports", label: "View Reports" },
  ]

  useEffect(() => {
    if (user) {
      setRole(user.role)
      setPermissions(user.permissions || [])
    }
  }, [user, open])

  const handleSubmit = (e) => {
    e.preventDefault()
    onUpdate({ role, permissions })
  }

  const togglePermission = (id) => {
    setPermissions(permissions.includes(id) ? permissions.filter((p) => p !== id) : [...permissions, id])
  }

  if (!open || !user) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Manage Roles & Permissions</h2>
          <p className="text-sm text-muted-foreground mt-1">Assign role and permissions for {user.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option>Head Nurse</option>
              <option>Health Worker</option>
              <option>Administrator</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Permissions</label>
            <div className="space-y-2">
              {availablePermissions.map((perm) => (
                <label key={perm.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.includes(perm.id)}
                    onChange={() => togglePermission(perm.id)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-foreground">{perm.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-muted text-foreground hover:bg-muted/80"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
            >
              Save Roles
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
