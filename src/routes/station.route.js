import { Router } from "express";
import {
  addFavoriteStation,
  getFavoriteStations,
  getPreferences,
  updatePreferences,
  recentlyPlayedStation,
} from "../controllers/station.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// SECURED ROUTES
router.route("/favorite").get(verifyJWT, getFavoriteStations);
router.route("/favorite").post(verifyJWT, addFavoriteStation);
router.route("/recently-played").post(verifyJWT, recentlyPlayedStation);
router.route("/preferences").get(verifyJWT, getPreferences);
router.route("/preferences").put(verifyJWT, updatePreferences);

export default router;