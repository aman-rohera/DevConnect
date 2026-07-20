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

export interface UploadedMedia {
  url: string;
  type: "image" | "video";
}

// Function to upload generic media (image or video) to Cloudinary
export const uploadMediaFile = async (file: File): Promise<UploadedMedia> => {
  if (!file) throw new Error("No file provided");
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error("Cloudinary credentials are not configured in VITE environment variables.");
  }

  const isVideo = file.type.startsWith("video/");
  const resourceType = isVideo ? "video" : "image";
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await axios.post(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
    formData
  );

  return {
    url: response.data.secure_url,
    type: resourceType
  };
};

// Function to upload PDF documents (Resume/CV) to Cloudinary
export const uploadPdfFile = async (pdfFile: File): Promise<string> => {
  if (!pdfFile) throw new Error("No PDF file provided");
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error("Cloudinary credentials are not configured in VITE environment variables.");
  }

  const formData = new FormData();
  formData.append("file", pdfFile);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await axios.post(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
    formData
  );

  return response.data.secure_url;
};
