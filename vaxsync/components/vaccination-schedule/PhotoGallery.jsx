// ============================================
// PHOTO GALLERY COMPONENT
// ============================================
// Display photos uploaded for a session
// Allow deletion and viewing
// ============================================

"use client";

import { useState } from "react";
import { Trash2, Eye, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteSessionPhoto } from "@/lib/sessionPhotos";

const PHOTO_TYPE_LABELS = {
  setup: "Setup & Preparation",
  crowd: "Crowd & Attendance",
  administration: "Vaccination Administration",
  incident: "Incident/Issue",
  completion: "Completion & Cleanup",
  documentation: "General Documentation",
};

const PHOTO_TYPE_COLORS = {
  setup: "bg-blue-100 text-blue-700",
  crowd: "bg-purple-100 text-purple-700",
  administration: "bg-green-100 text-green-700",
  incident: "bg-red-100 text-red-700",
  completion: "bg-yellow-100 text-yellow-700",
  documentation: "bg-gray-100 text-gray-700",
};

export default function PhotoGallery({
  photos,
  isLoading,
  canDelete,
  onPhotoDeleted,
  userRole,
}) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const handleDelete = async (photoId, fileName) => {
    if (!window.confirm("Are you sure you want to delete this photo?")) {
      return;
    }

    setIsDeleting(photoId);
    setDeleteError(null);

    try {
      const result = await deleteSessionPhoto(photoId, fileName);

      if (result.success) {
        if (onPhotoDeleted) {
          onPhotoDeleted(photoId);
        }
      } else {
        setDeleteError(result.error || "Failed to delete photo");
      }
    } catch (err) {
      setDeleteError(err.message || "Unexpected error");
    } finally {
      setIsDeleting(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFilePathFromUrl = (url) => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/");
      // Extract session_id/filename from path
      // Path format: /storage/v1/object/public/vaccination-session-photos/session_id/filename
      const objectIndex = pathParts.indexOf("vaccination-session-photos");
      if (objectIndex !== -1 && objectIndex + 2 < pathParts.length) {
        return `${pathParts[objectIndex + 1]}/${pathParts[objectIndex + 2]}`;
      }
      return pathParts[pathParts.length - 1];
    } catch {
      return "photo";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-[#4A7C59] border-t-transparent"></div>
        <p className="ml-2 text-gray-600">Loading photos...</p>
      </div>
    );
  }

  if (!photos || photos.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-600">No photos uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {deleteError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{deleteError}</p>
        </div>
      )}

      {/* Photo Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Photo Image */}
            <div className="relative bg-gray-100 aspect-square overflow-hidden">
              <img
                src={photo.photo_url}
                alt={photo.caption || "Session photo"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error("Image failed to load:", photo.photo_url);
                  e.target.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23e5e7eb' width='200' height='200'/%3E%3Ctext x='50%' y='50%' font-size='14' fill='%236b7280' text-anchor='middle' dy='.3em'%3EImage not available%3C/text%3E%3C/svg%3E";
                }}
              />

              {/* Action Buttons Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 transition-all flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedPhoto(photo);
                  }}
                  className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                  title="View full size"
                >
                  <Eye className="w-5 h-5 text-gray-700" />
                </button>

                {/* Delete button - only for uploader or head nurse */}
                {(canDelete || userRole === "Head Nurse") && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(photo.id, getFilePathFromUrl(photo.photo_url));
                    }}
                    disabled={isDeleting === photo.id}
                    className="p-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 rounded-full transition-colors"
                    title="Delete photo"
                  >
                    {isDeleting === photo.id ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    ) : (
                      <Trash2 className="w-5 h-5 text-white" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Photo Info */}
            <div className="p-3 space-y-2">
              {/* Photo Type Badge */}
              <div>
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    PHOTO_TYPE_COLORS[photo.photo_type] ||
                    PHOTO_TYPE_COLORS.documentation
                  }`}
                >
                  {PHOTO_TYPE_LABELS[photo.photo_type] ||
                    photo.photo_type}
                </span>
              </div>

              {/* Caption */}
              {photo.caption && (
                <p className="text-sm text-gray-700 line-clamp-2">
                  {photo.caption}
                </p>
              )}

              {/* Uploader Info */}
              <div className="text-xs text-gray-500 space-y-1">
                <p>
                  By:{" "}
                  <span className="font-medium">
                    {photo.user_profiles?.first_name}{" "}
                    {photo.user_profiles?.last_name}
                  </span>
                </p>
                <p>{formatDate(photo.created_at)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full Size Photo Modal */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-2xl" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>
              {selectedPhoto?.caption || "Session Photo"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Full Size Image */}
            <img
              src={selectedPhoto?.photo_url}
              alt={selectedPhoto?.caption || "Session photo"}
              className="w-full rounded-lg"
            />

            {/* Photo Details */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div>
                <p className="text-xs text-gray-600">Photo Type</p>
                <p className="text-sm font-medium">
                  {PHOTO_TYPE_LABELS[selectedPhoto?.photo_type] ||
                    selectedPhoto?.photo_type}
                </p>
              </div>

              {selectedPhoto?.caption && (
                <div>
                  <p className="text-xs text-gray-600">Caption</p>
                  <p className="text-sm">{selectedPhoto.caption}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-600">Uploaded By</p>
                <p className="text-sm font-medium">
                  {selectedPhoto?.user_profiles?.first_name}{" "}
                  {selectedPhoto?.user_profiles?.last_name}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-600">Date & Time</p>
                <p className="text-sm">
                  {formatDate(selectedPhoto?.created_at)}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
