import { Router } from "express";
import {
  changeUserPassword,
  getCurrentUsers,
  getUserChannelProfile,
  getWatchHistory,
  loginUser,
  logOutUser,
  RefreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middleare/multer.middleware.js";
import { verifyJWT } from "../middleare/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);
// router.post("/register",registerUser)

router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logOutUser);
router.route("/refresh-token").post(RefreshAccessToken);
router.route("/change-password").post(verifyJWT, changeUserPassword);
router.route("/get-current-user").get(verifyJWT, getCurrentUsers);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);
router
  .route("/update-avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router.route("/update-cover-image").patch(verifyJWT,upload.single("coverImage"), updateUserCoverImage);
// using route paramters :username
router.route("/channel/:username").get(verifyJWT, getUserChannelProfile);
router.route("/watch-history").get(verifyJWT, getWatchHistory);

export default router;
