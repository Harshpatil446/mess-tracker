const MessCycle = require("../models/MessCycle");

// @desc    Create new mess cycle
// @route   POST /api/mess
// @access  Private
const createMessCycle = async (req, res) => {
  try {
    const { planType, amount, paymentDate, startDate, endDate } = req.body;

    if (!planType || !amount || !paymentDate || !startDate || !endDate) {
      return res.status(400).json({ message: "Please add all required fields" });
    }

    const messCycle = await MessCycle.create({
      user: req.user.id,
      planType,
      amount,
      paymentDate,
      startDate,
      endDate,
      status: "active",
      meals: [],
    });

    res.status(201).json(messCycle);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get current active mess cycle for logged in user
// @route   GET /api/mess/current
// @access  Private
const getCurrentMessCycle = async (req, res) => {
  try {
    const messCycle = await MessCycle.findOne({
      user: req.user.id,
      status: "active",
    });

    if (!messCycle) {
      return res.status(404).json({ message: "No active mess cycle found" });
    }

    // Defensive deduplication to guarantee data cleanliness
    if (messCycle.meals && messCycle.meals.length > 0) {
      const seen = new Map();
      let hasDupes = false;
      for (const meal of messCycle.meals) {
        if (seen.has(meal.date)) {
          hasDupes = true;
          const curr = seen.get(meal.date);
          curr.breakfast = curr.breakfast || meal.breakfast;
          curr.lunch = curr.lunch || meal.lunch;
        } else {
          seen.set(meal.date, {
            date: meal.date,
            breakfast: meal.breakfast,
            lunch: meal.lunch,
          });
        }
      }
      if (hasDupes) {
        messCycle.meals = Array.from(seen.values());
        await messCycle.save();
      }
    }

    res.status(200).json(messCycle);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get all mess history for logged in user
// @route   GET /api/mess/history
// @access  Private
const getMessHistory = async (req, res) => {
  try {
    const messCycles = await MessCycle.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    res.status(200).json(messCycles);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get specific mess cycle
// @route   GET /api/mess/:id
// @access  Private
const getMessCycleById = async (req, res) => {
  try {
    const messCycle = await MessCycle.findById(req.params.id);

    if (!messCycle) {
      return res.status(404).json({ message: "Mess cycle not found" });
    }

    // Make sure the logged in user matches the mess cycle user
    if (messCycle.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "User not authorized" });
    }

    res.status(200).json(messCycle);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Update mess cycle
// @route   PATCH /api/mess/:id
// @access  Private
const updateMessCycle = async (req, res) => {
  try {
    const messCycle = await MessCycle.findById(req.params.id);

    if (!messCycle) {
      return res.status(404).json({ message: "Mess cycle not found" });
    }

    if (messCycle.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "User not authorized" });
    }

    const updatedMessCycle = await MessCycle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json(updatedMessCycle);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Delete mess cycle
// @route   DELETE /api/mess/:id
// @access  Private
const deleteMessCycle = async (req, res) => {
  try {
    const messCycle = await MessCycle.findById(req.params.id);

    if (!messCycle) {
      return res.status(404).json({ message: "Mess cycle not found" });
    }

    if (messCycle.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "User not authorized" });
    }

    await messCycle.deleteOne();

    res.status(200).json({ id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Import mess cycle from JSON
// @route   POST /api/mess/import
// @access  Private
const importMessCycle = async (req, res) => {
  try {
    const { data } = req.body;
    
    // Support the specific JSON structure provided by the user
    if (!data || !data.store || !data.store.cycles || !Array.isArray(data.store.cycles)) {
      return res.status(400).json({ message: "Invalid JSON format" });
    }

    const cycles = data.store.cycles;
    const activeId = data.store.activeId;
    let importedCount = 0;

    for (const cycleData of cycles) {
      // Parse meals object into array format
      const mealsArray = [];
      if (cycleData.meals) {
        for (const [date, meal] of Object.entries(cycleData.meals)) {
          mealsArray.push({
            date: date,
            breakfast: meal.breakfast || false,
            lunch: meal.lunch || false
          });
        }
      }

      // Calculate end date based on standard 29 days from start date
      const start = new Date(cycleData.startDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 29);

      const isActive = cycleData.id === activeId;

      await MessCycle.create({
        user: req.user.id,
        planType: cycleData.type || 'full',
        amount: 0, // Default since it's not in the export
        paymentDate: cycleData.paymentDate || cycleData.startDate,
        startDate: cycleData.startDate,
        endDate: end.toISOString().split('T')[0],
        status: isActive ? "active" : "completed",
        meals: mealsArray,
      });
      importedCount++;
    }

    res.status(201).json({ message: `Successfully imported ${importedCount} cycles` });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Update meal record for a specific date
// @route   PATCH /api/mess/:id/meals/:date
// @access  Private
const updateMeal = async (req, res) => {
  let retries = 3;
  while (retries > 0) {
    try {
      const { breakfast, lunch } = req.body;
      const { id, date } = req.params;

      const messCycle = await MessCycle.findOne({
        _id: id,
        user: req.user.id,
      });

      if (!messCycle) {
        return res.status(404).json({ message: "Mess cycle not found" });
      }

      // Collect existing meal entries for this date (handles legacy duplicate cleanup)
      const existingMeals = messCycle.meals.filter((m) => m.date === date);
      const existingBreakfast = existingMeals.some((m) => m.breakfast);
      const existingLunch = existingMeals.some((m) => m.lunch);

      // Determine updated values
      const newBreakfast = breakfast !== undefined ? Boolean(breakfast) : existingBreakfast;
      const newLunch = lunch !== undefined ? Boolean(lunch) : existingLunch;

      // Filter out all existing entries for this date
      messCycle.meals = messCycle.meals.filter((m) => m.date !== date);

      // Check if this was an explicit skip request
      const isExplicitSkip = breakfast === false && lunch === false;

      // Keep record if a meal is active or if user explicitly requested a skip
      if (newBreakfast || newLunch || isExplicitSkip) {
        messCycle.meals.push({
          date,
          breakfast: newBreakfast,
          lunch: newLunch,
        });
      }

      await messCycle.save();

      return res.status(200).json(messCycle);
    } catch (error) {
      if ((error.name === "VersionError" || error.code === 11000) && retries > 1) {
        retries--;
        await new Promise((resolve) => setTimeout(resolve, 50));
        continue;
      }
      return res.status(500).json({ message: "Server Error", error: error.message });
    }
  }
};

module.exports = {
  createMessCycle,
  getCurrentMessCycle,
  getMessHistory,
  getMessCycleById,
  updateMessCycle,
  deleteMessCycle,
  updateMeal,
  importMessCycle,
};
