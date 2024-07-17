import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const trackSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
      required: true,
    },
    album: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Album",
    },
    duration: {
      type: Number,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    genre: [String],
    releaseDate: Date,
    plays: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

trackSchema.plugin(mongooseAggregatePaginate);

export const Track = mongoose.model("Track", trackSchema);
