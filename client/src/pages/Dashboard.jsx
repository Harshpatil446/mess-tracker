import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import * as api from '../services/api';
import { MessPlanForm } from '../components/MessPlanForm';
import { Calendar } from '../components/Calendar';
import {
  calculateConsumedDays,
  calculateRemainingDays,
  calculateSkippedDays,
  calculateEndDate
} from '../utils/calculations';
import { Calendar as CalendarIcon, CheckCircle2, Clock, Wallet, Receipt, AlertCircle, Check } from 'lucide-react';
import { ReceiptModal } from '../components/ReceiptModal';
import { useAuth } from '../hooks/useAuth';

export const Dashboard = () => {
  const { user } = useAuth();
  const [messCycle, setMessCycle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [toast, setToast] = useState(null);

  // Keep a reference to the latest messCycle for queued async updates
  const messCycleRef = useRef(messCycle);
  useEffect(() => {
    messCycleRef.current = messCycle;
  }, [messCycle]);

  // Sequential request queue to prevent race conditions or Mongo version collisions
  const requestQueueRef = useRef(Promise.resolve());

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const fetchCurrentMess = async () => {
    try {
      const data = await api.getCurrentMess();
      setMessCycle(data);
    } catch (err) {
      if (err.response?.status !== 404) {
        setError('Failed to load mess data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentMess();
  }, []);

  const handleCreatePlan = async (formData) => {
    setActionLoading(true);
    try {
      const newPlan = await api.createMess(formData);
      setMessCycle(newPlan);
      showToast('New mess plan created successfully!', 'success');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create plan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setActionLoading(true);
      const text = await file.text();
      const data = JSON.parse(text);
      await api.importMessCycles(data);
      showToast('Data imported successfully!', 'success');
      fetchCurrentMess();
    } catch (err) {
      showToast('Failed to import: ' + err.message, 'error');
      setActionLoading(false);
    }
  };

  // Instant optimistic update with sequential background sync
  const handleMealUpdate = async (dateStr, updates) => {
    const currentCycle = messCycleRef.current;
    if (!currentCycle) return;

    const previousMeals = currentCycle.meals ? [...currentCycle.meals] : [];

    // 1. Calculate optimistic state locally (0ms latency!)
    const existingIndex = previousMeals.findIndex((m) => m.date === dateStr);
    let newBreakfast;
    let newLunch;

    if (existingIndex !== -1) {
      const existing = previousMeals[existingIndex];
      newBreakfast = updates.breakfast !== undefined ? Boolean(updates.breakfast) : Boolean(existing.breakfast);
      newLunch = updates.lunch !== undefined ? Boolean(updates.lunch) : Boolean(existing.lunch);
    } else {
      newBreakfast = updates.breakfast !== undefined ? Boolean(updates.breakfast) : false;
      newLunch = updates.lunch !== undefined ? Boolean(updates.lunch) : false;
    }

    const isExplicitSkip = updates.breakfast === false && updates.lunch === false && !updates.clear;
    let nextMeals = previousMeals.filter((m) => m.date !== dateStr);

    if (newBreakfast || newLunch || isExplicitSkip) {
      nextMeals.push({
        date: dateStr,
        breakfast: newBreakfast,
        lunch: newLunch,
      });
    }

    const optimisticCycle = {
      ...currentCycle,
      meals: nextMeals,
    };

    // Immediately update UI
    setMessCycle(optimisticCycle);
    messCycleRef.current = optimisticCycle;

    // 2. Queue the API call sequentially to ensure order and avoid MongoDB version clashes
    requestQueueRef.current = requestQueueRef.current
      .then(async () => {
        try {
          const updated = await api.updateMeal(currentCycle._id, dateStr, updates);
          if (updated && updated.meals) {
            // Quietly synchronize with server state
            setMessCycle((prev) => (prev ? { ...prev, meals: updated.meals } : prev));
          }
        } catch (err) {
          console.error('Failed to sync meal:', err);
          // Rollback on error
          setMessCycle((prev) => (prev ? { ...prev, meals: previousMeals } : prev));
          showToast('Failed to save meal. Reverting changes...', 'error');
        }
      })
      .catch((err) => {
        console.error('Queue error:', err);
      });
  };

  const handleCompletePlan = async () => {
    if (!window.confirm('Are you sure you want to mark this plan as completed?')) return;
    
    try {
      setActionLoading(true);
      await api.updateMess(messCycle._id, { status: 'completed' });
      setMessCycle(null);
      showToast('Plan marked as completed!', 'success');
    } catch (err) {
      showToast('Failed to complete plan', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!messCycle) {
    return (
      <div className="max-w-2xl mx-auto">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl mb-4 text-sm transition-colors border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}
        <MessPlanForm onSubmit={handleCreatePlan} onImport={handleImport} loading={actionLoading} />
      </div>
    );
  }

  const planDays = 30; // standard 30 day plan
  const consumed = calculateConsumedDays(messCycle.meals);
  const remaining = calculateRemainingDays(planDays, messCycle.meals);
  const skipped = calculateSkippedDays(messCycle.meals);
  const endDate = calculateEndDate(messCycle.startDate, planDays, messCycle.meals);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl backdrop-blur-md border text-sm font-semibold animate-in fade-in slide-in-from-top-4 duration-200 ${
          toast.type === 'error'
            ? 'bg-rose-900/90 text-white border-rose-700 shadow-rose-900/30'
            : toast.type === 'success'
            ? 'bg-emerald-900/90 text-white border-emerald-700 shadow-emerald-900/30'
            : 'bg-gray-900/90 text-white border-gray-700'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={18} className="text-rose-400" /> : <Check size={18} className="text-emerald-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/80 flex flex-col justify-between transition-all hover:shadow-md">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Consumed</span>
          </div>
          <div className="text-2xl font-black text-gray-800 dark:text-gray-100">
            {consumed} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">days</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/80 flex flex-col justify-between transition-all hover:shadow-md">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
            <Clock size={16} className="text-blue-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Remaining</span>
          </div>
          <div className="text-2xl font-black text-gray-800 dark:text-gray-100">
            {remaining} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">days</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/80 flex flex-col justify-between transition-all hover:shadow-md">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
            <CalendarIcon size={16} className="text-purple-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Skipped</span>
          </div>
          <div className="text-2xl font-black text-gray-800 dark:text-gray-100">
            {skipped} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">days</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/80 flex flex-col justify-between transition-all hover:shadow-md">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
            <Wallet size={16} className="text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Plan</span>
          </div>
          <div className="text-lg font-black text-gray-800 dark:text-gray-100">
            {messCycle.planType === 'full' ? 'Full' : 'Half'}
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">₹{messCycle.amount} / {planDays} Days</div>
          </div>
        </div>
      </div>

      {/* Plan Details Banner */}
      <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">Start Date:</span>
            <span className="ml-2 font-medium text-gray-700 dark:text-gray-300">{format(new Date(messCycle.startDate), 'dd MMM yyyy')}</span>
          </div>
          <div>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">Expected End:</span>
            <span className="ml-2 font-medium text-gray-700 dark:text-gray-300">{endDate ? format(endDate, 'dd MMM yyyy') : '-'}</span>
          </div>
          <div>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">Payment Date:</span>
            <span className="ml-2 font-medium text-gray-700 dark:text-gray-300">{format(new Date(messCycle.paymentDate), 'dd MMM yyyy')}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowReceipt(true)}
            className="flex-1 sm:flex-none whitespace-nowrap px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex justify-center items-center gap-2 shadow-sm"
          >
            <Receipt size={16} />
            <span className="hidden sm:inline">Receipt</span>
          </button>
          
          <button
            onClick={handleCompletePlan}
            disabled={actionLoading}
            className="flex-1 sm:flex-none whitespace-nowrap px-4 py-2 bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-bold hover:bg-emerald-50 dark:hover:bg-emerald-900/40 transition-colors shadow-sm disabled:opacity-50"
          >
            {actionLoading ? 'Processing...' : 'Mark as Completed'}
          </button>
        </div>
      </div>

      {/* Calendar */}
      <Calendar messCycle={messCycle} onMealUpdate={handleMealUpdate} />
      
      <ReceiptModal 
        isOpen={showReceipt} 
        onClose={() => setShowReceipt(false)} 
        cycle={messCycle}
        user={user}
      />
    </div>
  );
};
