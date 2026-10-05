import { useState, useRef } from 'react';
import { format, addDays } from 'date-fns';
import { Upload } from 'lucide-react';

export const MessPlanForm = ({ onSubmit, onImport, loading }) => {
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    planType: 'full',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Automatically calculate amount and initial end date (30 days from start)
    const amount = formData.planType === 'full' ? 2400 : 1800;
    const endDate = format(addDays(new Date(formData.startDate), 30), 'yyyy-MM-dd');
    
    onSubmit({
      ...formData,
      amount,
      endDate
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Create New Mess Plan</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan Type</label>
            <select
              value={formData.planType}
              onChange={(e) => setFormData({ ...formData, planType: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
            >
              <option value="full">Full Plan (₹2400)</option>
              <option value="half">Half Plan (₹1800)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
            <input
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Date</label>
            <input
              type="date"
              required
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
            />
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row justify-end items-center gap-3">
          {onImport && (
            <div className="w-full sm:w-auto flex justify-end">
              <input 
                type="file" 
                accept=".json" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={(e) => {
                  onImport(e);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-gray-500 disabled:opacity-50 transition-colors"
              >
                <Upload size={18} />
                <span>Import JSON</span>
              </button>
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-700 dark:hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating...' : 'Create Plan'}
          </button>
        </div>
      </form>
    </div>
  );
};
