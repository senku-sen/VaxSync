// ============================================
// PHOTO UPLOAD MODAL
// ============================================
// Allows health workers to upload photos
// during vaccination sessions
// ============================================

"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, AlertCircle, CheckCircle } from "lucide-react";
import { uploadSessionPhoto } from "@/lib/sessionPhotos";

const PHOTO_TYPES = [
  { value: "setup", label: "Setup & Preparation" },
  { value: "crowd", label: "Crowd & Attendance" },
  { value: "completion", label: "Completion & Cleanup" },
  { value: "documentation", label: "General Documentation" },
];

export default function PhotoUploadModal({
  isOpen,
  onClose,
  sessionId,
  userId,
  onPhotoUploaded,
}) {
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [photoType, setPhotoType] = useState("documentation");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await uploadSessionPhoto(
        sessionId,
        file,
        caption,
        photoType,
        userId
      );

      if (result.success) {
        setSuccess(true);
        setFile(null);
        setCaption("");
        setPhotoType("documentation");

        // Call callback to refresh photos
        if (onPhotoUploaded) {
          onPhotoUploaded(result.data);
        }

        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(result.error || "Failed to upload photo");
      }
    } catch (err) {
      setError(err.message || "Unexpected error during upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setFile(null);
      setCaption("");
      setPhotoType("documentation");
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full sm:w-[600px] sm:max-w-[600px] max-h-[120vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg">Upload Session Photo</DialogTitle>
          <DialogDescription className="text-xs">
            Document your vaccination session with photos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-xs text-green-700">Photo uploaded successfully!</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {/* File Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded p-4 text-center cursor-pointer hover:border-[#4A7C59] hover:bg-green-50 transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={isUploading}
              className="hidden"
            />

            {file ? (
              <div className="space-y-1">
                <div className="flex justify-center">
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Preview"
                    className="max-h-24 rounded"
                  />
                </div>
                <p className="text-xs font-medium text-gray-700 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <Upload className="w-6 h-6 text-gray-400 mx-auto" />
                <p className="text-xs font-medium text-gray-700">
                  Drop image or click to select
                </p>
                <p className="text-xs text-gray-500">
                  JPG, PNG, WebP • Max 5MB
                </p>
              </div>
            )}
          </div>

          {/* Photo Type Selector */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Photo Type
            </label>
            <Select value={photoType} onValueChange={setPhotoType}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PHOTO_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-sm">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Caption Input */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Caption (Optional)
            </label>
            <Input
              placeholder="Describe what's in this photo..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={isUploading}
              maxLength={200}
              className="text-xs h-8"
            />
            <p className="text-xs text-gray-500 mt-0.5">
              {caption.length}/200
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
              className="flex-1 h-9 text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="flex-1 h-9 text-sm bg-[#4A7C59] hover:bg-[#3E6B4D]"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-1" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-3 h-3 mr-1" />
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
