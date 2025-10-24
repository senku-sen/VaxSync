"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Edit, Plus, Trash2 } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { fetchBarangays, insertBarangay, updateBarangay, deleteBarangay } from '@/lib/barangay';

export default function Inventory({
  title = "Barangay Management",
  subtitle = "Register and manage barangays for health worker assignment",
}) {
  const [barangays, setBarangays] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedBarangay, setSelectedBarangay] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    municipality: "",
    health_center_name: "",
    health_center_address: "",
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const payload = {
      ...formData,
      created_at: selectedBarangay?.created_at || new Date().toISOString(),
    };
    let result;
    if (editMode && selectedBarangay) {
      result = await updateBarangay(selectedBarangay.id, payload);
      if (result.error) {
        setSuccessMessage(`Failed to update barangay: ${result.error.message || JSON.stringify(result.error)}`);
      } else {
        setBarangays(barangays.map((b) => (b.id === selectedBarangay.id ? { ...payload, id: b.id, created_at: b.created_at } : b)));
        setSuccessMessage(`Barangay "${formData.name}" updated successfully.`);
      }
    } else {
      result = await insertBarangay(payload);
      if (result.error) {
        setSuccessMessage(`Failed to add barangay: ${result.error.message || JSON.stringify(result.error)}`);
      } else {
        setBarangays([{ id: result.data.id, ...payload }, ...barangays]);
        setSuccessMessage(`Barangay "${formData.name}" added successfully.`);
      }
    }
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), editMode ? 6000 : 3000);
    if (!result.error) {
      setFormData({ name: "", municipality: "", health_center_name: "", health_center_address: "" });
      setIsOpen(false);
      setEditMode(false);
      setSelectedBarangay(null);
    }
    setIsLoading(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = (barangay) => {
    setFormData(barangay);
    setSelectedBarangay(barangay);
    setEditMode(true);
    setIsOpen(true);
  };

  const handleDelete = (barangay) => {
    setDeleteTarget(barangay);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      setIsLoading(true);
      const result = await deleteBarangay(deleteTarget.id);
      if (result.error) {
        setSuccessMessage(`Failed to delete barangay: ${result.error.message || JSON.stringify(result.error)}`);
      } else {
        setBarangays(barangays.filter((b) => b.id !== deleteTarget.id));
        setSuccessMessage(`Barangay "${deleteTarget.name}" deleted successfully.`);
      }
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setIsDeleteConfirmOpen(false);
      setDeleteTarget(null);
      setIsLoading(false);
    }
  };

  const loadBarangays = async () => {
    setIsLoading(true);
    const { data, error } = await fetchBarangays();
    if (error) {
      console.error('Error fetching barangays:', error);
    } else {
      setBarangays(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadBarangays();
  }, []);

  // Filter barangays based on search term
  const filteredBarangays = barangays.filter((barangay) =>
    barangay.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    barangay.health_center_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 flex flex-col w-full lg:ml-64">
        <Header title={title} subtitle={subtitle} />

        <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">

            <div className="w-full ">
              <Input
                type="text"
                placeholder="Search barangays..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-sm sm:text-base"
              />
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2 text-sm sm:text-base py-2 px-4">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Register Barangay</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-md sm:max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">{editMode ? "Edit Barangay" : "Register New Barangay"}</DialogTitle>
                  <DialogDescription className="text-sm sm:text-base">
                    {editMode ? "Update the barangay information." : "Add a new barangay to the system without leaving the current page."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm sm:text-base">Barangay Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter barangay name"
                      required
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="municipality" className="text-sm sm:text-base">Municipality</Label>
                    <Input
                      id="municipality"
                      name="municipality"
                      value={formData.municipality}
                      onChange={handleChange}
                      placeholder="Enter municipality"
                      required
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="health_center_name" className="text-sm sm:text-base">Health Center Name</Label>
                    <Input
                      id="health_center_name"
                      name="health_center_name"
                      value={formData.health_center_name}
                      onChange={handleChange}
                      placeholder="Enter health center name"
                      required
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="health_center_address" className="text-sm sm:text-base">Health Center Address</Label>
                    <Input
                      id="health_center_address"
                      name="health_center_address"
                      value={formData.health_center_address}
                      onChange={handleChange}
                      placeholder="Enter complete address"
                      required
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="text-sm sm:text-base py-2 px-4">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading} className="text-sm sm:text-base py-2 px-4">
                      {isLoading ? "Saving..." : editMode ? "Save" : "Save"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {showSuccess && (
            <Alert className="mb-6">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              <AlertDescription className="text-sm sm:text-base">{successMessage}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Barangays List</CardTitle>
              <CardDescription className="text-sm sm:text-base">Registered barangays and their details.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-sm">Name</TableHead>
                      <TableHead className="text-sm">Municipality</TableHead>
                      <TableHead className="text-sm">Health Center</TableHead>
                      <TableHead className="text-sm">Address</TableHead>
                      <TableHead className="text-sm hidden md:table-cell">Created At</TableHead>
                      <TableHead className="text-sm hidden lg:table-cell">Status</TableHead>
                      <TableHead className="text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBarangays.map((barangay) => (
                      <TableRow key={barangay.id}>
                        <TableCell className="text-sm">{barangay.name}</TableCell>
                        <TableCell className="text-sm">{barangay.municipality}</TableCell>
                        <TableCell className="text-sm">{barangay.health_center_name}</TableCell>
                        <TableCell className="text-sm max-w-xs truncate">{barangay.health_center_address}</TableCell>
                        <TableCell className="text-sm hidden md:table-cell">{new Date(barangay.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge variant="default">Active</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(barangay)} className="p-2">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(barangay)} className="p-2">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredBarangays.length === 0 && (
                      <TableRow key="empty-state">
                        <TableCell colSpan={7} className="h-24 text-center text-sm">
                          No barangays found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-4">
                {filteredBarangays.map((barangay) => (
                  <Card key={barangay.id} className="p-4">
                    <div className="space-y-2">
                      <div>
                        <span className="font-semibold text-sm">Name:</span> {barangay.name}
                      </div>
                      <div>
                        <span className="font-semibold text-sm">Municipality:</span> {barangay.municipality}
                      </div>
                      <div>
                        <span className="font-semibold text-sm">Health Center:</span> {barangay.health_center_name}
                      </div>
                      <div>
                        <span className="font-semibold text-sm">Address:</span> {barangay.health_center_address}
                      </div>
                      <div>
                        <span className="font-semibold text-sm">Created At:</span> {new Date(barangay.created_at).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-semibold text-sm">Status:</span> <Badge variant="default">Active</Badge>
                      </div>
                      <div className="flex space-x-2 pt-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(barangay)} className="p-2">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(barangay)} className="p-2">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
                {filteredBarangays.length === 0 && (
                  <Card className="p-4 text-center">
                    <p className="text-sm">No barangays found.</p>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Delete Confirmation Dialog */}
          <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
            <DialogContent className="w-[95vw] max-w-md sm:max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">Confirm Delete</DialogTitle>
                <DialogDescription className="text-sm sm:text-base">
                  Are you sure you want to delete {deleteTarget?.name || "this barangay"}?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} className="text-sm sm:text-base py-2 px-4">
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirmDelete} disabled={isLoading} className="text-sm sm:text-base py-2 px-4">
                  {isLoading ? "Deleting..." : "Confirm Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}