import axios from "axios";

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Function to upload profile photo to Cloudinary
export const uploadProfilePhoto = async (profilePhotoFile: File): Promise<string> => {
  if (!profilePhotoFile) throw new Error("No profile photo file provided");
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error("Cloudinary credentials are not configured in VITE environment variables.");
  }

  const formData = new FormData();
  formData.append("file", profilePhotoFile);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await axios.post(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    formData
  );

  return response.data.secure_url;
};
