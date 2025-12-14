import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Product } from '../types';

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onSave: (updates: Partial<Product>) => void;
}

export const BulkEditModal: React.FC<BulkEditModalProps> = ({ isOpen, onClose, selectedCount, onSave }) => {
  const [updates, setUpdates] = useState<Partial<Product>>({});
  const [fieldsToUpdate, setFieldsToUpdate] = useState<{
    category: boolean;
    price: boolean;
    minLevel: boolean;
  }>({
    category: false,
    price: false,
    minLevel: false,
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalUpdates: Partial<Product> = {};
    if (fieldsToUpdate.category) finalUpdates.category = updates.category;
    if (fieldsToUpdate.price) finalUpdates.price = updates.price;
    if (fieldsToUpdate.minLevel) finalUpdates.minLevel = updates.minLevel;
    
    onSave(finalUpdates);
    
    // Reset state after save handled by parent closing, but safe to reset here too
    setUpdates({});
    setFieldsToUpdate({ category: false, price: false, minLevel: false });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Bulk Edit Products</h3>
            <p className="text-xs text-gray-500">Editing {selectedCount} items</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <p>Select the fields you want to update. Only enabled fields will be applied to the {selectedCount} selected products.</p>
            </div>

          {/* Category */}
          <div className="flex items-start gap-3">
            <input 
              type="checkbox" 
              id="check_category"
              checked={fieldsToUpdate.category} 
              onChange={(e) => setFieldsToUpdate(prev => ({ ...prev, category: e.target.checked }))}
              className="mt-3 w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
            />
            <div className="flex-1">
                <label htmlFor="check_category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                    type="text"
                    disabled={!fieldsToUpdate.category}
                    value={updates.category || ''}
                    onChange={(e) => setUpdates(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                    placeholder="New Category Name"
                />
            </div>
          </div>

          {/* Price */}
          <div className="flex items-start gap-3">
            <input 
              type="checkbox" 
              id="check_price"
              checked={fieldsToUpdate.price} 
              onChange={(e) => setFieldsToUpdate(prev => ({ ...prev, price: e.target.checked }))}
              className="mt-3 w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
            />
            <div className="flex-1">
                <label htmlFor="check_price" className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={!fieldsToUpdate.price}
                    value={updates.price !== undefined ? updates.price : ''}
                    onChange={(e) => setUpdates(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                    placeholder="0.00"
                />
            </div>
          </div>

          {/* Min Level */}
          <div className="flex items-start gap-3">
            <input 
              type="checkbox" 
              id="check_minLevel"
              checked={fieldsToUpdate.minLevel} 
              onChange={(e) => setFieldsToUpdate(prev => ({ ...prev, minLevel: e.target.checked }))}
              className="mt-3 w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
            />
            <div className="flex-1">
                <label htmlFor="check_minLevel" className="block text-sm font-medium text-gray-700 mb-1">Min Stock Level</label>
                <input
                    type="number"
                    min="0"
                    disabled={!fieldsToUpdate.minLevel}
                    value={updates.minLevel !== undefined ? updates.minLevel : ''}
                    onChange={(e) => setUpdates(prev => ({ ...prev, minLevel: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                    placeholder="0"
                />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!Object.values(fieldsToUpdate).some(Boolean)}
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} /> Apply Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};