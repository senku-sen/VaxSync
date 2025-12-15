// ============================================
// SESSION PHOTOS UTILITY FUNCTIONS
// ============================================
// Handle photo uploads, retrieval, and deletion
// for vaccination session documentation
// ============================================

import { supabase } from "./supabase";

const BUCKET_NAME = "vaccination-session-photos";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Upload a photo to a vaccination session
 * @param {string} sessionId - Session ID
 * @param {File} file - Image file to upload
 * @param {string} caption - Photo caption
 * @param {string} photoType - Type of photo (setup, crowd, administration, etc.)
 * @param {string} userId - User ID uploading the photo
 * @returns {Promise<Object>} - { success: boolean, data: Object, error: string }
 */
export const uploadSessionPhoto = async (
  sessionId,
  file,
  caption,
  photoType,
  userId
) => {
  try {
    // Validate file
    if (!file) {
      return {
        success: false,
        data: null,
        error: "No file selected",
      };
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        success: false,
        data: null,
        error: "Invalid file type. Only JPG, PNG, and WebP allowed.",
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        data: null,
        error: `File too large. Maximum size is 5MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
      };
    }

    // Ensure client has Supabase auth session (required for Storage RLS)
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error("Auth session fetch error:", sessionError);
    }
    if (!sessionData?.session) {
      return {
        success: false,
        data: null,
        error: "Not authenticated with Supabase in the browser. Please sign in again and retry.",
      };
    }
    console.log("Uploading with auth user:", sessionData.session.user?.id);

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const fileExtension = file.name.split(".").pop();
    const fileName = `${sessionId}/${timestamp}_${photoType}_${random}.${fileExtension}`;

    console.log("Uploading photo:", fileName);

    // Upload to storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (storageError) {
      console.error("Storage upload error:", storageError);
      return {
        success: false,
        data: null,
        error: storageError.message || "Failed to upload photo to storage",
      };
    }

    console.log("Photo uploaded to storage:", storageData);

    // Get signed URL (valid for 7 days = 604800 seconds)
    // Using longer expiry than 1 hour to prevent "Image not available" issues
    const { data: urlData, error: urlError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(fileName, 604800); // 7 days

    if (urlError) {
      console.error("Signed URL error:", urlError);
      // Try to delete the uploaded file if URL generation fails
      await supabase.storage.from(BUCKET_NAME).remove([fileName]);
      return {
        success: false,
        data: null,
        error: "Failed to generate photo URL",
      };
    }

    const photoUrl = urlData.signedUrl;
    console.log("Generated signed URL:", photoUrl);

    // Save to database
    const { data: dbData, error: dbError } = await supabase
      .from("VaccinationSessionPhotos")
      .insert({
        session_id: sessionId,
        photo_url: photoUrl,
        caption: caption || null,
        photo_type: photoType,
        uploaded_by: userId,
        created_at: new Date().toISOString(),
      })
      .select();

    if (dbError) {
      console.error("Database insert error:", dbError);
      // Try to delete the uploaded file if database insert fails
      await supabase.storage.from(BUCKET_NAME).remove([fileName]);
      return {
        success: false,
        data: null,
        error: dbError.message || "Failed to save photo record",
      };
    }

    console.log("Photo saved to database:", dbData);

    return {
      success: true,
      data: dbData?.[0] || null,
      error: null,
    };
  } catch (err) {
    console.error("Unexpected error in uploadSessionPhoto:", err);
    return {
      success: false,
      data: null,
      error: err.message || "Unexpected error uploading photo",
    };
  }
};

/**
 * Fetch all photos for a session
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} - { success: boolean, data: Array, error: string }
 */
export const fetchSessionPhotos = async (sessionId) => {
  try {
    console.log("Fetching photos for session:", sessionId);

    const { data, error } = await supabase
      .from("VaccinationSessionPhotos")
      .select(
        `
        id,
        session_id,
        photo_url,
        caption,
        photo_type,
        uploaded_by,
        created_at,
        UserProfiles:uploaded_by(first_name, last_name, user_role)
      `
      )
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching photos:", error);
      return {
        success: false,
        data: [],
        error: error.message || "Failed to fetch photos",
      };
    }

    console.log("Photos fetched:", data?.length || 0);

    // Regenerate signed URLs for photos to ensure they don't expire
    // Extract file path from stored URL and create fresh signed URL
    const photosWithFreshUrls = await Promise.all(
      (data || []).map(async (photo) => {
        try {
          // Extract file path from the stored URL
          // URL format: https://...storage.supabase.co/object/sign/vaccination-session-photos/...
          const urlObj = new URL(photo.photo_url);
          const pathParts = urlObj.pathname.split("/");
          const objectIndex = pathParts.indexOf("vaccination-session-photos");
          
          if (objectIndex !== -1 && objectIndex + 2 < pathParts.length) {
            const filePath = `${pathParts[objectIndex + 1]}/${pathParts[objectIndex + 2]}`;
            
            // Generate fresh signed URL (7 days)
            const { data: urlData, error: urlError } = await supabase.storage
              .from(BUCKET_NAME)
              .createSignedUrl(filePath, 604800); // 7 days
            
            if (urlError) {
              console.error("Error regenerating URL for photo:", photo.id, urlError);
              return photo; // Return original if regeneration fails
            }
            
            return {
              ...photo,
              photo_url: urlData.signedUrl
            };
          }
          return photo;
        } catch (err) {
          console.error("Error processing photo URL:", err);
          return photo;
        }
      })
    );

    return {
      success: true,
      data: photosWithFreshUrls || [],
      error: null,
    };
  } catch (err) {
    console.error("Unexpected error in fetchSessionPhotos:", err);
    return {
      success: false,
      data: [],
      error: err.message || "Unexpected error",
    };
  }
};

/**
 * Delete a photo (only by uploader or head nurse)
 * @param {string} photoId - Photo ID to delete
 * @param {string} fileName - File name in storage
 * @returns {Promise<Object>} - { success: boolean, error: string }
 */
export const deleteSessionPhoto = async (photoId, fileName) => {
  try {
    console.log("Deleting photo:", photoId, fileName);

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileName]);

    if (storageError) {
      console.error("Storage deletion error:", storageError);
      // Continue to delete from database even if storage deletion fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from("VaccinationSessionPhotos")
      .delete()
      .eq("id", photoId);

    if (dbError) {
      console.error("Database deletion error:", dbError);
      return {
        success: false,
        error: dbError.message || "Failed to delete photo",
      };
    }

    console.log("Photo deleted successfully");

    return {
      success: true,
      error: null,
    };
  } catch (err) {
    console.error("Unexpected error in deleteSessionPhoto:", err);
    return {
      success: false,
      error: err.message || "Unexpected error",
    };
  }
};

/**
 * Update photo caption or type
 * @param {string} photoId - Photo ID
 * @param {Object} updates - { caption?, photo_type? }
 * @returns {Promise<Object>} - { success: boolean, data: Object, error: string }
 */
export const updateSessionPhoto = async (photoId, updates) => {
  try {
    console.log("Updating photo:", photoId, updates);

    const { data, error } = await supabase
      .from("VaccinationSessionPhotos")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", photoId)
      .select();

    if (error) {
      console.error("Error updating photo:", error);
      return {
        success: false,
        data: null,
        error: error.message || "Failed to update photo",
      };
    }

    console.log("Photo updated:", data);

    return {
      success: true,
      data: data?.[0] || null,
      error: null,
    };
  } catch (err) {
    console.error("Unexpected error in updateSessionPhoto:", err);
    return {
      success: false,
      data: null,
      error: err.message || "Unexpected error",
    };
  }
};

/**
 * Get file path from photo URL (for deletion)
 * @param {string} photoUrl - Photo URL
 * @returns {string} - File path
 */
export const getFilePathFromUrl = (photoUrl) => {
  try {
    // Extract path from signed URL
    // Format: https://...storage.supabase.co/object/sign/bucket-name/path?token=...
    const url = new URL(photoUrl);
    const pathParts = url.pathname.split("/");
    // Find the bucket name and get everything after it
    const bucketIndex = pathParts.indexOf(BUCKET_NAME);
    if (bucketIndex !== -1) {
      return pathParts.slice(bucketIndex + 1).join("/");
    }
    return null;
  } catch (err) {
    console.error("Error parsing file path:", err);
    return null;
  }
};

/**
 * Refresh signed URL (URLs expire after 1 hour)
 * @param {string} filePath - File path in storage
 * @returns {Promise<string>} - New signed URL
 */
export const refreshSignedUrl = async (filePath) => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 3600);

    if (error) {
      console.error("Error refreshing URL:", error);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.error("Unexpected error in refreshSignedUrl:", err);
    return null;
  }
};
