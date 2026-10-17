import { useState, useMemo, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameDay,
  isAfter,
  startOfDay,
  isBefore
} from 'date-fns';
import { ChevronLeft, ChevronRight, Check, X, Lock } from 'lucide-react';

// Safely parse date strings (e.g., YYYY-MM-DD or ISO strings) into local Date without UTC day shift
const parseLocalDate = (dateVal) => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return dateVal;
  const parts = String(dateVal).split('T')[0].split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  return new Date(dateVal);
};

const DayCard = ({ day, dateStr, meal, isToday, onMealUpdate, cycleStartDate, cycleStatus }) => {
  const parsedStart = parseLocalDate(cycleStartDate);
  const isBeforeStart = parsedStart ? isBefore(day, startOfDay(parsedStart)) : false;
  const isFutureDay = isAfter(day, startOfDay(new Date()));
  
  // Only lock if the cycle is completed (history) or day is before cycle start date
  const isLocked = cycleStatus === 'completed' || isBeforeStart;

  const isSkipped = Boolean(meal && !meal.breakfast && !meal.lunch);
  const isFullDay = Boolean(meal?.breakfast && meal?.lunch);
  const isBreakfastOnly = Boolean(meal?.breakfast && !meal?.lunch);
  const isLunchOnly = Boolean(!meal?.breakfast && meal?.lunch);
  const hasMeal = Boolean(meal?.breakfast || meal?.lunch);

  const handleMealToggle = (type) => {
    if (isLocked) return;
    if (isSkipped) {
      // If currently marked skipped, clicking Breakfast or Lunch toggles that meal ON
      onMealUpdate(dateStr, { [type]: true });
    } else {
      onMealUpdate(dateStr, { [type]: !meal?.[type] });
    }
  };

  const handleSkipToggle = () => {
    if (isLocked) return;
    if (isSkipped) {
      // Toggle off skip -> clears day
      onMealUpdate(dateStr, { breakfast: false, lunch: false, clear: true });
    } else {
      // Mark as skipped
      onMealUpdate(dateStr, { breakfast: false, lunch: false });
    }
  };

  const statusClass = useMemo(() => {
    if (isLocked) return "border-gray-100 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-800/40 opacity-60"; 
    if (isFullDay) return "border-emerald-300 dark:border-emerald-800/70 bg-gradient-to-br from-emerald-50/90 to-teal-50/60 dark:from-emerald-950/30 dark:to-teal-950/20 shadow-sm";
    if (hasMeal) return "border-amber-300 dark:border-amber-800/70 bg-gradient-to-br from-amber-50/90 to-orange-50/60 dark:from-amber-950/30 dark:to-orange-950/20 shadow-sm";
    if (isSkipped) return "border-rose-300 dark:border-rose-800/70 bg-gradient-to-br from-rose-50/90 to-red-50/60 dark:from-rose-950/30 dark:to-red-950/20 shadow-sm";
    return "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-md";
  }, [hasMeal, isFullDay, isSkipped, isLocked]);

  return (
    <div
      id={isToday ? "today-card" : undefined}
      className={`relative rounded-2xl border p-2.5 sm:p-3 flex flex-col justify-between transition-all duration-200 ${statusClass} ${
        isToday ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-gray-900 shadow-md' : (!isLocked && 'hover:-translate-y-0.5')
      }`}
    >
      {/* Top Header: Date number & Status Badge */}
      <div className="flex items-center justify-between mb-2 z-10">
        <div className="flex items-center gap-1.5">
          <span className={`text-base sm:text-lg font-extrabold tracking-tight ${
            isToday 
              ? 'text-emerald-600 dark:text-emerald-400' 
              : (isLocked ? 'text-gray-400 dark:text-gray-600' : 'text-gray-800 dark:text-gray-100')
          }`}>
            {format(day, 'd')}
          </span>
          <span className={`text-[10px] sm:text-xs font-semibold uppercase lg:hidden ${
            isToday ? 'text-emerald-500' : 'text-gray-400 dark:text-gray-500'
          }`}>
            {format(day, 'EEE')}
          </span>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1">
          {isToday && (
            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-emerald-500 text-white uppercase tracking-wider">
              Today
            </span>
          )}
          {isFullDay && (
            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
              Full Day
            </span>
          )}
          {isBreakfastOnly && (
            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
              Morning
            </span>
          )}
          {isLunchOnly && (
            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
              Noon
            </span>
          )}
          {isSkipped && (
            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
              Skipped
            </span>
          )}
          {isFutureDay && !hasMeal && !isSkipped && !isLocked && (
            <span className="px-1.5 py-0.5 text-[9px] font-medium rounded-full bg-gray-100 dark:bg-gray-700/70 text-gray-500 dark:text-gray-400">
              Upcoming
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      {isLocked ? (
        <div className="flex flex-col items-center justify-center py-5 opacity-75">
          <Lock size={18} className="text-gray-400 dark:text-gray-500 mb-1" />
          <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
            {isBeforeStart ? 'Pre-Plan' : 'Locked'}
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 mt-auto">
          {/* Breakfast Checkbox */}
          <button
            type="button"
            onClick={() => handleMealToggle('breakfast')}
            className={`flex items-center gap-2 w-full p-1.5 rounded-xl border transition-all duration-150 text-left group ${
              meal?.breakfast
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-900 dark:text-emerald-200 shadow-sm'
                : 'bg-white/70 dark:bg-gray-800/70 border-gray-200/80 dark:border-gray-700/80 hover:border-emerald-400 dark:hover:border-emerald-600 text-gray-700 dark:text-gray-300'
            }`}
          >
            <div
              className={`w-4 h-4 sm:w-5 sm:h-5 rounded-md flex items-center justify-center border-2 transition-all flex-shrink-0 ${
                meal?.breakfast
                  ? 'bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-400/40 text-white'
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 group-hover:border-emerald-400 dark:group-hover:border-emerald-500'
              }`}
            >
              {meal?.breakfast && <Check size={12} strokeWidth={3} className="text-white" />}
            </div>
            <span className="text-[11px] sm:text-xs font-bold tracking-tight whitespace-nowrap">
              Breakfast
            </span>
          </button>

          {/* Lunch Checkbox */}
          <button
            type="button"
            onClick={() => handleMealToggle('lunch')}
            className={`flex items-center gap-2 w-full p-1.5 rounded-xl border transition-all duration-150 text-left group ${
              meal?.lunch
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-900 dark:text-emerald-200 shadow-sm'
                : 'bg-white/70 dark:bg-gray-800/70 border-gray-200/80 dark:border-gray-700/80 hover:border-emerald-400 dark:hover:border-emerald-600 text-gray-700 dark:text-gray-300'
            }`}
          >
            <div
              className={`w-4 h-4 sm:w-5 sm:h-5 rounded-md flex items-center justify-center border-2 transition-all flex-shrink-0 ${
                meal?.lunch
                  ? 'bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-400/40 text-white'
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 group-hover:border-emerald-400 dark:group-hover:border-emerald-500'
              }`}
            >
              {meal?.lunch && <Check size={12} strokeWidth={3} className="text-white" />}
            </div>
            <span className="text-[11px] sm:text-xs font-bold tracking-tight whitespace-nowrap">
              Lunch
            </span>
          </button>

          {/* Skip Day Button */}
          <button
            type="button"
            onClick={handleSkipToggle}
            className={`flex items-center justify-between w-full px-2 py-1 rounded-lg border text-[10px] sm:text-[11px] font-bold tracking-tight transition-all duration-150 ${
              isSkipped
                ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                : 'bg-gray-50/80 dark:bg-gray-800/60 border-transparent text-gray-500 dark:text-gray-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-200 dark:hover:border-rose-900/50 hover:text-rose-600 dark:hover:text-rose-400'
            }`}
          >
            <span>{isSkipped ? 'Skipped' : 'Skip Day'}</span>
            {isSkipped ? (
              <X size={12} strokeWidth={3} />
            ) : (
              <span className="text-[9px] opacity-60">✕</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export const Calendar = ({ messCycle, onMealUpdate }) => {
  const [currentDate, setCurrentDate] = useState(() => {
    if (messCycle?.status === 'completed' && messCycle?.startDate) {
      return parseLocalDate(messCycle.startDate) || new Date();
    }
    return new Date();
  });

  // Automatically scroll to today's date when calendar loads
  useEffect(() => {
    const timer = setTimeout(() => {
      const todayCard = document.getElementById('today-card');
      if (todayCard) {
        todayCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [currentDate]);

  const days = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Map meals for quick lookup (safely merging duplicates if any exist)
  const mealsMap = useMemo(() => {
    if (!messCycle?.meals) return {};
    return messCycle.meals.reduce((acc, meal) => {
      if (!acc[meal.date]) {
        acc[meal.date] = { ...meal };
      } else {
        // Defensive merge of duplicates
        acc[meal.date] = {
          date: meal.date,
          breakfast: Boolean(acc[meal.date].breakfast || meal.breakfast),
          lunch: Boolean(acc[meal.date].lunch || meal.lunch),
        };
      }
      return acc;
    }, {});
  }, [messCycle]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
      {/* Calendar Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 transition-colors">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 tracking-tight">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            aria-label="Previous Month"
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/80 text-gray-600 dark:text-gray-300 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextMonth}
            aria-label="Next Month"
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/80 text-gray-600 dark:text-gray-300 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4 sm:p-6 bg-gray-50/50 dark:bg-gray-900/40 transition-colors">
        <div className="hidden lg:grid lg:grid-cols-7 gap-4 mb-3">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
          {/* Empty cells for start of month offset (only on large screens) */}
          {Array.from({ length: days[0].getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="hidden lg:block p-2" />
          ))}

          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const meal = mealsMap[dateStr];
            const isToday = isSameDay(day, new Date());

            return (
              <DayCard 
                key={dateStr}
                day={day}
                dateStr={dateStr}
                meal={meal}
                isToday={isToday}
                onMealUpdate={onMealUpdate}
                cycleStartDate={messCycle?.startDate}
                cycleStatus={messCycle?.status}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
