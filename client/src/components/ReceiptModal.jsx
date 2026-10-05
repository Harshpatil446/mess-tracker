import { useEffect } from 'react';
import { format } from 'date-fns';
import { calculateConsumedDays, calculateSkippedDays, calculateEndDate } from '../utils/calculations';
import { X, Printer, Utensils } from 'lucide-react';

export const ReceiptModal = ({ isOpen, onClose, cycle, user }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    
    // Manage body class for printing
    if (isOpen) {
      document.body.classList.add('printing-receipt');
    } else {
      document.body.classList.remove('printing-receipt');
    }
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.classList.remove('printing-receipt');
    };
  }, [onClose, isOpen]);

  if (!isOpen || !cycle) return null;

  const planDays = 30;
  const consumed = calculateConsumedDays(cycle.meals);
  const skipped = calculateSkippedDays(cycle.meals);
  const endDate = calculateEndDate(cycle.startDate, planDays, cycle.meals);
  const sortedMeals = [...(cycle.meals || [])].sort((a, b) => new Date(a.date) - new Date(b.date));

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm print:hidden" onClick={onClose} />
      
      <div className="receipt-modal-container fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8 print:static print:transform-none print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:overflow-visible transition-colors">
        
        {/* Close button (Hidden on print) */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 print:hidden"
        >
          <X size={20} />
        </button>

        {/* Receipt Content */}
        <div className="receipt-content text-gray-800 dark:text-gray-100 print:text-black">
          <div className="text-center mb-6 border-b border-gray-200 dark:border-gray-700 pb-6 print:hidden">
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-sm">
                <Utensils className="text-white" size={24} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white print:text-black">Mess Tracker</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 print:text-gray-600 mt-1">Official Mess Receipt</p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center text-sm print:hidden">
              <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Date Generated</span>
              <span className="font-medium">{format(new Date(), 'dd MMM yyyy, hh:mm a')}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Customer Name</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 print:text-emerald-700">{user?.name}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Plan Type</span>
              <span className="font-medium capitalize print:text-black">{cycle.planType} Plan</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Status</span>
              <span className="font-medium uppercase print:text-black">{cycle.status}</span>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 print:bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100 dark:border-gray-700 print:border-gray-200">
            <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100 print:text-black uppercase tracking-wider">Cycle Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300 print:text-gray-700">Start Date</span>
                <span className="font-medium print:text-black">{format(new Date(cycle.startDate), 'dd MMM yyyy')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300 print:text-gray-700">Expected End</span>
                <span className="font-medium print:text-black">{endDate ? format(endDate, 'dd MMM yyyy') : '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300 print:text-gray-700">Days Consumed</span>
                <span className="font-medium print:text-black">{consumed} days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300 print:text-gray-700">Days Skipped</span>
                <span className="font-medium print:text-black">{skipped} days</span>
              </div>
            </div>
          </div>

          {sortedMeals.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100 print:text-black uppercase tracking-wider">Detailed Meal Log</h3>
              <div className="max-h-48 overflow-y-auto print:max-h-none print:overflow-visible border border-gray-200 dark:border-gray-700 print:border-gray-300 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800 print:bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-300 print:text-gray-800 border-b border-gray-200 dark:border-gray-700 print:border-gray-300">Date</th>
                      <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-300 print:text-gray-800 border-b border-gray-200 dark:border-gray-700 print:border-gray-300 text-center">Breakfast</th>
                      <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-300 print:text-gray-800 border-b border-gray-200 dark:border-gray-700 print:border-gray-300 text-center">Lunch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 print:divide-gray-200">
                    {sortedMeals.map((meal) => (
                      <tr key={meal.date}>
                        <td className="px-3 py-1.5 whitespace-nowrap text-gray-800 dark:text-gray-200 print:text-black">{format(new Date(meal.date), 'dd MMM yyyy')}</td>
                        <td className="px-3 py-1.5 text-center">{meal.breakfast ? '✅' : '❌'}</td>
                        <td className="px-3 py-1.5 text-center">{meal.lunch ? '✅' : '❌'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-2 flex justify-between items-center print:hidden">
            <span className="text-base font-semibold text-gray-900 dark:text-gray-100">Total Paid Amount</span>
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">₹{cycle.amount}</span>
          </div>
          <div className="text-xs text-right text-gray-500 dark:text-gray-400 print:hidden">
            Paid on {format(new Date(cycle.paymentDate), 'dd MMM yyyy')}
          </div>
        </div>

        {/* Action Button (Hidden on print) */}
        <div className="mt-8 pt-4 flex gap-3 print:hidden">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex justify-center items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Printer size={18} />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </>
  );
};
