// lib/cloudinary/config.ts
import { v2 as cloudinary } from 'cloudinary';

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
    url: {
    secure: true,
    private_cdn: false,
    sign_url: false // ← Important!
  }
});

export default cloudinary;