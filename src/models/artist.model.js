import mongoose, { Schema } from "mongoose";

const artistSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    bio: String,
    genres: [String],
    image: String,
  },
  { timestamps: true }
);

export const Artist = mongoose.model("Artist", artistSchema);
