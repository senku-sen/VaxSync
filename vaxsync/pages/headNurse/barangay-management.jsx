
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { CheckCircle, X } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { fetchBarangays, insertBarangay } from '@/lib/barangay';

export default function Inventory({
  title = "Barangay Management",
  subtitle = "Register and manage barangays for health worker assignment",
}) {
  const [barangays, setBarangays] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    municipality: "",
    health_center_name: "",
    health_center_address: "",
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    (async () => {
      setIsLoading(true);
      const payload = {
        ...formData,
        created_at: new Date().toISOString(),
      };
      const { data, error } = await insertBarangay(payload);
      if (error) {
        console.error('Error inserting barangay:', error);
        // show richer error message when possible
        const errMsg = error?.message || error?.msg || JSON.stringify(error);
        setSuccessMessage(`Failed to add barangay: ${errMsg}`);
        setShowSuccess(true);
        // keep the dialog open for user to correct
        setTimeout(() => setShowSuccess(false), 6000);
      } else {
        setFormData({ name: "", municipality: "", health_center_name: "", health_center_address: "" });
        setIsOpen(false);
        setSuccessMessage(`Barangay "${formData.name}" added successfully.`);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        // refresh list
        loadBarangays();
      }
      setIsLoading(false);
    })();
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
    <div className="flex h-screen flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 flex flex-col w-full lg:ml-64">
        <Header title={title} subtitle={subtitle} />

        <main className="p-4 md:p-6 lg:p-9 flex-1 overflow-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Barangays</h2>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>Register Barangay</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Register New Barangay</DialogTitle>
                  <DialogDescription>
                    Add a new barangay to the system without leaving the current page.
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
                  <DialogFooter className="gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Save</Button>
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
              <CardTitle>Barangays List</CardTitle>
              <CardDescription>Registered barangays and their details.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                   
                    <TableHead>Name</TableHead>
                    <TableHead>Municipality</TableHead>
                    <TableHead>Health Center</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {barangays.map((barangay) => (
                    <TableRow key={barangay.id}>
                      
                      <TableCell>{barangay.name}</TableCell>
                      <TableCell>{barangay.municipality}</TableCell>
                      <TableCell>{barangay.health_center_name}</TableCell>
                      <TableCell className="max-w-xs truncate">{barangay.health_center_address}</TableCell>
                      <TableCell className="text-sm">{new Date(barangay.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="default">Active</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {barangays.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
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