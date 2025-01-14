import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // save refreshToken in db.
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    // When saving to DB the mdoel get's ingaged and it cheeck's all reqired fields.
    // so right now we are just saving the refreshTk so we can avoid that step as we
    //  done't have manu requiremnets. to do that we use validateBeforeSave:false

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Failed to generate token internal error");
  }
};

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
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  // console.log("avatarLocalPath req.files", req.files);
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  // s4 uploading file from local to cloudianry
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  console.log("cloudianry uploaded avatar", avatar);

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

  const createdUser = await User.findOne(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong, Failed to create user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // depends on you. on what basis you are signing in. let's consider bith for now.
  const { username, email, password } = req.body;
  if (!username && !email) {
    throw new ApiError(400, "Username or emial is required to login");
  }

  const user = await User.findOne({ $or: [{ email }, { username }] });

  if (!user) {
    throw new ApiError(404, "user doesnot exists");
  }

  const isPasswordValid = user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Credentials");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  // depends on your work if it's expensive call or not.
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(200, { user: loggedInUser }, "User Login Successfull")
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  // remove refreshtoken from DB
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: { refreshToken: 1 }, // removing the refreshToken from doc. itself
    },
    {
      new: true,
    }
  );

  // remove cookies from UI
  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .cookie("accessToken", cookieOptions)
    .cookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User LogOut Successfull"));
});

const RefreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(400, "Unauthorized requrest!");
  }

  console.log("incoming token", incomingRefreshToken);
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    console.log("decodedToken", decodedToken);
    const user = await User.findById(decodedToken._id);
    if (!user) {
      throw new ApiError(401, "Invalid Token Recived!");
    }

    const existingRefreshToken = user?.refreshToken;
    if (incomingRefreshToken != existingRefreshToken) {
      throw new ApiError(401, "Refresh Token is Expired or used!");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    const cookieOptions = {
      httpOnly: true,
      secure: true,
    };
    res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          { accessToken: accessToken, refreshToken: refreshToken },
          "Access Token refreshed!!"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Access Token Refresh Failed!!");
  }
});

const changeUserPassword = asyncHandler(async (req, res) => {
  // checking for new password and confirm new passord can be done at UI itself so in backend it's not that mandatory to check that.
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  const idOldPasswordCorrect = user.isPasswordCorrect(oldPassword);
  if (!idOldPasswordCorrect) {
    throw new ApiError(400, "Invalid Old Passwrod recieved!");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password updated Successfully"));
});

const getCurrentUsers = asyncHandler((req, res) => {
  return res
    .status(200)
    .json(ApiResponse(200, req.user, "User Fetched Succesfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(ApiResponse(200, user, "Account Details Updated Succesfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatart file not uploaded");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(500, "Error while uploading avatar");
  }

  const oldAvatarPath = user.avatar;

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { avatar: avatar.url } },
    { new: true }
  ).select("-password");

  if (oldAvatarPath) {
    const destroyResult = deleteOnCloudinary(oldAvatarPath);
    if (!destroyResult) {
      throw new ApiError(500, "Error while deleting old avatar");
    }
  }
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "coverImage file not uploaded");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage.url) {
    throw new ApiError(500, "Error while uploading coverImage");
  }
  const oldcoverImagePath = user.coverImage;

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { coverImage: coverImage.url } },
    { new: true }
  ).select("-password");

  if (oldcoverImagePath) {
    const destroyResult = deleteOnCloudinary(oldcoverImagePath);
    if (!destroyResult) {
      throw new ApiError(500, "Error while deleting old coverImage");
    }
  }
  return res
    .status(200)
    .json(new ApiResponse(200, user, "coverImage updated successfully"));
});

export {
  registerUser,
  loginUser,
  logOutUser,
  RefreshAccessToken,
  getCurrentUsers,
  changeUserPassword,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage
};
