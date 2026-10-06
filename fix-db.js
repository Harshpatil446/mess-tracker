require("dotenv").config({ path: "./server/.env" });
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
    try {
      await mongoose.connection.collection("users").dropIndex("email_1");
      console.log("Successfully dropped the email_1 index");
    } catch (err) {
      console.log("Error dropping index (maybe it doesn't exist?):", err.message);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error("Connection error:", err);
    process.exit(1);
  });
