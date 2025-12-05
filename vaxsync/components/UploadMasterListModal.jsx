
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

  // Check if a row is empty or invalid (only dashes, empty values, etc.)
  const isEmptyRow = (values) => {
    if (!values || values.length === 0) return true;
    const nonEmpty = values.filter(v => v && v.trim() && v.trim() !== '-');
    return nonEmpty.length === 0;
  };

  // Detect barangay name from CSV (usually in first few rows, before header)
  const detectBarangayFromCSV = (lines, headerRowIndex) => {
    // Known barangay names for validation
    const knownBarangays = [
      'mancruz', 'alawihao', 'bibirao', 'calasgasan', 'camambugan',
      'dogongan', 'magang', 'pamorangan', 'barangay ii'
    ];
    
    // Check rows before the header row
    for (let i = 0; i < headerRowIndex && i < 10; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = parseCSVLine(line);
      if (isEmptyRow(values)) continue;
      
      // Check each cell in the row
      for (const cell of values) {
        const cleaned = cell.trim().toLowerCase();
        if (!cleaned || cleaned.length < 3) continue;
        
        // Check if it matches a known barangay (case-insensitive)
        const matchedBarangay = knownBarangays.find(b => cleaned.includes(b) || b.includes(cleaned));
        if (matchedBarangay) {
          // Return proper case version
          const index = knownBarangays.indexOf(matchedBarangay);
          const properCaseBarangays = [
            'Mancruz', 'Alawihao', 'Bibirao', 'Calasgasan', 'Camambugan',
            'Dogongan', 'Magang', 'Pamorangan', 'Barangay II'
          ];
          return properCaseBarangays[index];
        }
        
        // Also check if it's a single word that looks like a barangay name
        if (cleaned.length >= 4 && cleaned.length <= 20 && 
            !cleaned.match(/^\d+$/) && 
            !cleaned.includes('name') && !cleaned.includes('sex') && 
            !cleaned.includes('birthday') && !cleaned.includes('vaccine')) {
          // Return with proper capitalization
          return cleaned.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ');
        }
      }
    }
    
    return null;
  };

  // Find header row by looking for required columns
  const findHeaderRow = (lines) => {
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      const values = parseCSVLine(lines[i]);
      const headers = values.map(h => h.toLowerCase().trim());
      
      // Check if this row contains the required column headers
      const hasName = headers.some(h => h.includes('name') && h.length > 2);
      const hasSex = headers.some(h => h.includes('sex'));
      const hasBirthday = headers.some(h => (h.includes('birthday') || h.includes('birth')) && h.length > 3);
      
      if (hasName && hasSex && hasBirthday) {
        return { rowIndex: i, headers: values };
      }
    }
    return null;
  };

  // Parse CSV to preview first few rows
  const parseCSVPreview = (csvText) => {
    const lines = csvText.split('\n');
    if (lines.length === 0) return null;
    
    // Find the header row
    const headerInfo = findHeaderRow(lines);
    if (!headerInfo) {
      // If no header found, try using first row
      return { 
        headers: parseCSVLine(lines[0] || ''), 
        rows: [], 
        totalRows: lines.length - 1,
        headerRowIndex: 0
      };
    }
    
    const headers = headerInfo.headers;
    const headerRowIndex = headerInfo.rowIndex;
    
    // Detect barangay from CSV
    const detectedBarangay = detectBarangayFromCSV(lines, headerRowIndex);
    
    const previewRows = [];
    
    // Show data rows after the header (skip empty rows)
    let dataRowCount = 0;
    for (let i = headerRowIndex + 1; i < lines.length && dataRowCount < 5; i++) {
      const values = parseCSVLine(lines[i]);
      if (!isEmptyRow(values)) {
        previewRows.push(values);
        dataRowCount++;
      }
    }
    
    // Count total data rows (excluding header and empty rows)
    let totalDataRows = 0;
    for (let i = headerRowIndex + 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (!isEmptyRow(values)) {
        totalDataRows++;
      }
    }
    
    return { 
      headers, 
      rows: previewRows, 
      totalRows: totalDataRows,
      headerRowIndex,
      detectedBarangay,
      allLines: lines.slice(0, Math.min(10, headerRowIndex + 5)) // Include some context before header
    };
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
      // Use detected barangay from CSV if available, otherwise use selected barangay
      const barangayToUse = preview?.detectedBarangay || selectedBarangay || '';
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('barangay', barangayToUse);
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

  // Validate CSV format - lenient: just check if headers were found
  const validateCSVFormat = () => {
    if (!preview || !preview.headers) return false;
    
    // If we have headers and at least some rows, consider it valid
    // The API will do the actual validation
    return preview.headers.length > 0 && preview.totalRows >= 0;
  };

  const isValidFormat = validateCSVFormat();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[98vw] max-w-full h-[75vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Upload Master List</DialogTitle>
          <DialogDescription>
            Upload a CSV file containing resident information. The file should have columns: NAME, SEX, BIRTHDAY, ADMINISTERED DATE, VACCINES GIVEN, DEFAULTERS (optional)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1">
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

            {/* CSV Preview */}
            {preview && (
              <div className="border rounded-lg p-4 space-y-4">
                <div>
                  {preview.headers && preview.headers.length > 0 ? (
                    <div className="flex items-center gap-2 text-blue-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Ready to upload ({preview.totalRows} data rows found)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-yellow-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">Header row will be auto-detected during upload</span>
                    </div>
                  )}
                </div>
                
                <div className="overflow-x-auto border rounded flex-1 flex flex-col">
                  {preview.headerRowIndex > 0 && (
                    <div className="mb-2 text-xs text-gray-500 px-3 pt-2">
                      Note: Header row found at row {preview.headerRowIndex + 1}. Previous rows will be skipped.
                    </div>
                  )}
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b bg-gray-100 sticky top-0">
                        {preview.headers.map((header, idx) => (
                          <th key={idx} className="text-left p-2 font-semibold whitespace-nowrap">
                            {header || `Column ${idx + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.length > 0 ? (
                        preview.rows.map((row, rowIdx) => (
                          <tr key={rowIdx} className="border-b hover:bg-gray-50">
                            {preview.headers.map((_, cellIdx) => (
                              <td key={cellIdx} className="p-2 whitespace-nowrap">
                                {row[cellIdx] || '-'}
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={preview.headers.length} className="p-4 text-center text-gray-500">
                            No data rows found (empty rows are skipped)
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

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
          <div className="flex justify-end space-x-2 border-t pt-4">
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
              disabled={!file || isUploading}
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
