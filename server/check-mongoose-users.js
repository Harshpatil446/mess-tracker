require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const User = require("./models/User");

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const users = await User.find({});
    console.log("Mongoose Users:", users);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
