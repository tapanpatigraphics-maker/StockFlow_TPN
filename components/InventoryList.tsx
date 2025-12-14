
import React, { useState, useMemo } from 'react';
import { Edit2, Trash2, Search, Filter, Plus, ArrowUpDown, ArrowUp, ArrowDown, History, X, ArrowDownLeft, ArrowUpRight, CheckSquare, Square, Layers, Lock } from 'lucide-react';
import { Product, Transaction, User } from '../types';
import { BulkEditModal } from './BulkEditModal';

interface InventoryListProps {
  products: Product[];
  transactions: Transaction[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
  onBulkUpdate: (ids: string[], updates: Partial<Product>) => void;
  currentUser: User;
}

type SortKey = 'name' | 'sku' | 'price' | 'quantity';

export const InventoryList: React.FC<InventoryListProps> = ({ 
  products, 
  transactions, 
  onEdit, 
  onDelete, 
  onAddNew, 
  onBulkUpdate,
  currentUser 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);

  const categories = ['All', 'Low Stock', ...Array.from(new Set(products.map(p => p.category)))];

  // Authorization Checks (Granular)
  const canAdd = currentUser.permissions.addProduct;
  const canEdit = currentUser.permissions.editProduct;
  const canDelete = currentUser.permissions.deleteProduct;

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesCategory = true;
    if (categoryFilter === 'All') {
      matchesCategory = true;
    } else if (categoryFilter === 'Low Stock') {
      matchesCategory = p.quantity <= p.minLevel;
    } else {
      matchesCategory = p.category === categoryFilter;
    }

    return matchesSearch && matchesCategory;
  });

  const sortedProducts = useMemo(() => {
    let sortableItems = [...filteredProducts];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredProducts, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortConfig?.key !== column) return <ArrowUpDown size={14} className="text-gray-400 opacity-50" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={14} className="text-brand-600" />
      : <ArrowDown size={14} className="text-brand-600" />;
  };

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(filteredProducts.map(p => p.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkSave = (updates: Partial<Product>) => {
    onBulkUpdate(Array.from(selectedIds), updates);
    setSelectedIds(new Set()); // Clear selection
    setIsBulkEditOpen(false);
  };

  const productTransactions = historyProduct 
    ? transactions.filter(t => t.productId === historyProduct.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const isAllSelected = filteredProducts.length > 0 && selectedIds.size === filteredProducts.length;

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full animate-fade-in relative">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
            {selectedIds.size > 0 && canEdit ? (
                <div className="flex items-center justify-between w-full bg-brand-50 -m-2 p-4 rounded-lg border border-brand-100 animate-fade-in">
                    <div className="flex items-center gap-3">
                        <span className="bg-brand-600 text-white text-xs font-bold px-2 py-1 rounded-full">{selectedIds.size}</span>
                        <span className="text-sm font-medium text-brand-900">items selected</span>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setIsBulkEditOpen(true)}
                            className="flex items-center gap-2 bg-white text-brand-700 border border-brand-200 px-3 py-1.5 rounded-lg hover:bg-brand-50 transition-colors text-sm font-medium"
                        >
                            <Layers size={16} /> Bulk Edit
                        </button>
                        <button 
                            onClick={() => setSelectedIds(new Set())}
                            className="text-gray-500 hover:text-gray-700 px-3 py-1.5 text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <>
                <h2 className="text-xl font-bold text-gray-800">Inventory Records</h2>
                
                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                    <div className="relative flex-grow sm:flex-grow-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-theme text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    </div>
                    
                    <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="pl-10 pr-8 py-2 border border-gray-300 rounded-theme text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 appearance-none bg-white cursor-pointer"
                    >
                        {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    </div>

                    {canAdd && (
                      <button 
                      onClick={onAddNew}
                      className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-theme hover:bg-brand-700 transition-colors text-sm font-medium"
                      >
                      <Plus size={18} /> Add Product
                      </button>
                    )}
                </div>
                </>
            )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-100 text-gray-700 font-semibold uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-3 w-10">
                   {canEdit && (
                    <div className="flex items-center">
                        <input 
                            type="checkbox" 
                            checked={isAllSelected}
                            onChange={handleSelectAll}
                            className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500 cursor-pointer"
                        />
                    </div>
                   )}
                </th>
                <th 
                  className="px-6 py-3 cursor-pointer hover:bg-gray-200 transition-colors group select-none"
                  onClick={() => requestSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Product <SortIcon column="name" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 cursor-pointer hover:bg-gray-200 transition-colors group select-none"
                  onClick={() => requestSort('sku')}
                >
                  <div className="flex items-center gap-1">
                    SKU <SortIcon column="sku" />
                  </div>
                </th>
                <th className="px-6 py-3">Category</th>
                <th 
                  className="px-6 py-3 text-right cursor-pointer hover:bg-gray-200 transition-colors group select-none"
                  onClick={() => requestSort('price')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Price <SortIcon column="price" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-center cursor-pointer hover:bg-gray-200 transition-colors group select-none"
                  onClick={() => requestSort('quantity')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Stock <SortIcon column="quantity" />
                  </div>
                </th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedProducts.length > 0 ? (
                sortedProducts.map(product => (
                  <tr key={product.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.has(product.id) ? 'bg-brand-50/50' : ''}`}>
                    <td className="px-6 py-4">
                        {canEdit && (
                          <input 
                              type="checkbox" 
                              checked={selectedIds.has(product.id)}
                              onChange={() => handleSelectOne(product.id)}
                              className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500 cursor-pointer"
                          />
                        )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img 
                            src={product.imageUrl} 
                            alt={product.name} 
                            className="w-16 h-16 rounded-lg object-cover border border-gray-200 shadow-sm"
                          />
                        </div>
                        <span className="font-medium text-gray-900 text-base">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{product.sku}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">₹{product.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        product.quantity <= product.minLevel ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {product.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => setHistoryProduct(product)}
                          className="p-1.5 hover:bg-purple-100 text-purple-600 rounded transition-colors"
                          title="View History"
                        >
                          <History size={16} />
                        </button>
                        
                        {canEdit && (
                          <button 
                            onClick={() => onEdit(product)}
                            className="p-1.5 hover:bg-brand-100 text-brand-600 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        
                        {canDelete ? (
                          <button 
                            onClick={() => onDelete(product.id)}
                            className="p-1.5 hover:bg-red-100 text-red-600 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : !canEdit && (
                           <span className="p-1.5 text-gray-300 cursor-not-allowed" title="Read Only">
                             <Lock size={16} />
                           </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <BulkEditModal 
        isOpen={isBulkEditOpen}
        onClose={() => setIsBulkEditOpen(false)}
        selectedCount={selectedIds.size}
        onSave={handleBulkSave}
      />

      {/* History Modal */}
      {historyProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-theme">
                  <History size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Transaction History</h3>
                  <p className="text-sm text-gray-500">{historyProduct.name}</p>
                </div>
              </div>
              <button onClick={() => setHistoryProduct(null)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="overflow-auto flex-1">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 sticky top-0 shadow-sm">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Date & Time</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Type</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Quantity</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productTransactions.length > 0 ? (
                    productTransactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3 whitespace-nowrap">
                          {new Date(tx.date).toLocaleDateString()} <span className="text-gray-400 text-xs ml-1">{new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </td>
                        <td className="px-6 py-3">
                           <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                             tx.type === 'IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
                           }`}>
                             {tx.type === 'IN' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                             {tx.type === 'IN' ? 'Inward' : 'Outward'}
                           </span>
                        </td>
                        <td className="px-6 py-3 text-right font-mono font-medium">
                          {tx.type === 'IN' ? '+' : '-'}{tx.quantity}
                        </td>
                        <td className="px-6 py-3 text-gray-500 italic truncate max-w-xs">
                          {tx.notes || '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-400 italic">
                        No transactions found for this product.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 text-right">
              <button 
                onClick={() => setHistoryProduct(null)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-theme text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
