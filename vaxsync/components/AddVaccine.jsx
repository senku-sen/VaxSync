// ...existing code...
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

const AddVaccine = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    batch_number: '',
    quantity_available: '',
    expiry_date: '',
    location: '',
    notes: '',
    status: 'Good' // default status
  });
  const [vaccines, setVaccines] = useState([]);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchVaccines();
  }, []);

  const fetchVaccines = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('vaccines')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching vaccines:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        if (error.code === '42501' || (error.message && error.message.includes('policy'))) {
          showAlert('error', 'Access denied. Please ensure you are logged in with proper permissions.');
        } else {
          showAlert('error', `Failed to fetch vaccines: ${error.message || 'Unknown error'}`);
        }
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
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const qty = formData.quantity_available === '' ? null : parseInt(formData.quantity_available, 10);

      const { data, error } = await supabase
        .from('vaccines')
        .insert({
          name: formData.name,
          batch_number: formData.batch_number,
          quantity_available: qty,
          expiry_date: formData.expiry_date,
          location: formData.location,
          notes: formData.notes,
          status: formData.status || 'Good',
          created_at: new Date().toISOString()
        })
        .select();
      
      if (error) {
        console.error('Error inserting vaccine:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        if (error.code === '42501' || (error.message && error.message.includes('policy'))) {
          showAlert('error', 'Access denied. You need admin or officer permissions to add vaccines.');
        } else {
          showAlert('error', `Failed to add vaccine: ${error.message || 'Unknown error'}`);
        }
      } else {
        setFormData({
          name: '',
          batch_number: '',
          quantity_available: '',
          expiry_date: '',
          location: '',
          notes: '',
          status: 'Good'
        });
        showAlert('success', 'Vaccine added successfully!');
        fetchVaccines();
        if (typeof onSuccess === 'function') onSuccess();
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      showAlert('error', 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Vaccine</CardTitle>
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
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., COVID-19, Influenza"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batch_number">Batch Number</Label>
                  <Input
                    id="batch_number"
                    name="batch_number"
                    type="text"
                    value={formData.batch_number}
                    onChange={handleChange}
                    placeholder="e.g., BN12345"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity_available">Quantity Available</Label>
                  <Input
                    id="quantity_available"
                    name="quantity_available"
                    type="number"
                    min="0"
                    value={formData.quantity_available}
                    onChange={handleChange}
                    placeholder="Enter quantity"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiry_date">Expiry Date</Label>
                  <Input
                    id="expiry_date"
                    name="expiry_date"
                    type="date"
                    value={formData.expiry_date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Storage Location</Label>
                  <Input
                    id="location"
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Refrigerator A, Shelf 2"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full border rounded px-2 py-2"
                    required
                  >
                    <option value="Good">Good</option>
                    <option value="Expired">Expired</option>
                    <option value="Low Stock">Low Stock</option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Additional information..."
                    className="resize-none"
                    rows={3}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Vaccine...
                  </>
                ) : (
                  'Add Vaccine'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AddVaccine;
// ...existing code...