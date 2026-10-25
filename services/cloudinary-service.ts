import cloudinary from "../config/cloudinary.js";

export async function uploadImage(filePath: string): Promise<string> {
  const result = await cloudinary.uploader.upload(filePath, {
    resource_type: "image",
  });

  return result.secure_url;
}
