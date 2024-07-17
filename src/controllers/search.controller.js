import { ApiError, ApiResponse, asyncHandler } from "../lib/utils.js";
import { User } from "../models/user.model.js";
import { Track } from "../models/track.model.js";
import { Album } from "../models/album.model.js";
import { Artist } from "../models/artist.model.js";
import { uploadOnCloudinary } from "../lib/cloudinary.js";
import { Playlist } from "../models/playlist.model.js";

const search = async (req, res) => {
  try {
    const { query, type, limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const searchRegex = new RegExp(query, "i");

    let results = [];
    let total = 0;

    if (!type || type === "all") {
      const [users, tracks, artists, playlists] = await Promise.all([
        User.find({ username: searchRegex }).limit(limit).skip(skip),
        Track.find({ title: searchRegex })
          .limit(limit)
          .skip(skip)
          .populate("artist"),
        Artist.find({ name: searchRegex }).limit(limit).skip(skip),
        Playlist.find({ name: searchRegex })
          .limit(limit)
          .skip(skip)
          .populate("owner"),
      ]);

      results = [
        ...users.map((user) => ({ ...user.toObject(), type: "user" })),
        ...tracks.map((track) => ({ ...track.toObject(), type: "track" })),
        ...artists.map((artist) => ({ ...artist.toObject(), type: "artist" })),
        ...playlists.map((playlist) => ({
          ...playlist.toObject(),
          type: "playlist",
        })),
      ];

      total =
        (await User.countDocuments({ username: searchRegex })) +
        (await Track.countDocuments({ title: searchRegex })) +
        (await Artist.countDocuments({ name: searchRegex })) +
        (await Playlist.countDocuments({ name: searchRegex }));
    } else {
      let Model;
      let searchField;

      switch (type) {
        case "user":
          Model = User;
          searchField = "username";
          break;
        case "track":
          Model = Track;
          searchField = "title";
          break;
        case "artist":
          Model = Artist;
          searchField = "name";
          break;
        case "playlist":
          Model = Playlist;
          searchField = "name";
          break;
        default:
          return res.status(400).json({ message: "Invalid search type" });
      }

      results = await Model.find({ [searchField]: searchRegex })
        .limit(limit)
        .skip(skip)
        .populate(
          type === "track" ? "artist" : type === "playlist" ? "owner" : ""
        );

      results = results.map((item) => ({ ...item.toObject(), type }));

      total = await Model.countDocuments({ [searchField]: searchRegex });
    }

    // Sort results based on search query
    results.sort((a, b) => {
      const aField = a.username || a.title || a.name;
      const bField = b.username || b.title || b.name;
      if (aField.toLowerCase() === query.toLowerCase()) return -1;
      if (bField.toLowerCase() === query.toLowerCase()) return 1;
      return aField.localeCompare(bField);
    });

    res.json(
      new ApiResponse(200, {
        results,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      })
    );
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json(new ApiError(500, "Internal server error"));
  }
};

export { search };
