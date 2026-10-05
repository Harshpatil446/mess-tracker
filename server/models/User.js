const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
    },
    mobile: {
      type: String,
      required: [true, "Please add a mobile number"],
      unique: true,
    },

    notificationTime: {
      type: String,
      default: "10:00",
    },
    pushSubscriptions: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
