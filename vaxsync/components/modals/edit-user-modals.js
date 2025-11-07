"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function EditUserModal({ open, onOpenChange, user, onUpdate }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    barangay: "",
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        barangay: user.barangay,
      })
    }
  }, [user, open])

  const handleSubmit = (e) => {
    e.preventDefault()
    onUpdate(formData)
  }

  if (!open || !user) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Edit User Details</h2>
          <p className="text-sm text-muted-foreground mt-1">Update user information</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Barangay</label>
            <Input value={formData.barangay} onChange={(e) => setFormData({ ...formData, barangay: e.target.value })} />
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
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
