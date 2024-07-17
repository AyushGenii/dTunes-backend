import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Playlist } from "./playlist.model.js";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/.+@.+\..+/, "Invalid email format"],
    },
    username: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9_]+$/, "Username can only contain letters, numbers, and underscores."],
      default: function () {
        return this.email.split("@")[0];
      },
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: String,
    bio: String,
    dob: Date,
    language: String,
    timezone: String,
    gender: String,
    urls: [{ value: String }],
    password: {
      type: String,
      required: function () {
        return !this.oauth;
      },
    },
    oauth: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: String,
    favoriteStations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RadioStation",
      },
    ],
    favoriteTracks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Track",
      },
    ],
    favoriteAlbums: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Album",
      },
    ],
    playlists: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Playlist",
      },
    ],
    recentlyPlayed: [
      {
        item: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "recentlyPlayed.itemType",
        },
        itemType: {
          type: String,
          enum: ["RadioStation", "Track"],
        },
        playedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    preferences: {
      genres: [String],
      language: String,
    },
    lastUsernameChange: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Middleware to handle password hashing
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// OAuth Middleware
userSchema.pre("save", function (next) {
  if (this.oauth) {
    this.isVerified = true;
  }
  next();
});

// Methods
userSchema.methods.isPasswordCorrect = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.addFavorite = function (itemId, type) {
  const validTypes = ["Station", "Track", "Album"];
  if (!validTypes.includes(type)) {
    throw new Error("Invalid favorite type");
  }
  const field = `favorite${type}s`;
  if (!this[field].includes(itemId)) {
    this[field].push(itemId);
  }
};

userSchema.methods.removeFavorite = function (itemId, type) {
  const validTypes = ["Station", "Track", "Album"];
  if (!validTypes.includes(type)) {
    throw new Error("Invalid favorite type");
  }
  const field = `favorite${type}s`;
  this[field] = this[field].filter((id) => id.toString() !== itemId.toString());
};

userSchema.methods.addRecentlyPlayed = function (itemId, itemType) {
  this.recentlyPlayed.unshift({ item: itemId, itemType });
  if (this.recentlyPlayed.length > 50) {
    this.recentlyPlayed.pop();
  }
};

userSchema.methods.createPlaylist = function (
  name,
  description = "",
  isPublic = false
) {
  const playlist = new Playlist({
    name,
    user: this._id,
    description,
    isPublic,
  });
  this.playlists.push(playlist._id);
  return playlist;
};

userSchema.methods.updatePreferences = function (preferences) {
  this.preferences = { ...this.preferences, ...preferences };
};

userSchema.methods.addFavoriteStation = function (stationId) {
  this.addFavorite(stationId, "Station");
};

userSchema.methods.removeFavoriteStation = function (stationId) {
  this.removeFavorite(stationId, "Station");
};

userSchema.methods.addRecentlyPlayedStation = function (stationId) {
  this.addRecentlyPlayed(stationId, "RadioStation");
};

// Method to change username
userSchema.methods.changeUsername = function (newUsername) {
  if (!/^[a-z0-9_]+$/.test(newUsername)) {
    throw new Error("Username can only contain letters, numbers, and underscores.");
  }

  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
  const now = new Date();

  if (now - this.lastUsernameChange < thirtyDaysInMs) {
    throw new Error("Username can only be changed once every 30 days.");
  }

  this.username = newUsername;
  this.lastUsernameChange = now;
};

export const User = mongoose.model("User", userSchema);
