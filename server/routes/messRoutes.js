const express = require("express");
const router = express.Router();
const {
  createMessCycle,
  getCurrentMessCycle,
  getMessHistory,
  getMessCycleById,
  updateMessCycle,
  deleteMessCycle,
  updateMeal,
  importMessCycle,
} = require("../controllers/messController");
const { protect } = require("../middleware/auth");

// All mess routes are protected
router.use(protect);

router.route("/import").post(importMessCycle);
router.route("/").post(createMessCycle);
router.route("/current").get(getCurrentMessCycle);
router.route("/history").get(getMessHistory);
router.route("/:id").get(getMessCycleById).patch(updateMessCycle).delete(deleteMessCycle);
router.route("/:id/meals/:date").patch(updateMeal);

module.exports = router;
