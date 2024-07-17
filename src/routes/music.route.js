import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addFavorite,
  addRecentlyPlayed,
  getAlbumById,
  getAllAlbums,
  getAllArtists,
  getAllTracks,
  getArtistById,
  getStreamingToken,
  getTrackById,
  removeFavorite,
  streamMusic,
} from "../controllers/music.controller.js";
import {
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getPlaylists,
  getTopPicks,
  updatePlaylist,
} from "../controllers/playlist.controller.js";
import { getShareLink, shareTrack } from "../controllers/share.controller.js";

const router = Router();

// Tracks routes
router.route("/tracks").get(getAllTracks);
router.route("/tracks/:id").get(getTrackById);

// Stream routes
router.route("/streaming-token").post(getStreamingToken);
router.route("/streaming").get(streamMusic);

// Share routes
router.route("/share").post(shareTrack);
router.route("/share-link").post(getShareLink);

// Albums routes
router.route("/albums").get(getAllAlbums);
router.route("/albums/:id").get(getAlbumById);
router.route("/top-picks").get(getTopPicks);

// Artists routes
router.route("/artists").get(getAllArtists);
router.route("/artists/:id").get(getArtistById);

// User-specific routes
router.route("/favorite").post(verifyJWT, addFavorite);
router.route("/favorite").delete(verifyJWT, removeFavorite);
router.route("/recently-played").post(verifyJWT, addRecentlyPlayed);

router.route("/playlists").get(verifyJWT, getPlaylists);
router.route("/create-playlist").post(verifyJWT, createPlaylist);
router.route("/playlist/:id").put(verifyJWT, updatePlaylist);
router.route("/playlist/:id").get(verifyJWT, getPlaylistById);
router.route("/playlist/:id").delete(verifyJWT, deletePlaylist);

export default router;
