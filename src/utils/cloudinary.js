import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});

// configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log("Finisehd trying to upload");

    // file uploaded succesfully
    fs.unlinkSync(localFilePath); // remove locally saved temp. file as upload faied.
    console.log("file uploaded succesfully on cloudinary");
    return uploadResult;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove locally saved temp. file as upload faied.
    // console.log("ENV var", process.env);
    console.log("error in upload::", error);
    return null;
  }
};

export { uploadOnCloudinary };
