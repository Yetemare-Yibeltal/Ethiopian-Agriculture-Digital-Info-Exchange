// frontend/src/utils/supabase.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "❌ Missing Supabase environment variables. Please check your .env file.",
  );
  console.error(
    "   VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.",
  );
}

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export the URL for other services
export const SUPABASE_URL = supabaseUrl;

// Helper function to upload a file to Supabase Storage
export const uploadFile = async (bucket, filePath, file) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      success: true,
      data: {
        path: filePath,
        publicUrl: urlData.publicUrl,
        ...data,
      },
      error: null,
    };
  } catch (error) {
    console.error("❌ File upload error:", error.message);
    return {
      success: false,
      data: null,
      error: error.message,
    };
  }
};

// Helper function to delete a file from Supabase Storage
export const deleteFile = async (bucket, filePath) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) throw error;

    return {
      success: true,
      data: data,
      error: null,
    };
  } catch (error) {
    console.error("❌ File deletion error:", error.message);
    return {
      success: false,
      data: null,
      error: error.message,
    };
  }
};

// Helper function to list files in a bucket folder
export const listFiles = async (bucket, folder = "") => {
  try {
    const { data, error } = await supabase.storage.from(bucket).list(folder);

    if (error) throw error;

    // Add public URLs to each file
    const filesWithUrls = data.map((file) => {
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(folder ? `${folder}/${file.name}` : file.name);

      return {
        ...file,
        publicUrl: urlData.publicUrl,
      };
    });

    return {
      success: true,
      data: filesWithUrls,
      error: null,
    };
  } catch (error) {
    console.error("❌ List files error:", error.message);
    return {
      success: false,
      data: null,
      error: error.message,
    };
  }
};

export default supabase;
