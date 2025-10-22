"use client";

import { useState, useEffect } from 'react';
import {
  insertVaccine,
  updateVaccine,
  fetchVaccines as fetchVaccinesLib,
  deleteVaccineById,
} from '@/lib/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Loader2, Trash } from 'lucide-react';
import DeleteConfirm from './DeleteConfirm';

// AddVaccine supports add and edit. Pass `vaccine` prop when editing.
const AddVaccine = ({ onSuccess, vaccine: initialVaccine, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    batch_number: '',
    quantity_available: '',
    expiry_date: '',
    location: '',
    notes: '',
    status: 'Good',
  });
  const [vaccines, setVaccines] = useState([]);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (initialVaccine) {
      setFormData({
        name: initialVaccine.name || '',
        batch_number: initialVaccine.batch_number || '',
        quantity_available:
          initialVaccine.quantity_available !== null &&
          initialVaccine.quantity_available !== undefined
            ? String(initialVaccine.quantity_available)
            : '',
        expiry_date: initialVaccine.expiry_date || '',
        location: initialVaccine.location || '',
        notes: initialVaccine.notes || '',
        status: initialVaccine.status || 'Good',
      });
    } else {
      setFormData({
        name: '',
        batch_number: '',
        quantity_available: '',
        expiry_date: '',
        location: '',
        notes: '',
        status: 'Good',
      });
    }
    fetchVaccines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialVaccine]);

  const fetchVaccines = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await fetchVaccinesLib();
      if (error) {
        console.error('Error fetching vaccines:', error);
        showAlert('error', `Failed to fetch vaccines: ${error.message || 'Unknown'}`);
      } else {
        setVaccines(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      showAlert('error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const qty = formData.quantity_available === '' ? null : parseInt(formData.quantity_available, 10);
      let data, error;

      if (initialVaccine && initialVaccine.id) {
        ({ data, error } = await updateVaccine(initialVaccine.id, {
          name: formData.name,
          batch_number: formData.batch_number,
          quantity_available: qty,
          expiry_date: formData.expiry_date,
          location: formData.location,
          notes: formData.notes,
          status: formData.status || 'Good',
        }));
      } else {
        ({ data, error } = await insertVaccine({
          name: formData.name,
          batch_number: formData.batch_number,
          quantity_available: qty,
          expiry_date: formData.expiry_date,
          location: formData.location,
          notes: formData.notes,
          status: formData.status || 'Good',
          created_at: new Date().toISOString(),
        }));
      }

      if (error) {
        console.error('Error saving vaccine:', error);
        showAlert('error', `Failed to save vaccine: ${error.message || 'Unknown'}`);
      } else {
        showAlert('success', initialVaccine && initialVaccine.id ? 'Vaccine updated' : 'Vaccine added');
        fetchVaccines();
        if (typeof onSuccess === 'function') onSuccess();
        if (typeof onClose === 'function') onClose();
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      showAlert('error', 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!initialVaccine || !initialVaccine.id) return;
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!initialVaccine || !initialVaccine.id) return;
    setShowDeleteConfirm(false);
    setIsSubmitting(true);
    try {
      const { error } = await deleteVaccineById(initialVaccine.id);
      if (error) {
        console.error('Error deleting vaccine:', error);
        showAlert('error', `Failed to delete: ${error.message || 'Unknown error'}`);
      } else {
        showAlert('success', 'Vaccine deleted');
        if (typeof onSuccess === 'function') onSuccess();
        if (typeof onClose === 'function') onClose();
      }
    } catch (err) {
      console.error('Unexpected error deleting:', err);
      showAlert('error', 'Unexpected error deleting vaccine');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>{initialVaccine ? 'Edit Vaccine' : 'Add New Vaccine'}</CardTitle>
        </CardHeader>
        <CardContent>
          {alert.show && (
            <Alert className={`mb-4 ${alert.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
              {alert.type === 'error' ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
              <AlertDescription className={alert.type === 'error' ? 'text-red-700' : 'text-green-700'}>
                {alert.message}
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Vaccine Name</Label>
                  <Input id="name" name="name" type="text" value={formData.name} onChange={handleChange} placeholder="e.g., COVID-19, Influenza" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batch_number">Batch Number</Label>
                  <Input id="batch_number" name="batch_number" type="text" value={formData.batch_number} onChange={handleChange} placeholder="e.g., BN12345" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity_available">Quantity Available</Label>
                  <Input id="quantity_available" name="quantity_available" type="number" min="0" value={formData.quantity_available} onChange={handleChange} placeholder="Enter quantity" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiry_date">Expiry Date</Label>
                  <Input id="expiry_date" name="expiry_date" type="date" value={formData.expiry_date} onChange={handleChange} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Storage Location</Label>
                  <Input id="location" name="location" type="text" value={formData.location} onChange={handleChange} placeholder="e.g., Refrigerator A, Shelf 2" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select id="status" name="status" value={formData.status} onChange={handleChange} className="w-full border rounded px-2 py-2" required>
                    <option value="Good">Good</option>
                    <option value="Expired">Expired</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} placeholder="Additional information..." className="resize-none" rows={3} />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {initialVaccine ? 'Updating...' : 'Adding...'}
                  </>
                ) : initialVaccine && initialVaccine.id ? 'Update Vaccine' : 'Add Vaccine'}
              </Button>

              {initialVaccine && initialVaccine.id && (
                <div className="mt-3">
                  <Button variant="destructive" className="w-full bg-red-600 text-white" onClick={(e) => { e.stopPropagation(); handleDelete(); }}>
                    <Trash className="w-4 h-4 mr-2 inline" /> Delete Vaccine
                  </Button>
                </div>
              )}
            </form>
          )}
        </CardContent>
      </Card>

      <DeleteConfirm open={showDeleteConfirm} title="Delete vaccine" message="Are you sure you want to delete this vaccine? This action cannot be undone." onConfirm={confirmDelete} onCancel={() => setShowDeleteConfirm(false)} />
    </div>
  );
};

export default AddVaccine;
