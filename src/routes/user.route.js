import { Router } from "express";
import {
  changeCurrentPassword,
  followUser,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  unfollowUser,
  updateAccountDetails,
  updateProfileDetails,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import passport from "passport";
import "../lib/passport.js";
import { COOKIE_OPTIONS } from "../lib/constants.js";

const router = Router();

router.route("/register").post(upload.none(), registerUser);

router.route("/login").post(upload.none(), loginUser);
router.route("/refresh-token").post(refreshAccessToken);

// SECURED ROUTES
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-profile").patch(verifyJWT, updateProfileDetails)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
router.route("/follow/:userId").post(verifyJWT, followUser);
router.route("/unfollow/:userId").post(verifyJWT, unfollowUser);

// OAuth Route
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: `https://${process.env.FRONTEND_URL}/sign-in`,
    session: false,
  }),
  (req, res) => {
    const { accessToken, refreshToken } = req.authInfo;

    res
      .cookie("accessToken", accessToken, COOKIE_OPTIONS)
      .cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
      .redirect(`https://${process.env.FRONTEND_URL}/music`);
  }
);

export default router;
