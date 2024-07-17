import "dotenv/config";
import axios from "axios";
import mongoose from "mongoose";
import { Track } from "./models/track.model.js";
import { Artist } from "./models/artist.model.js";
import { Album } from "./models/album.model.js";

const SPOTIFY_API_URL = "https://api.spotify.com/v1";
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

mongoose.connect(process.env.MONGODB_URI);

async function getSpotifyToken() {
  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      "grant_type=client_credentials",
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(SPOTIFY_CLIENT_ID + ":" + SPOTIFY_CLIENT_SECRET).toString(
              "base64"
            ),
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error("Error getting Spotify token:", error.message);
    throw error;
  }
}

async function searchIndianPlaylists(token) {
  try {
    const response = await axios.get(`${SPOTIFY_API_URL}/search`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        q: 'indian latest hits',
        type: 'playlist',
        limit: 10
      },
    });
    return response.data.playlists.items;
  } catch (error) {
    console.error("Error searching Indian playlists:", error.message);
    throw error;
  }
}

async function fetchPlaylistTracks(token, playlistId) {
  try {
    const response = await axios.get(`${SPOTIFY_API_URL}/playlists/${playlistId}/tracks`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit: 100 },
    });
    return response.data.items;
  } catch (error) {
    console.error(`Error fetching playlist tracks for ${playlistId}:`, error.message);
    throw error;
  }
}

async function fetchArtistDetails(token, artistId) {
  try {
    const response = await axios.get(`${SPOTIFY_API_URL}/artists/${artistId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching artist details for ${artistId}:`, error.message);
    throw error;
  }
}

async function populateDatabase() {
  const token = await getSpotifyToken();
  let trackCount = 0;

  try {
    const playlists = await searchIndianPlaylists(token);

    for (const playlist of playlists) {
      const tracks = await fetchPlaylistTracks(token, playlist.id);

      for (const item of tracks) {
        const track = item.track;
        if (track && track.preview_url) {
          try {
            const artistDetails = await fetchArtistDetails(token, track.artists[0].id);

            // Create or update artist
            const artist = await Artist.findOneAndUpdate(
              { name: artistDetails.name },
              {
                name: artistDetails.name,
                bio: artistDetails.name,
                genres: artistDetails.genres,
                image: artistDetails.images[0]?.url,
              },
              { upsert: true, new: true }
            );

            // Create or update album
            const albumDoc = await Album.findOneAndUpdate(
              { title: track.album.name, artist: artist._id },
              {
                title: track.album.name,
                artist: artist._id,
                tracks: [],
                releaseDate: new Date(track.album.release_date),
                genre: artistDetails.genres,
                coverArt: track.album.images[0]?.url,
              },
              { upsert: true, new: true }
            );

            // Create track
            const trackDoc = await Track.create({
              title: track.name,
              artist: artist._id,
              album: albumDoc._id,
              duration: track.duration_ms,
              url: track.preview_url,
              genre: artistDetails.genres,
              releaseDate: new Date(track.album.release_date),
              plays: 0,
            });

            // Add track to album's tracks array
            albumDoc.tracks.push(trackDoc._id);
            await albumDoc.save();

            trackCount++;
            console.log(`Added track: ${track.name} by ${artistDetails.name}`);

            if (trackCount >= 1000) break;
          } catch (error) {
            console.error(`Error creating track ${track.name}:`, error.message);
          }
        }
        if (trackCount >= 1000) break;
      }
      if (trackCount >= 1000) break;
    }
  } catch (error) {
    console.error("Error in main loop:", error.message);
  }
  
  console.log(`Database populated with ${trackCount} Indian tracks`);
}

populateDatabase()
  .then(() => {
    console.log("Database population complete");
    mongoose.connection.close();
  })
  .catch((error) => {
    console.error("Error populating database:", error);
    mongoose.connection.close();
  });