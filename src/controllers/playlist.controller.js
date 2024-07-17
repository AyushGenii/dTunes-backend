import { ApiError, ApiResponse, asyncHandler } from "../lib/utils.js";
import { Album } from "../models/album.model.js";
import { Track } from "../models/track.model.js";
import { Playlist } from "../models/playlist.model.js";
import { User } from "../models/user.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { name, description, isPublic } = req.body;

    const playlist = await user.createPlaylist(name, description, isPublic);
    await playlist.save();
    await user.save();

    res.json(
      new ApiResponse(201, { playlist }, "Playlist created successfully")
    );
  } catch (err) {
    throw new ApiError(500, "Error creating playlist");
  }
});

const updatePlaylist = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { tracks } = req.body;

    const playlist = await Playlist.findOneAndUpdate(
      { _id: id, user: req.user.id },
      { $set: { tracks } },
      { new: true }
    );

    if (!playlist) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Playlist not found"));
    }

    res.json(
      new ApiResponse(200, { playlist }, "Playlist updated successfully")
    );
  } catch (err) {
    throw new ApiError(500, "Error updating playlist");
  }
});

const deletePlaylist = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const playlist = await Playlist.findOneAndDelete({
      _id: id,
      user: req.user.id,
    });

    if (!playlist) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Playlist not found"));
    }

    res.json(new ApiResponse(200, {}, "Playlist deleted successfully"));
  } catch (err) {
    throw new ApiError(500, "Error deleting playlist");
  }
});

const getPlaylistById = asyncHandler(async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Playlist not found"));
    }
    res.json(
      new ApiResponse(200, { playlist }, "Playlist fetched successfully")
    );
  } catch (err) {
    throw new ApiError(500, "Error fetching playlist");
  }
});

const getPlaylists = asyncHandler(async (req, res) => {
  try {
    const playlists = await Playlist.find({ user: req.user.id });
    res.json(new ApiResponse(200, { playlists }, "Playlists fetched successfully"));
  } catch (err) {
    throw new ApiError(500, "Error fetching playlists");
  }
});

const getTopPicks = asyncHandler(async (req, res) => {
  try {
    const today = new Date();
    const oneMonthAgo = new Date(today.setMonth(today.getMonth() - 1));

    let topAlbums = await Album.aggregate([
      {
        $lookup: {
          from: "tracks",
          localField: "tracks",
          foreignField: "_id",
          as: "trackData",
        },
      },
      {
        $addFields: {
          totalPlays: { $sum: "$trackData.plays" },
          avgReleaseDate: { $avg: "$trackData.releaseDate" },
        },
      },
      {
        $match: {
          avgReleaseDate: { $gte: oneMonthAgo },
        },
      },
      {
        $sort: { totalPlays: -1 },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: "artists",
          localField: "artist",
          foreignField: "_id",
          as: "artistData",
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          artist: { $arrayElemAt: ["$artistData.name", 0] },
          coverArt: 1,
          releaseDate: 1,
          genre: 1,
        },
      },
    ]);

    if (topAlbums.length === 0) {
      topAlbums = await Album.aggregate([
        { $sample: { size: 10 } },
        {
          $lookup: {
            from: "artists",
            localField: "artist",
            foreignField: "_id",
            as: "artistData",
          },
        },
        {
          $project: {
            _id: 1,
            title: 1,
            artist: { $arrayElemAt: ["$artistData.name", 0] },
            coverArt: 1,
            releaseDate: 1,
            genre: 1,
          },
        },
      ]);
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, { topAlbums }, "Top picks fetched successfully")
      );
  } catch (error) {
    throw new ApiError(500, "Error fetching top picks");
  }
});

export {
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  getPlaylistById,
  getPlaylists,
  getTopPicks,
};
