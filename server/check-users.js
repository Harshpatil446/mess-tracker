require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const dns = require("dns");

dns.setServers(["1.1.1.1", "8.8.8.8"]);

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const users = await mongoose.connection.collection("users").find({}).toArray();
    console.log("Users:", users);
    process.exit(0);
  })
  .catch(err => {
    console.error("Connection error:", err);
    process.exit(1);
  });
