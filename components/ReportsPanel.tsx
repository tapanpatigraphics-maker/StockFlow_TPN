
import React, { useState, useMemo } from 'react';
import { FileText, Download, Printer, Filter, Calendar, Search, ArrowDownLeft, ArrowUpRight, X, FileDown, Eye, Package, AlertTriangle, Check, Edit2, Trash2 } from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Transaction, Product } from '../types';
import { PrintPreviewModal } from './PrintPreviewModal';
import { EditTransactionModal } from './EditTransactionModal';

interface ReportsPanelProps {
  transactions: Transaction[];
  products: Product[];
  onUpdateTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
}

export const ReportsPanel: React.FC<ReportsPanelProps> = ({ transactions, products, onUpdateTransaction, onDeleteTransaction }) => {
  const [activeTab, setActiveTab] = useState<'MOVEMENTS' | 'STOCK'>('MOVEMENTS');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Movement Filters
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Stock Filters
  const [stockCategoryFilter, setStockCategoryFilter] = useState('All');

  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Filter Transactions (Movement Report)
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            t.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === 'ALL' || t.type === typeFilter;
      
      let matchesDate = true;
      if (dateRange.start) {
        matchesDate = matchesDate && new Date(t.date) >= new Date(dateRange.start);
      }
      if (dateRange.end) {
        // Set end date to end of day
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && new Date(t.date) <= endDate;
      }

      return matchesSearch && matchesType && matchesDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm, typeFilter, dateRange]);

  // Filter Products (Stock Report)
  const filteredStock = useMemo(() => {
    return products.filter(p => {
       const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             p.sku.toLowerCase().includes(searchTerm.toLowerCase());
       
       let matchesCategory = true;
       if (stockCategoryFilter === 'All') matchesCategory = true;
       else if (stockCategoryFilter === 'Low Stock') matchesCategory = p.quantity <= p.minLevel;
       else matchesCategory = p.category === stockCategoryFilter;

       return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, stockCategoryFilter]);

  const stockCategories = ['All', 'Low Stock', ...Array.from(new Set(products.map(p => p.category)))];

  // Helper to find product image
  const getProductImage = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? product.imageUrl : 'https://via.placeholder.com/40';
  };

  const getProductSku = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? product.sku : 'N/A';
  };

  const handleTransactionUpdate = (updatedTx: Transaction) => {
    if (onUpdateTransaction) {
      onUpdateTransaction(updatedTx);
    }
  };

  // --- Export Handlers for Movements ---
  const handleExportMovementsCSV = () => {
    const headers = ['Date,Time,Transaction ID,Product Name,SKU,Type,Quantity,Notes'];
    const rows = filteredTransactions.map(t => {
      const date = new Date(t.date).toLocaleDateString();
      const time = new Date(t.date).toLocaleTimeString();
      const sku = getProductSku(t.productId);
      const safeNotes = t.notes ? t.notes.replace(/,/g, ' ') : '';
      return `${date},${time},${t.id},"${t.productName}",${sku},${t.type},${t.quantity},"${safeNotes}"`;
    });
    downloadCSV(headers, rows, 'stock_movement_report');
  };

  const handleExportMovementsPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Stock Movement Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
    
    const tableColumn = ["Date", "Time", "Product", "SKU", "Type", "Qty", "Notes"];
    const tableRows = filteredTransactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      new Date(t.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      t.productName,
      getProductSku(t.productId),
      t.type === 'IN' ? 'Inward' : 'Outward',
      t.quantity,
      t.notes || '-'
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 8 },
    });
    doc.save(`stock_movement_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // --- Export Handlers for Stock ---
  const handleExportStockCSV = () => {
    const headers = ['ID,Name,SKU,Category,Price,Quantity,Min Level,Status,Total Value'];
    const rows = filteredStock.map(p => {
      const status = p.quantity <= p.minLevel ? 'Low Stock' : 'In Stock';
      const value = (p.price * p.quantity).toFixed(2);
      return `${p.id},"${p.name}",${p.sku},${p.category},${p.price},${p.quantity},${p.minLevel},${status},${value}`;
    });
    downloadCSV(headers, rows, 'current_stock_report');
  };

  const handleExportStockPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Current Stock Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
    
    const totalItems = filteredStock.reduce((acc, p) => acc + p.quantity, 0);
    const totalValue = filteredStock.reduce((acc, p) => acc + (p.price * p.quantity), 0);
    doc.text(`Total Items: ${totalItems} | Total Value: ${totalValue.toLocaleString()}`, 14, 27);

    const tableColumn = ["Name", "SKU", "Category", "Price", "Qty", "Min", "Status", "Value"];
    const tableRows = filteredStock.map(p => [
      p.name,
      p.sku,
      p.category,
      p.price.toFixed(2),
      p.quantity,
      p.minLevel,
      p.quantity <= p.minLevel ? 'Low Stock' : 'OK',
      (p.price * p.quantity).toFixed(2)
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 8 },
    });
    doc.save(`current_stock_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const downloadCSV = (headers: string[], rows: string[], filename: string) => {
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\n" + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('ALL');
    setDateRange({ start: '', end: '' });
    setStockCategoryFilter('All');
  };

  if (isPrintPreviewOpen) {
    return (
      <PrintPreviewModal
        isOpen={true}
        onClose={() => setIsPrintPreviewOpen(false)}
        reportType={activeTab}
        transactions={filteredTransactions}
        stockData={filteredStock}
        products={products}
        dateRange={dateRange}
        typeFilter={typeFilter}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <FileText className="text-brand-600 dark:text-brand-400" /> Reports Center
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Generate insights, track movements, and audit inventory levels.
          </p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={activeTab === 'MOVEMENTS' ? handleExportMovementsCSV : handleExportStockCSV}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-theme font-medium transition-colors text-sm"
          >
            <Download size={16} /> Excel
          </button>
          <button 
            onClick={activeTab === 'MOVEMENTS' ? handleExportMovementsPDF : handleExportStockPDF}
            className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-theme font-medium transition-colors text-sm"
          >
            <FileDown size={16} /> PDF
          </button>
          <button 
            onClick={() => setIsPrintPreviewOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white rounded-theme font-medium transition-colors text-sm"
          >
            <Eye size={16} /> Print Preview
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('MOVEMENTS')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'MOVEMENTS' ? 'border-brand-600 text-brand-600 dark:text-brand-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
        >
          <ArrowUpRight size={16} /> Stock Movements
        </button>
        <button
          onClick={() => setActiveTab('STOCK')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'STOCK' ? 'border-brand-600 text-brand-600 dark:text-brand-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
        >
          <Package size={16} /> Current Stock
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Search - Common */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Product, SKU or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-theme text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {activeTab === 'MOVEMENTS' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Transaction Type</label>
                <div className="flex rounded-theme bg-gray-100 dark:bg-gray-700 p-1">
                  <button 
                    onClick={() => setTypeFilter('ALL')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded transition-all ${typeFilter === 'ALL' ? 'bg-white dark:bg-gray-600 shadow-sm text-brand-700 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => setTypeFilter('IN')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded transition-all ${typeFilter === 'IN' ? 'bg-white dark:bg-gray-600 shadow-sm text-emerald-700 dark:text-emerald-300' : 'text-gray-500 dark:text-gray-400'}`}
                  >
                    Inward
                  </button>
                  <button 
                    onClick={() => setTypeFilter('OUT')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded transition-all ${typeFilter === 'OUT' ? 'bg-white dark:bg-gray-600 shadow-sm text-orange-700 dark:text-orange-300' : 'text-gray-500 dark:text-gray-400'}`}
                  >
                    Outward
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date Range</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-theme text-xs"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-theme text-xs"
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'STOCK' && (
            <div className="space-y-1">
               <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</label>
               <select
                  value={stockCategoryFilter}
                  onChange={(e) => setStockCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-theme text-sm focus:ring-2 focus:ring-brand-500"
               >
                 {stockCategories.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
            </div>
          )}

          <button 
            onClick={clearFilters}
            className="py-2 px-4 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-theme border border-gray-200 dark:border-gray-600 transition-colors flex items-center justify-center gap-2"
          >
            <X size={16} /> Clear Filters
          </button>
        </div>
      </div>

      {/* Report Tables */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'MOVEMENTS' ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">Date & Time</th>
                  <th className="px-6 py-4 font-semibold">Product</th>
                  <th className="px-6 py-4 font-semibold">SKU</th>
                  <th className="px-6 py-4 font-semibold text-center">Type</th>
                  <th className="px-6 py-4 font-semibold text-right">Quantity</th>
                  <th className="px-6 py-4 font-semibold">Reference / Notes</th>
                  <th className="px-6 py-4 font-semibold text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-gray-900 dark:text-gray-200 font-medium">{new Date(tx.date).toLocaleDateString()}</div>
                        <div className="text-gray-500 dark:text-gray-400 text-xs">{new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={getProductImage(tx.productId)} 
                            alt="" 
                            className="w-10 h-10 rounded object-cover border border-gray-200 dark:border-gray-600 bg-white" 
                          />
                          <span className="font-medium text-gray-800 dark:text-gray-200">{tx.productName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-600 dark:text-gray-400">
                        {getProductSku(tx.productId)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                          tx.type === 'IN' 
                            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800' 
                            : 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-100 dark:border-orange-800'
                        }`}>
                          {tx.type === 'IN' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                          {tx.type === 'IN' ? 'Inward' : 'Outward'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-gray-100">
                        {tx.type === 'IN' ? '+' : '-'}{tx.quantity}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm max-w-xs truncate" title={tx.notes}>
                        {tx.notes || '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                            {onUpdateTransaction && (
                                <button 
                                    onClick={() => setEditingTransaction(tx)}
                                    className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded transition-colors"
                                    title="Edit Record"
                                >
                                    <Edit2 size={16} />
                                </button>
                            )}
                            {onDeleteTransaction && (
                                <button 
                                    onClick={() => onDeleteTransaction(tx.id)}
                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
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
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <Filter size={32} className="text-gray-300 dark:text-gray-600" />
                        <p>No transactions found matching your filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-sm">
               <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">
                 <tr>
                   <th className="px-6 py-4 font-semibold">Product Name</th>
                   <th className="px-6 py-4 font-semibold">SKU</th>
                   <th className="px-6 py-4 font-semibold">Category</th>
                   <th className="px-6 py-4 font-semibold text-right">Price</th>
                   <th className="px-6 py-4 font-semibold text-right">Current Stock</th>
                   <th className="px-6 py-4 font-semibold text-center">Status</th>
                   <th className="px-6 py-4 font-semibold text-right">Total Value</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                 {filteredStock.length > 0 ? (
                    filteredStock.map(product => (
                      <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                              <img src={product.imageUrl} alt="" className="w-10 h-10 rounded object-cover border border-gray-200 dark:border-gray-600" />
                              <div className="font-medium text-gray-800 dark:text-gray-200">{product.name}</div>
                           </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-600 dark:text-gray-400">{product.sku}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{product.category}</td>
                        <td className="px-6 py-4 text-right">₹{product.price.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right font-bold text-gray-800 dark:text-gray-100">{product.quantity}</td>
                        <td className="px-6 py-4 text-center">
                           {product.quantity <= product.minLevel ? (
                             <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                               <AlertTriangle size={12} /> Low Stock
                             </span>
                           ) : (
                             <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                               <Check size={12} /> In Stock
                             </span>
                           )}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-gray-100">
                           ₹{(product.price * product.quantity).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                      </tr>
                    ))
                 ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col items-center gap-2">
                          <Filter size={32} className="text-gray-300 dark:text-gray-600" />
                          <p>No products found matching your filters.</p>
                        </div>
                      </td>
                    </tr>
                 )}
               </tbody>
               <tfoot className="bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700">
                  <tr>
                    <td colSpan={4} className="px-6 py-3 text-right font-bold text-gray-600 dark:text-gray-300">Totals:</td>
                    <td className="px-6 py-3 text-right font-bold text-gray-800 dark:text-gray-100">{filteredStock.reduce((acc, p) => acc + p.quantity, 0)}</td>
                    <td></td>
                    <td className="px-6 py-3 text-right font-bold text-gray-800 dark:text-gray-100">
                      ₹{filteredStock.reduce((acc, p) => acc + (p.price * p.quantity), 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </td>
                  </tr>
               </tfoot>
            </table>
          )}
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/30 p-4 border-t border-gray-100 dark:border-gray-700 text-right">
           <span className="text-sm text-gray-500 dark:text-gray-400">
             Showing {activeTab === 'MOVEMENTS' ? filteredTransactions.length : filteredStock.length} records
           </span>
        </div>
      </div>

      <EditTransactionModal 
        isOpen={!!editingTransaction}
        transaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSave={handleTransactionUpdate}
      />
    </div>
  );
};
