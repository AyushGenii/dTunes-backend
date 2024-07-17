import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";

const connectDB = async () => {
    try {
        const dbURI = `${process.env.MONGODB_URI}/${DB_NAME}`;

        const connectionInstance = await mongoose.connect(dbURI);

        console.log(`\n🤖 MongoDB connected Successfully!\n🌐 DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("\n❌ MongoDB connection FAILED\n\n", error);
        process.exit(1);
    }
};

export default connectDB;
