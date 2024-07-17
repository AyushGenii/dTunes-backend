import { asyncHandler, ApiError, ApiResponse } from "../lib/utils.js";
import { User } from "../models/user.model.js";

const getFavoriteStations = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { favoriteStations: user.favoriteStations },
        "Favorite stations fetched successfully"
      )
    );
});

const addFavoriteStation = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const { stationId } = req.body;
  user.addFavoriteStation(stationId);
  await user.save();
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Favorite station added successfully"));
});

const recentlyPlayedStation = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const { stationId } = req.body;

  user.addRecentlyPlayedStation(stationId);
  await user.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { recentlyPlayed: user.recentlyPlayed },
        "Recently played updated successfully"
      )
    );
});

const getPreferences = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { preferences: user.preferences },
        "Preferences fetched successfully"
      )
    );
});

const updatePreferences = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const { preferences } = req.body;

  user.updatePreferences(preferences);
  await user.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { preferences: user.preferences },
        "Preferences updated successfully"
      )
    );
});

export {
  getFavoriteStations,
  addFavoriteStation,
  recentlyPlayedStation,
  getPreferences,
  updatePreferences,
};
