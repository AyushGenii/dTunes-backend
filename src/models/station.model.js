import mongoose, { Schema } from "mongoose";

const RadioStationSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  genre: String,
});

export const RadioStation = mongoose.model("RadioStation", RadioStationSchema);
