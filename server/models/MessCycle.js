const mongoose = require("mongoose");

const mealRecordSchema = new mongoose.Schema(
  {
    date: {
      type: String, // Format: YYYY-MM-DD
      required: true,
    },
    breakfast: {
      type: Boolean,
      default: false,
    },
    lunch: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const messCycleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    planType: {
      type: String,
      enum: ["half", "full"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentDate: {
      type: Date,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
    meals: [mealRecordSchema],
  },
  {
    timestamps: true,
  }
);

const MessCycle = mongoose.model("MessCycle", messCycleSchema);

module.exports = MessCycle;
