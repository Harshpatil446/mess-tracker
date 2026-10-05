import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import * as api from '../services/api';
import { calculateConsumedDays, calculateSkippedDays } from '../utils/calculations';
import { Calendar as CalendarComponent } from '../components/Calendar';
import { ReceiptModal } from '../components/ReceiptModal';
import { useAuth } from '../hooks/useAuth';
import { History as HistoryIcon, ChevronDown, ChevronUp, Trash2, Upload, Download, Receipt } from 'lucide-react';

export const History = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [receiptCycle, setReceiptCycle] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await api.getMessHistory();
        setHistory(data);
      } catch (err) {
        setError('Failed to load history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Mock function so the read-only calendar doesn't break
  const handleMealUpdate = () => {
    alert("Cannot modify past mess cycles.");
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this mess history? This cannot be undone.")) return;
    
    try {
      await api.deleteMess(id);
      setHistory(prev => prev.filter(cycle => cycle._id !== id));
    } catch (err) {
      setError('Failed to delete history item');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const text = await file.text();
      const data = JSON.parse(text);
      await api.importMessCycles(data);
      const newHistory = await api.getMessHistory();
      setHistory(newHistory);
      alert('Import successful!');
    } catch (err) {
      alert('Failed to import: ' + err.message);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      // Fetch both history and active
      const historyCycles = await api.getMessHistory();
      let activeCycle = null;
      try {
        activeCycle = await api.getCurrentMess();
      } catch (e) { 
        // ignore if no active cycle
      }

      const allCycles = [...historyCycles];
      if (activeCycle) {
        allCycles.push(activeCycle);
      }

      const formattedCycles = allCycles.map(cycle => {
        const mealsObj = {};
        if (cycle.meals) {
          cycle.meals.forEach(m => {
            mealsObj[m.date] = {
              breakfast: m.breakfast,
              lunch: m.lunch
            };
          });
        }

        return {
          id: cycle._id,
          type: cycle.planType,
          startDate: cycle.startDate,
          paymentDate: cycle.paymentDate,
          meals: mealsObj
        };
      });

      const exportData = {
        app: "mess-tiffin-tracker",
        version: 1,
        exportedAt: new Date().toISOString(),
        store: {
          cycles: formattedCycles,
          activeId: activeCycle ? activeCycle._id : null
        }
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadNode = document.createElement('a');
      downloadNode.setAttribute("href", dataStr);
      downloadNode.setAttribute("download", `mess-tracker-backup-${format(new Date(), 'yyyy-MM-dd')}.json`);
      document.body.appendChild(downloadNode);
      downloadNode.click();
      downloadNode.remove();
    } catch (err) {
      alert("Failed to export data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <HistoryIcon size={32} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No history yet</h3>
        <p className="text-gray-500 text-sm">Your completed mess cycles will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1 mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 transition-colors">Mess History</h2>
        
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-sm font-medium"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
          
          <div>
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImport}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors text-sm font-medium"
            >
              <Upload size={16} />
              <span>Import</span>
            </button>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm transition-colors">{error}</div>
      )}

      {history.map((cycle) => {
        const isExpanded = expandedId === cycle._id;
        const consumed = calculateConsumedDays(cycle.meals);
        const skipped = calculateSkippedDays(cycle.meals);

        return (
          <div key={cycle._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
            {/* Header / Summary */}
            <div 
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              onClick={() => toggleExpand(cycle._id)}
            >
              <div className="flex items-start sm:items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg
                  ${cycle.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}
                `}>
                  {format(new Date(cycle.startDate), 'MMM')}
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                      {cycle.planType === 'full' ? 'Full Plan' : 'Half Plan'} (₹{cycle.amount})
                    </h3>
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full
                      ${cycle.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}
                    `}>
                      {cycle.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(cycle.startDate), 'dd MMM yyyy')} → {cycle.endDate ? format(new Date(cycle.endDate), 'dd MMM yyyy') : 'TBD'}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6 sm:gap-8 border-t sm:border-0 border-gray-100 dark:border-gray-700 pt-4 sm:pt-0">
                <div className="text-sm">
                  <div className="text-gray-500 dark:text-gray-400 mb-0.5">Consumed</div>
                  <div className="font-semibold text-gray-800 dark:text-gray-100">{consumed} days</div>
                </div>
                <div className="text-sm">
                  <div className="text-gray-500 dark:text-gray-400 mb-0.5">Skipped</div>
                  <div className="font-semibold text-gray-800 dark:text-gray-100">{skipped} days</div>
                </div>
                <div className="flex items-center gap-1 sm:gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setReceiptCycle(cycle);
                    }}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                    title="View Receipt"
                  >
                    <Receipt size={18} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(cycle._id, e)}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete History"
                  >
                    <Trash2 size={18} />
                  </button>
                  <div className="text-gray-400 dark:text-gray-500 p-1">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded Table View */}
            {isExpanded && (
              <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 sm:p-6 transition-colors">
                {cycle.meals && cycle.meals.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
                      <thead className="bg-gray-100 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Date</th>
                          <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 text-center">Breakfast</th>
                          <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 text-center">Lunch</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {[...cycle.meals].sort((a, b) => new Date(a.date) - new Date(b.date)).map((meal) => (
                          <tr key={meal.date} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-gray-800 dark:text-gray-200">
                              {format(new Date(meal.date), 'dd MMM yyyy')}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {meal.breakfast ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">✅</span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400">❌</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {meal.lunch ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">✅</span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400">❌</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">No meals logged for this cycle.</div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <ReceiptModal 
        isOpen={!!receiptCycle} 
        onClose={() => setReceiptCycle(null)} 
        cycle={receiptCycle}
        user={user}
      />
    </div>
  );
};
