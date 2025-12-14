
import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Transaction } from '../types';

interface EditTransactionModalProps {
  transaction?: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({ transaction, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<Transaction | null>(null);

  useEffect(() => {
    if (transaction) {
      setFormData({ ...transaction });
    }
  }, [transaction, isOpen]);

  if (!isOpen || !formData) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
        onSave(formData);
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">Edit Transaction Record</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex gap-2">
            <AlertCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
                Updating the quantity here will automatically adjust the current stock level of the product to maintain consistency.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
            <input
              type="text"
              disabled
              value={formData.productName}
              className="w-full px-3 py-2 border border-gray-200 rounded-theme bg-gray-50 text-gray-500 text-sm"
            />
          </div>

           <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
             <div className="flex gap-2">
                <span className={`px-3 py-1 rounded text-xs font-bold ${formData.type === 'IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'}`}>
                    {formData.type === 'IN' ? 'Inward (Stock Received)' : 'Outward (Stock Dispatched)'}
                </span>
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              min="1"
              required
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
              className="w-full px-3 py-2 border border-gray-300 rounded-theme focus:ring-2 focus:ring-brand-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
             <input
              type="datetime-local"
              required
              // formatting date for input datetime-local requires YYYY-MM-DDThh:mm
              value={new Date(formData.date).toISOString().slice(0, 16)}
              onChange={(e) => setFormData({...formData, date: new Date(e.target.value).toISOString()})}
              className="w-full px-3 py-2 border border-gray-300 rounded-theme focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Reference</label>
            <textarea
              rows={3}
              value={formData.notes || ''}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-theme focus:ring-2 focus:ring-brand-500 text-sm"
              placeholder="Reason for update..."
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-theme font-medium transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-brand-600 hover:bg-brand-700 rounded-theme font-medium transition-colors flex items-center gap-2 text-sm"
            >
              <Save size={16} /> Update Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
