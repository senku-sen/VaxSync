"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import DeleteConfirm from './DeleteConfirm';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

const AddVaccine = ({ onSuccess, vaccine: initialVaccine, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    quantity_available: '',
    expiry_date: '',
    notes: '',
    status: 'Good',
  });
  
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (initialVaccine) {
      setFormData({
        name: initialVaccine.name || '',
        quantity_available:
          initialVaccine.quantity_available !== null &&
          initialVaccine.quantity_available !== undefined
            ? String(initialVaccine.quantity_available)
            : '',
        expiry_date: initialVaccine.expiry_date || '',
        notes: initialVaccine.notes || '',
        status: initialVaccine.status || 'Good'
      });
    } else {
      setFormData({
        name: '',
        quantity_available: '',
        expiry_date: '',
        notes: '',
        status: 'Good'
      });
    }
    setIsLoading(false);
  }, [initialVaccine]);

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'Vaccine name is required';
    }

    if (formData.quantity_available === '') {
      newErrors.quantity_available = 'Quantity is required';
    }

    if (!formData.expiry_date) {
      newErrors.expiry_date = 'Expiry date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showAlert('error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const qty = formData.quantity_available === '' ? null : parseInt(formData.quantity_available, 10);
      let data, error;

      if (initialVaccine && initialVaccine.id) {
        ({ data, error } = await supabase
          .from('vaccines')
          .update({
            name: formData.name,
            quantity_available: qty,
            expiry_date: formData.expiry_date,
            notes: formData.notes,
            status: formData.status || 'Good'
          })
          .eq('id', initialVaccine.id)
          .select());
      } else {
        ({ data, error } = await supabase
          .from('vaccines')
          .insert({
            name: formData.name,
            quantity_available: qty,
            expiry_date: formData.expiry_date,
            notes: formData.notes,
            status: formData.status || 'Good',
            created_at: new Date().toISOString()
          })
          .select());
      }
      
      if (error) {
        console.error('Error saving vaccine:', error);
        showAlert('error', `Failed to save vaccine: ${error.message || 'Unknown'}`);
      } else {
        showAlert('success', initialVaccine && initialVaccine.id ? 'Vaccine updated' : 'Vaccine added');
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

  const handleDelete = async () => {
    if (!initialVaccine || !initialVaccine.id) return;
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!initialVaccine || !initialVaccine.id) return;
    setShowDeleteConfirm(false);
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('vaccines').delete().eq('id', initialVaccine.id);
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
    <div className="w-full">
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
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vaccine Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                Vaccine Name <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="name" 
                name="name" 
                type="text" 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="e.g., COVID-19, Influenza" 
                className={`border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#4A7C59] transition-all ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                required 
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>

            {/* Quantity Available */}
            <div className="space-y-2">
              <Label htmlFor="quantity_available" className="text-sm font-semibold text-gray-700">
                Quantity Available <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="quantity_available" 
                name="quantity_available" 
                type="number" 
                min="0" 
                value={formData.quantity_available} 
                onChange={handleChange} 
                placeholder="Enter quantity" 
                className={`border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#4A7C59] transition-all ${errors.quantity_available ? 'border-red-500' : 'border-gray-300'}`}
                required 
              />
              {errors.quantity_available && <p className="text-red-500 text-sm">{errors.quantity_available}</p>}
            </div>

            {/* Expiry Date */}
            <div className="space-y-2">
              <Label htmlFor="expiry_date" className="text-sm font-semibold text-gray-700">
                Expiry Date <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="expiry_date" 
                name="expiry_date" 
                type="date" 
                value={formData.expiry_date} 
                onChange={handleChange} 
                className={`border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#4A7C59] transition-all ${errors.expiry_date ? 'border-red-500' : 'border-gray-300'}`}
                required 
              />
              {errors.expiry_date && <p className="text-red-500 text-sm">{errors.expiry_date}</p>}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-semibold text-gray-700">
                Status
              </Label>
              <select 
                id="status" 
                name="status" 
                value={formData.status} 
                onChange={handleChange} 
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#4A7C59] transition-all" 
                required
              >
                <option value="Good">Good</option>
                <option value="Expired">Expired</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Damaged">Damaged</option>
              </select>
            </div>

            {/* Notes */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes" className="text-sm font-semibold text-gray-700">
                Notes <span className="text-gray-500 text-xs">(Optional)</span>
              </Label>
              <Textarea 
                id="notes" 
                name="notes" 
                value={formData.notes} 
                onChange={handleChange} 
                placeholder="Additional information about the vaccine..." 
                className="resize-none border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#4A7C59] transition-all" 
                rows={3} 
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="submit" 
              className="flex-1 bg-[#4A7C59] hover:bg-[#3E6B4D] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                  {initialVaccine ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                (initialVaccine && initialVaccine.id) ? 'Update Vaccine' : 'Add Vaccine'
              )}
            </button>
            {initialVaccine && initialVaccine.id && (
              <button 
                type="button"
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors" 
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
      )}
      <DeleteConfirm
        open={showDeleteConfirm}
        title="Delete vaccine"
        message="Are you sure you want to delete this vaccine? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};

export default AddVaccine;
