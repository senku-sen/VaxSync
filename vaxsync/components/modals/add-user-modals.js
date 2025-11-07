"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function AddUserModal({ open, onOpenChange, onAdd }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Health Worker",
    barangay: "Main Office",
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onAdd(formData)
    setFormData({ name: "", email: "", role: "Health Worker", barangay: "Main Office" })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Add New User</h2>
          <p className="text-sm text-muted-foreground mt-1">Create a new system user account</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option>Head Nurse</option>
              <option>Health Worker</option>
              <option>Administrator</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Barangay</label>
            <Input
              value={formData.barangay}
              onChange={(e) => setFormData({ ...formData, barangay: e.target.value })}
              placeholder="Main Office"
            />
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
              Add User
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
