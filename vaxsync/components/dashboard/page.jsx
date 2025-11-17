"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit2, Trash2, Search } from "lucide-react"
import AddUserModal from "@/components/user-management/add-user-modal"
import Sidebar from "@/components/layout/Sidebar" // <-- Add this line

export default function UserManagementPage() {
 

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar /> {/* <-- Add this line */}
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* ...rest of your content... */}
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">User Management</h1>
            <p className="text-muted-foreground">Manage system users and permissions</p>
          </div>
          {/* ...rest of your code... */}
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setIsModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* ...table head and body... */}
              {/* (rest of your table code unchanged) */}
            </table>
          </div>
          {/* Add User Modal */}
          <AddUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleAddUser} />
        </div>
      </div>
    </div>
  )
}