"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, X, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function UploadMasterListModal({ 
  isOpen, 
  onClose, 
  onUploadSuccess,
  userProfile,
  selectedBarangay 
}) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState([]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error("Please upload a CSV file");
        return;
      }
      
      setFile(selectedFile);
      setErrors([]);
      
      // Read and preview the file
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        setPreview(parseCSVPreview(text));
      };
      reader.readAsText(selectedFile);
    }
  };

  // Parse CSV to preview first few rows
  const parseCSVPreview = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) return null;
    
    const headers = parseCSVLine(lines[0]);
    const previewRows = [];
    
    for (let i = 1; i < Math.min(6, lines.length); i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length > 0) {
        previewRows.push(values);
      }
    }
    
    return { headers, rows: previewRows, totalRows: lines.length - 1 };
  };

  // Simple CSV line parser (handles quoted fields)
  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    if (!userProfile || !userProfile.id) {
      toast.error("User profile not loaded. Please refresh the page.");
      return;
    }

    setIsUploading(true);
    setErrors([]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('barangay', selectedBarangay || '');
      formData.append('submitted_by', userProfile.id);

      const response = await fetch('/api/residents/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Successfully uploaded ${data.successCount || 0} residents`);
        if (data.errors && data.errors.length > 0) {
          setErrors(data.errors);
          toast.warning(`${data.errors.length} rows had errors`);
        }
        setFile(null);
        setPreview(null);
        if (onUploadSuccess) {
          onUploadSuccess();
        }
        // Don't close automatically if there are errors, let user review
        if (!data.errors || data.errors.length === 0) {
          onClose();
        }
      } else {
        toast.error(data.error || "Failed to upload file");
        if (data.errors) {
          setErrors(data.errors);
        }
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Error uploading file: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setErrors([]);
    onClose();
  };

  // Validate CSV format
  const validateCSVFormat = () => {
    if (!preview || !preview.headers) return false;
    
    const headers = preview.headers.map(h => h.toLowerCase().trim());
    const requiredHeaders = ['name', 'sex', 'birthday'];
    
    // Check if at least required headers exist
    const hasName = headers.some(h => h.includes('name'));
    const hasSex = headers.some(h => h.includes('sex'));
    const hasBirthday = headers.some(h => h.includes('birthday') || h.includes('birth'));
    
    return hasName && hasSex && hasBirthday;
  };

  const isValidFormat = validateCSVFormat();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Master List</DialogTitle>
          <DialogDescription>
            Upload a CSV file containing resident information. The file should have columns: NO., NAME, SEX, BIRTHDAY, DATE OF VACCINE, VACCINE GIVEN
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Input */}
          <div>
            <Label htmlFor="csv-file">CSV File</Label>
            <div className="mt-2 flex items-center gap-4">
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isUploading}
                className="flex-1"
              />
              {file && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4" />
                  <span>{file.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                      setErrors([]);
                    }}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Preview ({preview.totalRows} rows)</h3>
                {isValidFormat ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Valid format</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Invalid format</span>
                  </div>
                )}
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b">
                      {preview.headers.map((header, idx) => (
                        <th key={idx} className="text-left p-2 font-semibold bg-gray-50">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, rowIdx) => (
                      <tr key={rowIdx} className="border-b">
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx} className="p-2">
                            {cell || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="border rounded-lg p-4 bg-red-50">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold text-red-900">Errors ({errors.length})</h3>
              </div>
              <div className="max-h-40 overflow-y-auto">
                <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                  {errors.slice(0, 20).map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                  {errors.length > 20 && (
                    <li className="text-gray-600">... and {errors.length - 20} more errors</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={!file || isUploading || !isValidFormat}
              className="bg-[#3E5F44] hover:bg-[#3E5F44]/90 text-white"
            >
              {isUploading ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

