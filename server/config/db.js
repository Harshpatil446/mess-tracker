require("dotenv").config();
const dns = require("dns");
try {
  // Use public DNS if running in environments where local SRV resolution is blocked
  if (process.platform === "win32") {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  }
} catch (e) {
  // Ignore DNS setServers error
}

const mongoose = require("mongoose");

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  // 1: connected, 2: connecting
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (cached.promise && mongoose.connection.readyState === 2) {
    return cached.promise;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI environment variable is missing!");
  }

  const opts = {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 10,
    socketTimeoutMS: 45000,
    autoIndex: process.env.NODE_ENV !== "production",
  };

  if (!cached.promise || mongoose.connection.readyState === 0) {
    console.log("Attempting to connect to MongoDB...");
    cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((m) => {
      console.log(`MongoDB Connected: ${m.connection.host}`);
      return m.connection;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    console.error(`MongoDB Connection Error: ${e.message}`);
    throw new Error(`MongoDB Connection Failed: ${e.message}. Please check your database connection.`);
  }

  return cached.conn;
};

module.exports = connectDB;
