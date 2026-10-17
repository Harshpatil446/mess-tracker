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
import { ChevronLeft, ChevronRight, Check, X, Edit2, Lock, Coffee, Utensils, CheckCircle2, XCircle } from 'lucide-react';

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
  
  // Only lock if cycle is completed (history) or date is before cycle start
  const isLocked = cycleStatus === 'completed' || isBeforeStart;

  // Edit mode toggle (clean summary by default, checkboxes when editing)
  const [isEditing, setIsEditing] = useState(false);

  const handleMealToggle = (type) => {
    if (isLocked) return;
    const isCurrentlySkipped = meal && !meal.breakfast && !meal.lunch;
    if (isCurrentlySkipped) {
      onMealUpdate(dateStr, { [type]: true });
    } else {
      onMealUpdate(dateStr, { [type]: !meal?.[type] });
    }
  };

  const handleSkip = () => {
    if (isLocked) return;
    onMealUpdate(dateStr, { breakfast: false, lunch: false });
    setIsEditing(false);
  };

  const statusClass = useMemo(() => {
    if (isLocked) return "border-gray-100 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-800/40 opacity-50"; 
    if (!meal) return "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600";
    if (meal.breakfast && meal.lunch) return "border-emerald-200 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20";
    if (meal.breakfast || meal.lunch) return "border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20";
    return "border-red-200 dark:border-red-900/50 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20"; // skipped
  }, [meal, isLocked]);

  return (
    <div
      id={isToday ? "today-card" : undefined}
      className={`relative rounded-2xl border p-2 sm:p-3 flex flex-col justify-between min-h-[110px] sm:min-h-[120px] transition-all duration-200 ${statusClass} ${
        isToday ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-gray-900 shadow-md' : (!isLocked && 'hover:shadow-md hover:-translate-y-0.5')
      }`}
    >
      {/* Top Header: Day Number, Day Name, Edit Button */}
      <div className="flex items-center justify-between mb-1 z-10">
        <div className="flex items-center gap-1.5">
          <span className={`text-base sm:text-lg font-bold ${
            isToday ? 'text-emerald-600 dark:text-emerald-400' : (isLocked ? 'text-gray-400 dark:text-gray-600' : 'text-gray-800 dark:text-gray-200')
          }`}>
            {format(day, 'd')}
          </span>
          <span className={`text-[10px] sm:text-xs font-semibold uppercase lg:hidden ${
            isToday ? 'text-emerald-500' : 'text-gray-400 dark:text-gray-500'
          }`}>
            {format(day, 'EEE')}
          </span>
        </div>

        {/* Floating Edit Button when not editing */}
        {!isEditing && !isLocked && meal && (
          <button 
            type="button"
            onClick={() => setIsEditing(true)}
            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-gray-700 rounded-lg transition-all"
            title="Edit meal"
            aria-label="Edit meal"
          >
            <Edit2 size={13} />
          </button>
        )}
      </div>

      {/* Card Content: Clean Summary View vs Checkbox Edit View */}
      <div className="flex flex-col h-full justify-end mt-auto">
        {!isEditing ? (
          <div 
            className={`flex flex-col h-full justify-center items-center text-center ${meal && !isLocked ? 'cursor-pointer group' : ''}`}
            onClick={() => {
              if (meal && !isLocked) setIsEditing(true);
            }}
          >
            {meal?.breakfast && meal?.lunch ? (
              <div className="flex flex-col items-center transition-transform group-hover:scale-105">
                <CheckCircle2 size={24} className="text-emerald-500 mb-1 drop-shadow-sm dark:drop-shadow-none" />
                <span className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400">Full Day</span>
              </div>
            ) : meal?.breakfast ? (
              <div className="flex flex-col items-center transition-transform group-hover:scale-105">
                <Coffee size={24} className="text-amber-500 mb-1 drop-shadow-sm dark:drop-shadow-none" />
                <span className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-400">Breakfast</span>
              </div>
            ) : meal?.lunch ? (
              <div className="flex flex-col items-center transition-transform group-hover:scale-105">
                <Utensils size={24} className="text-amber-500 mb-1 drop-shadow-sm dark:drop-shadow-none" />
                <span className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-400">Lunch</span>
              </div>
            ) : meal ? (
              <div className="flex flex-col items-center transition-transform group-hover:scale-105">
                <XCircle size={24} className="text-red-400 dark:text-red-500 mb-1 drop-shadow-sm dark:drop-shadow-none" />
                <span className="text-xs sm:text-sm font-bold text-red-700 dark:text-red-400">Skipped</span>
              </div>
            ) : isBeforeStart ? (
              <div className="flex flex-col items-center opacity-75">
                <Lock size={16} className="text-gray-400 dark:text-gray-500 mb-1" />
                <span className="text-[10px] sm:text-xs font-medium text-gray-400 dark:text-gray-500">Pre-Plan</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-200 dark:hover:border-emerald-800/50 rounded-lg text-[10px] sm:text-xs font-semibold transition-colors mt-1"
              >
                + Add Meal
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1 animate-in fade-in duration-150">
            {/* Breakfast Checkbox */}
            <button
              type="button"
              onClick={() => handleMealToggle('breakfast')}
              className="flex items-center gap-1.5 group w-full p-1 hover:bg-white/60 dark:hover:bg-gray-700/60 rounded-lg transition-colors text-left"
            >
              <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-md flex items-center justify-center border-2 transition-all flex-shrink-0 ${
                meal?.breakfast 
                  ? 'bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-200 dark:shadow-none' 
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 group-hover:border-emerald-400 dark:group-hover:border-emerald-500'
              }`}>
                {meal?.breakfast && <Check size={12} strokeWidth={3} className="text-white" />}
              </div>
              <span className={`text-[10px] sm:text-xs font-bold whitespace-nowrap ${
                meal?.breakfast ? "text-emerald-800 dark:text-emerald-400" : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200"
              }`}>
                Breakfast
              </span>
            </button>

            {/* Lunch Checkbox */}
            <button
              type="button"
              onClick={() => handleMealToggle('lunch')}
              className="flex items-center gap-1.5 group w-full p-1 hover:bg-white/60 dark:hover:bg-gray-700/60 rounded-lg transition-colors text-left"
            >
              <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-md flex items-center justify-center border-2 transition-all flex-shrink-0 ${
                meal?.lunch 
                  ? 'bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-200 dark:shadow-none' 
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 group-hover:border-emerald-400 dark:group-hover:border-emerald-500'
              }`}>
                {meal?.lunch && <Check size={12} strokeWidth={3} className="text-white" />}
              </div>
              <span className={`text-[10px] sm:text-xs font-bold whitespace-nowrap ${
                meal?.lunch ? "text-emerald-800 dark:text-emerald-400" : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200"
              }`}>
                Lunch
              </span>
            </button>

            {/* Skip Option */}
            <button
              type="button"
              onClick={handleSkip}
              className="flex items-center gap-1.5 group w-full p-1 hover:bg-white/60 dark:hover:bg-gray-700/60 rounded-lg transition-colors mt-0.5 border-t border-gray-200/60 dark:border-gray-600/50 text-left"
            >
              <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-md flex items-center justify-center border-2 transition-all flex-shrink-0 ${
                (meal && !meal.breakfast && !meal.lunch) 
                  ? 'bg-red-500 border-red-500 shadow-sm shadow-red-200 dark:shadow-none' 
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 group-hover:border-red-400 dark:group-hover:border-red-500'
              }`}>
                {(meal && !meal.breakfast && !meal.lunch) && <X size={12} strokeWidth={3} className="text-white" />}
              </div>
              <span className={`text-[10px] sm:text-xs font-bold whitespace-nowrap ${
                (meal && !meal.breakfast && !meal.lunch) ? "text-red-800 dark:text-red-400" : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200"
              }`}>
                Skip
              </span>
            </button>

            {/* Done button to close edit mode */}
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex items-center justify-center gap-1.5 w-full mt-1 py-1 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-all shadow-sm"
            >
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wide">Done</span>
            </button>
          </div>
        )}
      </div>
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
      {/* Calendar Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 transition-colors">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            aria-label="Previous Month"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={nextMonth}
            aria-label="Next Month"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4 sm:p-6 bg-gray-50/50 dark:bg-gray-800/50 transition-colors">
        <div className="hidden lg:grid lg:grid-cols-7 gap-4 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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
