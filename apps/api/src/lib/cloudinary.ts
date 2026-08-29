import { v2 as cloudinary } from "cloudinary";
import { env } from "../config.js";

let configured = false;

export function getCloudinary() {
  if (!configured) {
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      throw new Error("Cloudinary credentials are not configured");
    }
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });
    configured = true;
  }
  return cloudinary;
}

export async function uploadAadhaarDocument(
  userId: string,
  fileBuffer: Buffer,
  originalName: string
): Promise<{ publicId: string; secureUrl: string }> {
  const folder = `${env.CLOUDINARY_AADHAAR_FOLDER}/${userId}`;
  const publicId = `${folder}/${Date.now()}-${originalName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

  const result = await new Promise<{ publicId: string; secureUrl: string }>((resolve, reject) => {
    const uploadStream = getCloudinary().uploader.upload_stream(
      {
        public_id: publicId,
        type: "authenticated",
        overwrite: true,
        resource_type: "auto",
      },
      (error, result) => {
        if (error || !result) {
          return reject(error ?? new Error("Cloudinary upload failed"));
        }
        return resolve({ publicId: result.public_id, secureUrl: result.secure_url });
      }
    );
    uploadStream.end(fileBuffer);
  });

  return result;
}

export async function generateSignedAadhaarUrl(publicId: string, expiresInSeconds = 300) {
  return getCloudinary().url(publicId, {
    type: "authenticated",
    sign_url: true,
    secure: true,
    expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
  });
}
