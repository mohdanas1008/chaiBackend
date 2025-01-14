import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
import { ApiError } from "./ApiError.js";
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
    fs.unlinkSync(localFilePath); // remove locally saved temp. file as upload finsihed.
    console.log("file uploaded succesfully on cloudinary");
    return uploadResult;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove locally saved temp. file as upload faied.
    // console.log("ENV var", process.env);
    console.log("error in upload::", error);
    return null;
  }
};

const deleteOnCloudinary = async (deletingImageUrl) => {
  try {
    const imagePublicId = deletingImageUrl
      .split("/")
      .slice(-1)[0]
      .split(".")[0];
    console.log(imagePublicId);
    if (!imagePublicId) {
      throw new ApiError(400, "Invalid PublicId of image!");
    }

    const destroyResult = await cloudinary.uploader.destroy(imagePublicId, {
      resource_type: "auto",
    });

    if(!destroyResult)
    {
      throw new ApiError(400, "Failed to delete image!");
    }
    return destroyResult;
  } catch (error) {
    throw new ApiError(500, error?.message||"Destroy Operation Failed")
  }
};

export { uploadOnCloudinary,deleteOnCloudinary };
