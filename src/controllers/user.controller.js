import { create } from "domain";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const registerUser = asyncHandler(async (req, res) => {
  const { username, fullName, email, password } = req.body;
  // s1 none of them should be empty
  if (
    [username, fullName, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "Please fill in all fields");
  }
  // s2 check if username or email already exists

  const existingUser = await User.findOne({
    $or: [{ username }, { fullName }],
  });

  if (existingUser) {
    throw new ApiError(409, "User or email already exists");
  }

  // s3 getting the local path of files we uploaded in our disk using multer

  // H.W once working check req.files what it stores.
  const avatarLocalPath = req.files?.avatar[0]?.path;

  // might get error in case coverImage is not provided. sol: use if else. not below code
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0){
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  console.log('avatarLocalPath req.files',req.files);
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  // s4 uploading file from local to cloudianry
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  console.log('cloudianry uploaded avatar',avatar);

  if (!avatar) {
    throw new ApiError(400, "Avatar is required1");
  }

  const user = await User.create({
    username,
    fullName,
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser = await User
    .findOne(user._id)
    .select("-password -refreshToken");

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong, Failed to create user");
  }

  return res.status(201).json(new ApiResponse(200,createdUser,"User Registered Successfully"));
});

export { registerUser };
