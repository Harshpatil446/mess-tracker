require("dotenv").config();
const mongoose = require("mongoose");

mongoose.set('bufferCommands', false);

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI environment variable is missing!");
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of 30s
    };

    console.log("Attempting to connect to MongoDB...");
    cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongoose) => {
      console.log(`MongoDB Connected: ${mongoose.connection.host}`);
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error(`MongoDB Connection Error: ${e.message}`);
    throw new Error(`MongoDB Connection Failed: ${e.message}. Please check if your Vercel IP (0.0.0.0/0) is allowed in MongoDB Atlas Network Access.`);
  }

  return cached.conn;
};

module.exports = connectDB;
