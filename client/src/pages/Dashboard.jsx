import { useState, useEffect } from 'react';
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
import { Calendar as CalendarIcon, CheckCircle2, Clock, Wallet, Receipt } from 'lucide-react';
import { ReceiptModal } from '../components/ReceiptModal';
import { useAuth } from '../hooks/useAuth';

export const Dashboard = () => {
  const { user } = useAuth();
  const [messCycle, setMessCycle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);

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
      alert('Import successful!');
      fetchCurrentMess();
    } catch (err) {
      alert('Failed to import: ' + err.message);
      setActionLoading(false);
    }
  };

  const handleMealUpdate = async (dateStr, updates) => {
    try {
      const updatedCycle = await api.updateMeal(messCycle._id, dateStr, updates);
      setMessCycle(updatedCycle);
    } catch (err) {
      // Create a toast or simple alert in a real app, using alert for simplicity here
      alert('Unable to save meal. Please try again.');
    }
  };

  const handleCompletePlan = async () => {
    if (!window.confirm('Are you sure you want to mark this plan as completed?')) return;
    
    try {
      setActionLoading(true);
      await api.updateMess(messCycle._id, { status: 'completed' });
      setMessCycle(null);
      // Optional: Show success message
    } catch (err) {
      alert('Failed to complete plan');
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
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm transition-colors">{error}</div>
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
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between transition-colors">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <span className="text-xs font-medium uppercase tracking-wider">Consumed</span>
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {consumed} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">days</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between transition-colors">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
            <Clock size={16} className="text-blue-500" />
            <span className="text-xs font-medium uppercase tracking-wider">Remaining</span>
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {remaining} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">days</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between transition-colors">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
            <CalendarIcon size={16} className="text-purple-500" />
            <span className="text-xs font-medium uppercase tracking-wider">Skipped</span>
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {skipped} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">days</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between transition-colors">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
            <Wallet size={16} className="text-amber-500" />
            <span className="text-xs font-medium uppercase tracking-wider">Plan</span>
          </div>
          <div className="text-lg font-bold text-gray-800 dark:text-gray-100">
            {messCycle.planType === 'full' ? 'Full' : 'Half'}
            <div className="text-xs font-normal text-gray-500 dark:text-gray-400 mt-1">₹{messCycle.amount} / {planDays} Days</div>
          </div>
        </div>
      </div>

      {/* Plan Details Banner */}
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div>
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">Start Date:</span>
            <span className="ml-2 text-gray-700 dark:text-gray-300">{format(new Date(messCycle.startDate), 'dd MMM yyyy')}</span>
          </div>
          <div>
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">Expected End:</span>
            <span className="ml-2 text-gray-700 dark:text-gray-300">{endDate ? format(endDate, 'dd MMM yyyy') : '-'}</span>
          </div>
          <div>
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">Payment Date:</span>
            <span className="ml-2 text-gray-700 dark:text-gray-300">{format(new Date(messCycle.paymentDate), 'dd MMM yyyy')}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowReceipt(true)}
            className="flex-1 sm:flex-none whitespace-nowrap px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex justify-center items-center gap-2"
          >
            <Receipt size={16} />
            <span className="hidden sm:inline">Receipt</span>
          </button>
          
          <button
            onClick={handleCompletePlan}
            disabled={actionLoading}
            className="flex-1 sm:flex-none whitespace-nowrap px-4 py-2 bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/40 transition-colors"
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
