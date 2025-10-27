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
import { CheckCircle, Edit, Plus } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { fetchBarangays, insertBarangay, updateBarangay } from '@/lib/barangay';

export default function Inventory({
  title = "Barangay Management",
  subtitle = "Register and manage barangays for health worker assignment",
}) {
  const [barangays, setBarangays] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedBarangay, setSelectedBarangay] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    municipality: "",
    health_center_name: "",
    health_center_address: "",
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

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

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 flex flex-col w-full lg:ml-64">
        <Header title={title} subtitle={subtitle} />

        <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Barangays</h2>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Register Barangay</span>
                </Button>
            </DialogTrigger>

              <DialogContent className="max-w-[90vw] sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editMode ? "Edit Barangay" : "Register New Barangay"}</DialogTitle>
                  <DialogDescription>
                    {editMode ? "Update the barangay information." : "Add a new barangay to the system without leaving the current page."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Barangay Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter barangay name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="municipality">Municipality</Label>
                    <Input
                      id="municipality"
                      name="municipality"
                      value={formData.municipality}
                      onChange={handleChange}
                      placeholder="Enter municipality"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="health_center_name">Health Center Name</Label>
                    <Input
                      id="health_center_name"
                      name="health_center_name"
                      value={formData.health_center_name}
                      onChange={handleChange}
                      placeholder="Enter health center name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="health_center_address">Health Center Address</Label>
                    <Input
                      id="health_center_address"
                      name="health_center_address"
                      value={formData.health_center_address}
                      onChange={handleChange}
                      placeholder="Enter complete address"
                      required
                    />
                  </div>
                  <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Saving..." : editMode ? "Save" : "Save"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {showSuccess && (
            <Alert className="mb-6">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Barangays List</CardTitle>
              <CardDescription>Registered barangays and their details.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Name</TableHead>
                    <TableHead className="text-xs sm:text-sm">Municipality</TableHead>
                    <TableHead className="text-xs sm:text-sm">Health Center</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Address</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden md:table-cell">Created At</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Status</TableHead>
                    <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {barangays.map((barangay) => (
                    <TableRow key={barangay.id}>
                      <TableCell className="text-xs sm:text-sm">{barangay.name}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{barangay.municipality}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{barangay.health_center_name}</TableCell>
                      <TableCell className="text-xs sm:text-sm max-w-xs truncate hidden sm:table-cell">{barangay.health_center_address}</TableCell>
                      <TableCell className="text-xs sm:text-sm hidden md:table-cell">{new Date(barangay.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="default">Active</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(barangay)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {barangays.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-xs sm:text-sm">
                        No barangays registered yet. Click "Register Barangay" to add one.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}