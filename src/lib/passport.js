import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/user.model.js";
import { generateAccessAndRefreshTokens } from "./token.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://beatbharatbackend.onrender.com/api/v1/users/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("No email found in profile"));
        }

        let user = await User.findOne({ email });

        if (!user) {
          user = new User({
            email,
            fullName: profile.displayName,
            avatar: profile.photos?.[0]?.value,
            oauth: true,
          });
          await user.save();
        }

        const tokens = await generateAccessAndRefreshTokens(user._id);
        return done(null, user, tokens);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});
