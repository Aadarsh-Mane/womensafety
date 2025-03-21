import { Readable } from "stream";
import cloudinary from "../helpers/cloudinary.js";

export const uploadToCloudinary = (
  fileBuffer,
  options = { folder: "uploads" }
) => {
  return new Promise((resolve, reject) => {
    if (!fileBuffer) return resolve(null);

    const bufferStream = new Readable();
    bufferStream.push(fileBuffer);
    bufferStream.push(null);

    const uploadStream = cloudinary.v2.uploader.upload_stream(
      { ...options },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );

    bufferStream.pipe(uploadStream);
  });
};
