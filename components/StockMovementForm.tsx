
import React, { useState, useMemo } from 'react';
import { ArrowDownLeft, ArrowUpRight, Check, X, Calendar, Edit2, Trash2, Plus, AlertCircle, RotateCcw, FilterX } from 'lucide-react';
import { Product, MovementType, Transaction } from '../types';
import { EditTransactionModal } from './EditTransactionModal';

interface StockMovementFormProps {
  type: MovementType;
  products: Product[];
  onSubmit: (items: { productId: string; quantity: number; notes: string }[]) => void;
  onCancel: () => void;
  // New props for list view
  transactions?: Transaction[];
  onUpdateTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
}

interface EntryRow {
  localId: string;
  productId: string;
  quantity: number;
  notes: string;
}

export const StockMovementForm: React.FC<StockMovementFormProps> = ({ 
  type, 
  products, 
  onSubmit, 
  onCancel,
  transactions = [], 
  onUpdateTransaction,
  onDeleteTransaction
}) => {
  const [entries, setEntries] = useState<EntryRow[]>([
    { localId: Math.random().toString(), productId: '', quantity: 1, notes: '' }
  ]);
  
  const getToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // State for History List - Default to Today
  const [dateRange, setDateRange] = useState({ start: getToday(), end: getToday() });
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const isInward = type === 'IN';

  const handleAddRow = () => {
    setEntries([...entries, { localId: Math.random().toString(), productId: '', quantity: 1, notes: '' }]);
  };

  const handleRemoveRow = (id: string) => {
    if (entries.length > 1) {
        setEntries(entries.filter(e => e.localId !== id));
    } else {
        // If removing the last one, just reset it
        setEntries([{ localId: Math.random().toString(), productId: '', quantity: 1, notes: '' }]);
    }
  };

  const handleRowChange = (id: string, field: keyof EntryRow, value: any) => {
    setEntries(entries.map(e => {
        if (e.localId === id) {
            return { ...e, [field]: value };
        }
        return e;
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate rows
    const validEntries = entries.filter(e => e.productId && e.quantity > 0);
    
    // Check stock limits for OUT
    if (!isInward) {
        const invalid = validEntries.some(e => {
            const prod = products.find(p => p.id === e.productId);
            return prod && e.quantity > prod.quantity;
        });
        if (invalid) {
            alert("Some items exceed current stock levels. Please check quantity.");
            return;
        }
    }

    if (validEntries.length > 0) {
        onSubmit(validEntries.map(({ productId, quantity, notes }) => ({ productId, quantity, notes })));
        // Reset form
        setEntries([{ localId: Math.random().toString(), productId: '', quantity: 1, notes: '' }]);
    }
  };

  // Helper to get product info for a row
  const getProduct = (id: string) => products.find(p => p.id === id);

  // Filter Transactions for "Recent History" view
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const typeMatch = t.type === type;
        
        let dateMatch = true;
        if (dateRange.start) {
          dateMatch = dateMatch && new Date(t.date) >= new Date(dateRange.start);
        }
        if (dateRange.end) {
          const endDate = new Date(dateRange.end);
          endDate.setHours(23, 59, 59, 999);
          dateMatch = dateMatch && new Date(t.date) <= endDate;
        }
        return typeMatch && dateMatch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, type, dateRange]);

  const handleUpdate = (updatedTx: Transaction) => {
    if (onUpdateTransaction) onUpdateTransaction(updatedTx);
  };

  return (
    <div className="w-full max-w-6xl flex flex-col gap-8">
        {/* Bulk Entry Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in">
            <div className={`p-6 border-b ${isInward ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800'}`}>
                <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isInward ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300' : 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-300'}`}>
                    {isInward ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                </div>
                <h2 className={`text-xl font-bold ${isInward ? 'text-emerald-800 dark:text-emerald-200' : 'text-orange-800 dark:text-orange-200'}`}>
                    {isInward ? 'Multiple Inward Stock Entry' : 'Multiple Outward Stock Entry'}
                </h2>
                </div>
                <p className={`mt-2 text-sm ${isInward ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>
                {isInward ? 'Record new items arriving into the warehouse.' : 'Record items leaving inventory for sales or usage.'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
                <div className="overflow-x-auto mb-6">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                <th className="py-2 px-3 w-[35%]">Product</th>
                                <th className="py-2 px-3 w-[15%] text-right">Stock</th>
                                <th className="py-2 px-3 w-[15%]">Quantity</th>
                                <th className="py-2 px-3 w-[30%]">Notes</th>
                                <th className="py-2 px-3 w-[5%]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {entries.map((entry, index) => {
                                const prod = getProduct(entry.productId);
                                const isOverStock = !isInward && prod && entry.quantity > prod.quantity;
                                return (
                                    <tr key={entry.localId} className="group hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                        <td className="p-3 align-top">
                                            <div className="flex flex-col gap-1">
                                                <select
                                                    value={entry.productId}
                                                    onChange={(e) => handleRowChange(entry.localId, 'productId', e.target.value)}
                                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-sm focus:ring-1 focus:ring-brand-500"
                                                    required
                                                >
                                                    <option value="">-- Select Product --</option>
                                                    {products.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                    ))}
                                                </select>
                                                {prod && (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <img src={prod.imageUrl} className="w-6 h-6 rounded object-cover" alt="" />
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">{prod.sku}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 text-right align-top">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {prod ? prod.quantity : '-'}
                                            </span>
                                        </td>
                                        <td className="p-3 align-top">
                                            <input
                                                type="number"
                                                min="1"
                                                value={entry.quantity}
                                                onChange={(e) => handleRowChange(entry.localId, 'quantity', parseInt(e.target.value) || 0)}
                                                className={`w-full p-2 border rounded text-sm focus:ring-1 focus:ring-brand-500 ${isOverStock ? 'border-red-300 bg-red-50 text-red-900' : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white'}`}
                                                required
                                            />
                                            {isOverStock && (
                                                <div className="text-[10px] text-red-600 flex items-center gap-1 mt-1">
                                                    <AlertCircle size={10} /> Exceeds Stock
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-3 align-top">
                                            <input
                                                type="text"
                                                placeholder={isInward ? "e.g., PO #12345" : "e.g., Order #9876"}
                                                value={entry.notes}
                                                onChange={(e) => handleRowChange(entry.localId, 'notes', e.target.value)}
                                                className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-sm focus:ring-1 focus:ring-brand-500"
                                            />
                                        </td>
                                        <td className="p-3 align-top text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveRow(entry.localId)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                title="Remove Row"
                                            >
                                                <X size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center border-t border-gray-100 dark:border-gray-700 pt-6">
                    <button
                        type="button"
                        onClick={handleAddRow}
                        className="px-4 py-2 border border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                        <Plus size={16} /> Add Another Line
                    </button>

                    <div className="flex gap-4 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 sm:flex-none px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-theme hover:bg-gray-50 dark:hover:bg-gray-700 font-medium flex items-center justify-center gap-2"
                        >
                            <X size={18} /> Cancel
                        </button>
                        <button
                            type="submit"
                            className={`flex-1 sm:flex-none px-6 py-2 text-white rounded-theme font-medium flex items-center justify-center gap-2 shadow-sm
                            ${isInward 
                                ? 'bg-emerald-600 hover:bg-emerald-700' 
                                : 'bg-orange-600 hover:bg-orange-700'} `}
                        >
                            <Check size={18} /> Submit {entries.length} Item{entries.length !== 1 ? 's' : ''}
                        </button>
                    </div>
                </div>
            </form>
        </div>
        
        {/* History List View */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">
                        {isInward ? 'Inward' : 'Outward'} Records
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {dateRange.start === getToday() && dateRange.end === getToday() ? "Showing today's activity" : "Showing history based on filters"}
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-1">
                    <Calendar size={16} className="text-gray-400 ml-2" />
                    <input 
                        type="date" 
                        className="text-xs border-none focus:ring-0 bg-transparent text-gray-700 dark:text-gray-200 p-1"
                        value={dateRange.start}
                        onChange={e => setDateRange({...dateRange, start: e.target.value})}
                    />
                    <span className="text-gray-400">-</span>
                    <input 
                        type="date" 
                        className="text-xs border-none focus:ring-0 bg-transparent text-gray-700 dark:text-gray-200 p-1"
                        value={dateRange.end}
                        onChange={e => setDateRange({...dateRange, end: e.target.value})}
                    />
                    <div className="flex items-center gap-1 border-l border-gray-200 dark:border-gray-600 pl-1 ml-1">
                        <button 
                            onClick={() => setDateRange({ start: getToday(), end: getToday() })}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-gray-500 dark:text-gray-400 transition-colors"
                            title="Reset to Today"
                        >
                            <RotateCcw size={14} />
                        </button>
                        <button 
                            onClick={() => setDateRange({ start: '', end: '' })}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-gray-500 dark:text-gray-400 transition-colors"
                            title="Show All Records"
                        >
                            <FilterX size={14} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 sticky top-0">
                        <tr>
                            <th className="px-6 py-3 font-semibold">Date</th>
                            <th className="px-6 py-3 font-semibold">Product</th>
                            <th className="px-6 py-3 font-semibold text-right">Quantity</th>
                            <th className="px-6 py-3 font-semibold">Reference</th>
                            <th className="px-6 py-3 font-semibold text-center w-24">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredTransactions.length > 0 ? (
                            filteredTransactions.map(tx => (
                                <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="px-6 py-3 whitespace-nowrap">
                                        <div className="text-gray-900 dark:text-gray-200">{new Date(tx.date).toLocaleDateString()}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                    </td>
                                    <td className="px-6 py-3 font-medium text-gray-800 dark:text-gray-200">
                                        {tx.productName}
                                    </td>
                                    <td className="px-6 py-3 text-right font-mono font-bold text-gray-900 dark:text-gray-100">
                                        {tx.quantity}
                                    </td>
                                    <td className="px-6 py-3 text-gray-500 dark:text-gray-400 italic">
                                        {tx.notes || '-'}
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex justify-center gap-2">
                                            <button 
                                                onClick={() => setEditingTransaction(tx)}
                                                className="p-1.5 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded transition-colors"
                                                title="Edit Record"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            {onDeleteTransaction && (
                                                <button 
                                                    onClick={() => onDeleteTransaction(tx.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                                    title="Delete Record"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-400 italic">
                                    {dateRange.start && dateRange.end 
                                      ? "No records found for this period." 
                                      : "No records available."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        <EditTransactionModal 
            isOpen={!!editingTransaction}
            transaction={editingTransaction}
            onClose={() => setEditingTransaction(null)}
            onSave={(updated) => { handleUpdate(updated); setEditingTransaction(null); }}
        />
    </div>
  );
};
