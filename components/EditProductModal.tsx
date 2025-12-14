
import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Product } from '../types';

interface EditProductModalProps {
  product?: Product;
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<Product>) => void;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({ product, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    sku: '',
    category: '',
    price: 0,
    minLevel: 0,
    imageUrl: 'https://picsum.photos/200/200',
    quantity: 0
  });

  useEffect(() => {
    if (product) {
      setFormData(product);
    } else {
      setFormData({
        name: '',
        sku: '',
        category: 'General',
        price: 0,
        minLevel: 5,
        imageUrl: `https://picsum.photos/200/200?random=${Date.now()}`,
        quantity: 0
      });
    }
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">{product ? 'Edit Product' : 'Add New Product'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-theme focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-theme focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-theme focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-theme focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min. Stock Level</label>
              <input
                type="number"
                min="0"
                required
                value={formData.minLevel}
                onChange={(e) => setFormData({...formData, minLevel: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-theme focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          </div>

           {!product && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Initial Quantity</label>
              <input
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-theme focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={formData.imageUrl}
                onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-theme focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
              />
              <img src={formData.imageUrl} alt="Preview" className="w-10 h-10 rounded object-cover border border-gray-200" />
            </div>
            <p className="text-xs text-gray-400 mt-1">Paste a URL or use the default placeholder.</p>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-theme font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-brand-600 hover:bg-brand-700 rounded-theme font-medium transition-colors flex items-center gap-2"
            >
              <Save size={18} /> Save Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
