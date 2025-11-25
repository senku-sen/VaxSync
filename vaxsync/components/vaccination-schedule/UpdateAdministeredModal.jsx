// ============================================
// UPDATE ADMINISTERED MODAL
// ============================================
// Modal for updating administered count and status
// Shows progress bar and allows status change
// Includes photo upload and gallery for documentation
// ============================================

"use client";

import { useState, useEffect } from "react";
import { X, AlertCircle, CheckCircle, Camera } from "lucide-react";
import PhotoUploadModal from "./PhotoUploadModal";
import PhotoGallery from "./PhotoGallery";
import { fetchSessionPhotos } from "@/lib/sessionPhotos";
import { loadUserProfile } from "@/lib/vaccineRequest";

export default function UpdateAdministeredModal({
  isOpen,
  onClose,
  onSubmit,
  session = null,
  isSubmitting = false,
  errors = {},
  isViewOnly = false
}) {
  const [isPhotoUploadOpen, setIsPhotoUploadOpen] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showPhotos, setShowPhotos] = useState(false);

  // Load user profile and photos when modal opens
  useEffect(() => {
    if (isOpen && session?.id) {
      loadUserData();
      loadPhotos();
    }
  }, [isOpen, session?.id]);

  const loadUserData = async () => {
    const profile = await loadUserProfile();
    setUserProfile(profile);
  };

  const loadPhotos = async () => {
    if (!session?.id) return;
    setIsLoadingPhotos(true);
    try {
      const result = await fetchSessionPhotos(session.id);
      if (result.success) {
        setPhotos(result.data);
      }
    } catch (err) {
      console.error("Error loading photos:", err);
    } finally {
      setIsLoadingPhotos(false);
    }
  };

  const handlePhotoUploaded = (newPhoto) => {
    setPhotos([newPhoto, ...photos]);
    setIsPhotoUploadOpen(false);
  };

  const handlePhotoDeleted = (photoId) => {
    setPhotos(photos.filter((p) => p.id !== photoId));
  };

  if (!isOpen || !session) return null;

  const administered = session.administered || 0;
  const target = session.target || 0;
  const progress = target > 0 ? Math.round((administered / target) * 100) : 0;

  // Check if health worker can upload photos (session is in progress or completed)
  const canUploadPhotos =
    !isViewOnly &&
    userProfile &&
    userProfile.user_role === "Health Worker" &&
    (session.status === "In progress" || session.status === "Completed");

  const handleChange = (e) => {
    if (isViewOnly) return;
    const { name, value } = e.target;
    onSubmit({
      ...session,
      [name]: name === 'administered' ? Math.min(parseInt(value, 10) || 0, target) : value
    }, 'update');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center  bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Update Vaccination Progress</h2>
            <p className="text-sm text-gray-500 mt-1">
              {session.barangays?.name || "Barangay"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Session Info */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Vaccine</p>
                <p className="font-semibold text-gray-900">{session.vaccines?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-600">Date & Time</p>
                <p className="font-semibold text-gray-900">{session.session_date} {session.session_time}</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">Progress</label>
              <span className="text-sm font-semibold text-gray-900">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  progress === 100 ? 'bg-green-600' :
                  progress >= 75 ? 'bg-yellow-600' :
                  progress >= 50 ? 'bg-blue-600' :
                  'bg-orange-600'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {administered} of {target} people vaccinated
            </p>
          </div>

          {/* Validation Errors */}
          {Object.keys(errors).length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700">Please fix the errors</p>
                {Object.values(errors).map((error, idx) => (
                  error && <p key={idx} className="text-sm text-red-600">{error}</p>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={(e) => {
            e.preventDefault();
            if (!isViewOnly) {
              onSubmit(session, 'submit');
            }
          }} className="space-y-4">
            {/* View Only Notice */}
            {isViewOnly && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-700">View Only</p>
                  <p className="text-xs text-blue-600">You can view the progress but cannot edit it</p>
                </div>
              </div>
            )}

            {/* Administered Count */}
            <div>
              <label htmlFor="administered" className="block text-sm font-medium text-gray-700 mb-2">
                Administered Count <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="number"
                  id="administered"
                  name="administered"
                  value={session.administered || 0}
                  onChange={handleChange}
                  min="0"
                  max={target}
                  disabled={isViewOnly || session.status === "Scheduled" || session.status === "Cancelled"}
                  className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent ${
                    errors.administered ? 'border-red-500' : 'border-gray-300'
                  } ${(isViewOnly || session.status === "Scheduled" || session.status === "Cancelled") ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
                />
                <span className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 font-medium">
                  / {target}
                </span>
              </div>

              {/* Quick Add Buttons */}
              {!isViewOnly && session.status !== "Scheduled" && session.status !== "Cancelled" && (
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[3, 5, 10, 20].map((increment) => (
                    <button
                      key={increment}
                      type="button"
                      onClick={() => {
                        const newValue = Math.min((session.administered || 0) + increment, target);
                        onSubmit({
                          ...session,
                          administered: newValue
                        }, 'update');
                      }}
                      disabled={isViewOnly || (session.administered || 0) >= target}
                      className="px-2 py-2 bg-[#4A7C59] hover:bg-[#3E6B4D] text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +{increment}
                    </button>
                  ))}
                </div>
              )}

              {isViewOnly && (
                <p className="text-xs text-blue-500 mt-1">
                  This is a read-only view
                </p>
              )}
              {!isViewOnly && session.status === "Scheduled" && (
                <p className="text-xs text-gray-500 mt-1">
                  Change status to "In progress" to edit administered count
                </p>
              )}
              {!isViewOnly && session.status === "Cancelled" && (
                <p className="text-xs text-red-500 mt-1">
                  This session is cancelled - editing is disabled
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={session.status || "Scheduled"}
                onChange={handleChange}
                disabled={isViewOnly}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent ${
                  errors.status ? 'border-red-500' : 'border-gray-300'
                } ${isViewOnly ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
              >
                <option value="Scheduled">Scheduled</option>
                <option value="In progress">In progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {progress === 100 && administered > 0 ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle size={14} /> All targets met - consider marking as Completed
                  </span>
                ) : null}
              </p>
            </div>

            {/* Status Info */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-600">
                <span className="font-semibold">Current Status:</span> {session.status || "Scheduled"}
              </p>
              {progress === 100 && administered > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ All vaccination targets have been met
                </p>
              )}
            </div>

            {/* Photo Upload Section */}
            {(canUploadPhotos || photos.length > 0) && (
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Session Documentation
                  </h3>
                  {photos.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowPhotos(!showPhotos)}
                      className="text-xs font-medium text-[#4A7C59] hover:text-[#3E6B4D]"
                    >
                      {showPhotos ? "Hide" : "Show"} ({photos.length})
                    </button>
                  )}
                </div>

                {/* Upload Button */}
                {canUploadPhotos && (
                  <button
                    type="button"
                    onClick={() => setIsPhotoUploadOpen(true)}
                    className="w-full mb-4 px-4 py-2 border-2 border-dashed border-[#4A7C59] text-[#4A7C59] font-medium rounded-lg hover:bg-green-50 transition-colors"
                  >
                    <Camera className="w-4 h-4 inline mr-2" />
                    Upload Photo
                  </button>
                )}

                {/* Photo Gallery */}
                {showPhotos && photos.length > 0 && (
                  <div className="mt-4 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3" onClick={(e) => e.stopPropagation()}>
                    <PhotoGallery
                      photos={photos}
                      isLoading={isLoadingPhotos}
                      canDelete={
                        userProfile?.user_role === "Health Worker"
                      }
                      onPhotoDeleted={handlePhotoDeleted}
                      userRole={userProfile?.user_role}
                    />
                  </div>
                )}

                {/* Empty State */}
                {!canUploadPhotos && photos.length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-2">
                    No photos uploaded yet
                  </p>
                )}
              </div>
            )}

          </form>
        </div>

        {/* Modal Footer - Fixed at bottom */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-white flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Close
          </button>
          {!isViewOnly && (
            <button
              type="submit"
              disabled={isSubmitting}
              onClick={() => onSubmit(session, 'submit')}
              className="flex-1 px-4 py-2.5 bg-[#4A7C59] hover:bg-[#3E6B4D] text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Updating..." : "Update Progress"}
            </button>
          )}
        </div>
      </div>

      {/* Photo Upload Modal */}
      <PhotoUploadModal
        isOpen={isPhotoUploadOpen}
        onClose={() => setIsPhotoUploadOpen(false)}
        sessionId={session?.id}
        userId={userProfile?.id}
        onPhotoUploaded={handlePhotoUploaded}
      />
    </div>
  );
}
