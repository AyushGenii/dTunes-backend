import { ApiError, ApiResponse, asyncHandler } from "../lib/utils.js";
import { Track } from "../models/track.model.js";

const generateShareUrl = (trackId, platform = null) => {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const shareUrl = `${baseUrl}/music/?t=${trackId}`;

  if (platform) {
    const encodedUrl = encodeURIComponent(shareUrl);
    switch (platform) {
      case "facebook":
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      case "twitter":
        return `https://twitter.com/intent/tweet?url=${encodedUrl}`;
      case "whatsapp":
        return `https://api.whatsapp.com/send?text=${encodedUrl}`;
      default:
        return shareUrl;
    }
  }

  return shareUrl;
};

const shareTrack = asyncHandler(async (req, res) => {
  const { trackId, platform } = req.body;

  if (!trackId) {
    throw new ApiError(400, "Track ID is required");
  }

  const track = await Track.findById(trackId);
  if (!track) {
    throw new ApiError(404, "Track not found");
  }

  const shareUrl = generateShareUrl(trackId, platform);

  track.shareCount = (track.shareCount || 0) + 1;
  await track.save();

  res.json(
    new ApiResponse(200, { shareUrl }, "Share URL generated successfully")
  );
});

const getShareLink = asyncHandler(async (req, res) => {
  const { trackId } = req.body;

  if (!trackId) {
    throw new ApiError(400, "Track ID is required");
  }

  const track = await Track.findById(trackId);
  if (!track) {
    throw new ApiError(404, "Track not found");
  }

  const shareUrl = generateShareUrl(trackId);

  res.json(
    new ApiResponse(200, { shareUrl }, "Share link generated successfully")
  );
});

const handleShareTrack = asyncHandler(async (req, res) => {
  const { trackId } = req.params;

  if (!trackId) {
    throw new ApiError(400, "Track ID is required");
  }

  const track = await Track.findById(trackId).populate("artist");

  if (!track) {
    throw new ApiError(404, "Track not found");
  }

  track.shareCount = (track.shareCount || 0) + 1;
  await track.save();

  res.json(
    new ApiResponse(200, { track }, "Track details retrieved successfully")
  );
});

export { shareTrack, getShareLink, handleShareTrack };
