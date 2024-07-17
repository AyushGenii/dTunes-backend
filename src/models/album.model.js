import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const albumSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
      required: true,
    },
    tracks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Track",
      },
    ],
    releaseDate: Date,
    genre: [String],
    coverArt: String,
  },
  { timestamps: true }
);

albumSchema.plugin(mongooseAggregatePaginate);

export const Album = mongoose.model("Album", albumSchema);
