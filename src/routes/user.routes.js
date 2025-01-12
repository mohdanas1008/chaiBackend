import { Router } from "express";
import {
  loginUser,
  logOutUser,
  RefreshAccessToken,
  registerUser,
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
export default router;
