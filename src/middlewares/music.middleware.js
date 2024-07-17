import jwt from "jsonwebtoken";

const generateMusicToken = (url) => {
  const token = jwt.sign({ url }, process.env.MUSIC_TOKEN_SECRET, {
    expiresIn: "1h",
  });
  return token;
};

const verifyMusicToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.MUSIC_TOKEN_SECRET);
    return decoded.url;
  } catch (err) {
    console.error("Token verification failed:", err);
    throw new Error("Invalid or expired token");
  }
};

export { generateMusicToken, verifyMusicToken };
