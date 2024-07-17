import { ApiError, ApiResponse, asyncHandler } from "../lib/utils.js";
import { User } from "../models/user.model.js";
import { Track } from "../models/track.model.js";
import { Album } from "../models/album.model.js";
import { Artist } from "../models/artist.model.js";
import { uploadOnCloudinary } from "../lib/cloudinary.js";
import {
  generateMusicToken,
  verifyMusicToken,
} from "../middlewares/music.middleware.js";

import axios from "axios";

const getAllTracks = asyncHandler(async (req, res) => {
  try {
    const tracks = await Track.find().populate("artist album");
    res.json(new ApiResponse(200, { tracks }, "Tracks fetched successfully"));
  } catch (err) {
    throw new ApiError(500, "Error fetching tracks");
  }
});

const getTrackById = asyncHandler(async (req, res) => {
  try {
    const track = await Track.findById(req.params.id).populate("artist album");
    if (!track) {
      return res.status(404).json(new ApiResponse(404, {}, "Track not found"));
    }
    res.json(new ApiResponse(200, { track }, "Track fetched successfully"));
  } catch (err) {
    throw new ApiError(500, "Error fetching track");
  }
});

const uploadTrack = asyncHandler(async (req, res) => {
  try {
    const { title, artist, album, duration } = req.body;

    const musicLocalPath = req.files?.music[0]?.path;

    if (!musicLocalPath) {
      throw new ApiError(400, "Music File is required");
    }

    const musicUrl = await uploadOnCloudinary(avatarLocalPath);

    if (!musicUrl) {
      throw new ApiError(500, "Failed to upload music file");
    }
    const track = new Track({
      title,
      artist,
      album,
      duration,
      url: musicUrl.url,
    });
    await track.save();
    res.json(new ApiResponse(201, { track }, "Track uploaded successfully"));
  } catch (err) {
    throw new ApiError(500, "Error uploading track");
  }
});

const getAllAlbums = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const albums = await Album.find()
      .populate("artist", "name")
      .select("title coverArt releaseDate genre")
      .skip(skip)
      .limit(limit);

    const total = await Album.countDocuments();

    res.json(
      new ApiResponse(
        200,
        { albums, page, limit, total },
        "Albums fetched successfully"
      )
    );
  } catch (err) {
    throw new ApiError(500, "Error fetching albums");
  }
});

const getAlbumById = asyncHandler(async (req, res) => {
  try {
    const album = await Album.findById(req.params.id).populate("artist tracks");

    if (!album) {
      return res.status(404).json(new ApiResponse(404, {}, "Album not found"));
    }
    res.json(new ApiResponse(200, { album }, "Album fetched successfully"));
  } catch (err) {
    throw new ApiError(500, "Error fetching album");
  }
});

const getAllArtists = asyncHandler(async (req, res) => {
  try {
    const artists = await Artist.find();
    res.json(new ApiResponse(200, { artists }, "Artists fetched successfully"));
  } catch (err) {
    throw new ApiError(500, "Error fetching artists");
  }
});

const getArtistById = asyncHandler(async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) {
      return res.status(404).json(new ApiResponse(404, {}, "Artist not found"));
    }
    const albums = await Album.find({ artist: artist._id });
    const tracks = await Track.find({ artist: artist._id });
    res.json(
      new ApiResponse(
        200,
        { artist, albums, tracks },
        "Artist fetched successfully"
      )
    );
  } catch (err) {
    throw new ApiError(500, "Error fetching artist");
  }
});

// Favorites
const addFavorite = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { itemId, type } = req.body;

    user.addFavorite(itemId, type);
    await user.save();

    res.json(new ApiResponse(200, {}, "Favorite added successfully"));
  } catch (err) {
    throw new ApiError(500, "Error adding favorite");
  }
});

const removeFavorite = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { itemId, type } = req.body;

    user.removeFavorite(itemId, type);
    await user.save();

    res.json(new ApiResponse(200, {}, "Favorite removed successfully"));
  } catch (err) {
    throw new ApiError(500, "Error removing favorite");
  }
});

const addRecentlyPlayed = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { itemId, itemType } = req.body;

    user.addRecentlyPlayed(itemId, itemType);
    await user.save();

    res.json(new ApiResponse(200, {}, "Recently played updated successfully"));
  } catch (err) {
    throw new ApiError(500, "Error updating recently played");
  }
});

const getStreamingToken = asyncHandler(async (req, res) => {
  try {
    const { trackId } = req.body;

    if (!trackId) {
      throw new ApiError(400, "Track ID is required");
    }

    const track = await Track.findById(trackId);
    if (!track) {
      throw new ApiError(404, "Track not found");
    }

    const token = generateMusicToken(track.url);
    res.json(new ApiResponse(200, { token }, "Token generated successfully"));
  } catch (err) {
    console.error("Error generating token:", err);
    throw new ApiError(500, "Error generating token");
  }
});

const streamMusic = asyncHandler(async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) {
      throw new ApiError(400, "Token is required");
    }

    const url = verifyMusicToken(token);
    console.log("URL from token:", url);

    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
    });

    response.data.pipe(res);
  } catch (err) {
    console.error("Error streaming audio:", err);
    throw new ApiError(500, "Error streaming audio");
  }
});

export {
  getAllTracks,
  getTrackById,
  uploadTrack,
  getAllAlbums,
  getAlbumById,
  getAllArtists,
  getArtistById,
  addFavorite,
  removeFavorite,
  addRecentlyPlayed,
  getStreamingToken,
  streamMusic,
};
