import { addDays, parseISO, isAfter, isBefore, format } from "date-fns";

export const calculateFullDays = (meals) => {
  if (!meals) return 0;
  return meals.filter((meal) => meal.breakfast && meal.lunch).length;
};

export const calculateHalfDays = (meals) => {
  if (!meals) return 0;
  return meals.filter(
    (meal) => (meal.breakfast && !meal.lunch) || (!meal.breakfast && meal.lunch)
  ).length;
};

export const calculateSkippedDays = (meals) => {
  if (!meals) return 0;
  return meals.filter((meal) => !meal.breakfast && !meal.lunch).length;
};

export const calculateConsumedDays = (meals) => {
  const full = calculateFullDays(meals);
  const half = calculateHalfDays(meals);
  return full + half * 0.5;
};

export const calculateRemainingDays = (planDays, meals) => {
  const consumed = calculateConsumedDays(meals);
  return Math.max(0, planDays - consumed);
};

export const calculateEndDate = (startDate, planDays, meals) => {
  // If plan is 30 days, we need 30 consumed days.
  // We can just iterate day by day from startDate.
  // For each day, if it exists in meals, we check how much is consumed (0, 0.5, 1).
  // If it's not in meals, we assume it will be 1 (full consumption for future days).
  
  if (!startDate || !planDays) return null;
  
  const start = typeof startDate === "string" ? parseISO(startDate) : startDate;
  
  let currentDay = new Date(start);
  let daysToConsume = planDays;
  
  // Map meals by date for quick lookup
  const mealsMap = (meals || []).reduce((acc, meal) => {
    acc[meal.date] = meal;
    return acc;
  }, {});

  while (daysToConsume > 0) {
    const dateStr = format(currentDay, "yyyy-MM-dd");
    const meal = mealsMap[dateStr];
    
    let consumedToday = 1; // default assumption for future/unrecorded days
    
    if (meal) {
      if (meal.breakfast && meal.lunch) consumedToday = 1;
      else if (meal.breakfast || meal.lunch) consumedToday = 0.5;
      else consumedToday = 0; // skipped
    }
    
    daysToConsume -= consumedToday;
    
    if (daysToConsume > 0) {
      currentDay = addDays(currentDay, 1);
    } else if (daysToConsume < 0) {
      // If daysToConsume goes negative (e.g., was 0.5 and we subtracted 1),
      // it means the plan technically ends in the middle of a day, but end date is still currentDay
    }
  }
  
  return currentDay;
};
