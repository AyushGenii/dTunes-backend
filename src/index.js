import "dotenv/config";
import connectDB from "./lib/db.js";
import app from "./app.js";

const PORT = process.env.PORT || 65535;

let server;

connectDB()
  .then(() => {
    server = app.listen(PORT, () => {
      console.log(`\n🔗 Server is running on ${process.env.BACKEND_URL}:${PORT}`);
      console.log(`🌟 Environment: ${process.env.NODE_ENV || "development"}\n`);
    });

    app.on("error", (err) => {
      console.error("\n❌ Server error: \n\n", err);
      process.exit(1);
    });

    const gracefulShutdown = () => {
      console.log("\n🔥 Server is closing...\n");

      server.close(() => {
        console.log("\n🔒 All connections closed, exiting process...\n");
        process.exit(0);
      });
    };

    process.on("SIGINT", gracefulShutdown);
    process.on("SIGTERM", gracefulShutdown);
  })
  .catch((err) => {
    console.error("\n❌ Failed to connect to MongoDB: \n\n", err);
    process.exit(1);
  });

process.on("uncaughtException", (err) => {
  console.error("\n❌ Uncaught Exception: \n\n", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(
    "\n❌ Unhandled Rejection at: \n\n",
    promise,
    "\nReason: \n\n",
    reason
  );
  process.exit(1);
});
