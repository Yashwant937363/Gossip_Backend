// Require the cloudinary library
import { v2 as cloudinary } from "cloudinary";
import { config } from "dotenv";

config();
// Return "https" URLs by setting secure: true
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const uploadImage = async (imagePath) => {
  const options = {
    use_filename: true,
    unique_filename: false,
    overwrite: true,
  };

  try {
    // Upload the image
    const result = await cloudinary.uploader.upload(imagePath, options);
    console.log(result);
    return result.public_id;
  } catch (error) {
    console.error(error);
  }
};

uploadImage(
  "/home/yashwant/MyProject/Gossip/Gossip_Backend/assets/profile/yashwant.poyrekar@mldc.edu.in.png",
);
