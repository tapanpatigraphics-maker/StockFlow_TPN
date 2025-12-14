
import React, { useState, useRef, useEffect } from 'react';
import { X, Printer, Settings, Image as ImageIcon, FileText, Check, ChevronDown } from 'lucide-react';
import { Transaction, Product } from '../types';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType?: 'MOVEMENTS' | 'STOCK';
  transactions: Transaction[];
  products: Product[]; // Used as lookup for movements, or data source for stock
  stockData?: Product[]; // Explicit data source for stock report (pre-filtered)
  dateRange: { start: string; end: string };
  typeFilter: string;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({ 
  isOpen, 
  onClose, 
  reportType = 'MOVEMENTS',
  transactions, 
  products,
  stockData,
  dateRange,
  typeFilter
}) => {
  const [settings, setSettings] = useState({
    printerName: 'System Default Printer',
    paperSize: 'A4',
    orientation: 'portrait',
    showImages: true,
    showNotes: true,
    compactMode: false,
    fontSize: 'normal'
  });

  const previewRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // For movement report
  const getProductImage = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? product.imageUrl : '';
  };

  const getProductSku = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? product.sku : 'N/A';
  };
  
  // Data to render
  const dataToRender = reportType === 'STOCK' ? (stockData || products) : transactions;

  const handlePrint = () => {
    const content = previewRef.current?.innerHTML;
    if (!content) return;

    // Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${reportType === 'STOCK' ? 'Inventory Report' : 'Stock Movement Report'} - ${new Date().toLocaleDateString()}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <script>
               tailwind.config = {
                theme: {
                  extend: {
                    colors: {
                      brand: { 50: '#eff6ff', 600: '#2563eb' }
                    }
                  }
                }
              }
            </script>
            <style>
              @page {
                size: ${settings.paperSize} ${settings.orientation};
                margin: 20mm;
              }
              body {
                font-family: 'Inter', sans-serif;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-break {
                page-break-inside: avoid;
              }
            </style>
          </head>
          <body class="bg-white">
            ${content}
          </body>
        </html>
      `);
      doc.close();

      // Wait for resources (like Tailwind CDN and images) to load
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        // Cleanup after print dialog closes (approximate)
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    }
  };

  return (
    // Replaced fixed positioning with normal flex layout to fit inside ReportsPanel content area.
    // h-[calc(100vh-7.5rem)] accounts for approx header height + padding to keep it flush within viewport.
    <div className="w-full h-[calc(100vh-7.5rem)] flex flex-col md:flex-row bg-gray-100 dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in">
        
        {/* Sidebar: Settings */}
        <div className="w-full md:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col z-10 shrink-0">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Settings size={18} /> Print Settings
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors cursor-pointer" title="Back to reports">
                <X size={20} className="text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            
            {/* Printer Attachment */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Printer Attachment</label>
              <div className="relative">
                <Printer className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <select 
                  value={settings.printerName}
                  onChange={(e) => setSettings({...settings, printerName: e.target.value})}
                  className="w-full pl-9 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm appearance-none bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-500"
                >
                  <option>System Default Printer</option>
                  <option>Save as PDF</option>
                  <option>Network Printer (HP-LaserJet)</option>
                  <option>Office Printer (Canon-MF)</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              </div>
              <p className="text-[10px] text-gray-400">Select target output device.</p>
            </div>

            {/* Layout Settings */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Layout & Paper</label>
              
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setSettings({...settings, orientation: 'portrait'})}
                  className={`px-3 py-2 text-sm border rounded-lg flex items-center justify-center gap-2 transition-all ${settings.orientation === 'portrait' ? 'bg-brand-50 border-brand-500 text-brand-700 font-medium' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                >
                  <div className="w-3 h-4 border border-current rounded-[1px]"></div> Portrait
                </button>
                <button 
                  onClick={() => setSettings({...settings, orientation: 'landscape'})}
                  className={`px-3 py-2 text-sm border rounded-lg flex items-center justify-center gap-2 transition-all ${settings.orientation === 'landscape' ? 'bg-brand-50 border-brand-500 text-brand-700 font-medium' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                >
                   <div className="w-4 h-3 border border-current rounded-[1px]"></div> Landscape
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                 <button 
                  onClick={() => setSettings({...settings, paperSize: 'A4'})}
                  className={`px-3 py-2 text-sm border rounded-lg transition-all ${settings.paperSize === 'A4' ? 'bg-brand-50 border-brand-500 text-brand-700 font-medium' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                >
                  A4
                </button>
                <button 
                  onClick={() => setSettings({...settings, paperSize: 'Letter'})}
                  className={`px-3 py-2 text-sm border rounded-lg transition-all ${settings.paperSize === 'Letter' ? 'bg-brand-50 border-brand-500 text-brand-700 font-medium' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                >
                  Letter
                </button>
              </div>
            </div>

            {/* Content Settings */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Content Options</label>
              
              <label className="flex items-center gap-3 p-2 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${settings.showImages ? 'bg-brand-600 border-brand-600 text-white' : 'border-gray-300 bg-white'}`}>
                   {settings.showImages && <Check size={12} />}
                </div>
                <input type="checkbox" className="hidden" checked={settings.showImages} onChange={() => setSettings(s => ({...s, showImages: !s.showImages}))} />
                <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"><ImageIcon size={14} /> Product Images</span>
              </label>

              {reportType === 'MOVEMENTS' && (
                <label className="flex items-center gap-3 p-2 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${settings.showNotes ? 'bg-brand-600 border-brand-600 text-white' : 'border-gray-300 bg-white'}`}>
                    {settings.showNotes && <Check size={12} />}
                  </div>
                  <input type="checkbox" className="hidden" checked={settings.showNotes} onChange={() => setSettings(s => ({...s, showNotes: !s.showNotes}))} />
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"><FileText size={14} /> Notes / Reference</span>
                </label>
              )}

              <label className="flex items-center gap-3 p-2 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${settings.compactMode ? 'bg-brand-600 border-brand-600 text-white' : 'border-gray-300 bg-white'}`}>
                   {settings.compactMode && <Check size={12} />}
                </div>
                <input type="checkbox" className="hidden" checked={settings.compactMode} onChange={() => setSettings(s => ({...s, compactMode: !s.compactMode}))} />
                <span className="text-sm text-gray-700 dark:text-gray-300">Compact Rows</span>
              </label>
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex gap-3">
             <button 
              onClick={onClose}
              className="flex-1 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-bold hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
            <button 
              onClick={handlePrint}
              className="flex-[2] py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold shadow-lg shadow-brand-200 dark:shadow-none transition-all flex items-center justify-center gap-2"
            >
              <Printer size={20} /> Print
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 bg-gray-200 dark:bg-gray-950/50 overflow-auto p-8 flex justify-center items-start">
           <div 
             ref={previewRef}
             className={`bg-white shadow-xl transition-all duration-300 origin-top ${settings.orientation === 'landscape' ? 'w-[297mm]' : 'w-[210mm]'} min-h-[297mm] p-[20mm] text-gray-900`}
             style={{
               transform: 'scale(var(--preview-scale, 0.8))' // Dynamic scale can be added later
             }}
           >
              {/* Report Header */}
              <div className="border-b-2 border-brand-600 pb-4 mb-6 flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">
                    {reportType === 'STOCK' ? 'Inventory Status Report' : 'Stock Movement Report'}
                  </h1>
                  <p className="text-sm text-gray-500">Generated on {new Date().toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">StockFlow Inventory System</div>
                  <div className="text-xs text-gray-500">
                     {reportType === 'MOVEMENTS' && (
                        <>
                            {typeFilter === 'ALL' ? 'All Movements' : typeFilter === 'IN' ? 'Inward Only' : 'Outward Only'} 
                            {dateRange.start ? ` • ${new Date(dateRange.start).toLocaleDateString()} - ${dateRange.end ? new Date(dateRange.end).toLocaleDateString() : 'Now'}` : ''}
                        </>
                     )}
                     {reportType === 'STOCK' && 'Current Stock Levels'}
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    {reportType === 'MOVEMENTS' ? (
                        <>
                            <th className="py-2 px-2 font-bold text-gray-700">Date</th>
                            {settings.showImages && <th className="py-2 px-2 font-bold text-gray-700 w-16">Image</th>}
                            <th className="py-2 px-2 font-bold text-gray-700">Product</th>
                            <th className="py-2 px-2 font-bold text-gray-700 text-center">Type</th>
                            <th className="py-2 px-2 font-bold text-gray-700 text-right">Qty</th>
                            {settings.showNotes && <th className="py-2 px-2 font-bold text-gray-700 w-1/4">Notes</th>}
                        </>
                    ) : (
                        <>
                            {settings.showImages && <th className="py-2 px-2 font-bold text-gray-700 w-16">Image</th>}
                            <th className="py-2 px-2 font-bold text-gray-700">Product Name</th>
                            <th className="py-2 px-2 font-bold text-gray-700">SKU</th>
                            <th className="py-2 px-2 font-bold text-gray-700">Category</th>
                            <th className="py-2 px-2 font-bold text-gray-700 text-right">Price</th>
                            <th className="py-2 px-2 font-bold text-gray-700 text-right">Stock</th>
                            <th className="py-2 px-2 font-bold text-gray-700 text-right">Value</th>
                        </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reportType === 'MOVEMENTS' ? (
                      // Movements Rows
                      (dataToRender as Transaction[]).map((t) => (
                        <tr key={t.id} className={`${settings.compactMode ? 'text-xs' : 'text-sm'} no-break`}>
                        <td className={`px-2 ${settings.compactMode ? 'py-1' : 'py-3'}`}>
                            <div className="font-medium">{new Date(t.date).toLocaleDateString()}</div>
                            <div className="text-gray-400 text-[10px]">{new Date(t.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </td>
                        
                        {settings.showImages && (
                            <td className={`px-2 ${settings.compactMode ? 'py-1' : 'py-3'}`}>
                            <img 
                                src={getProductImage(t.productId)} 
                                className={`${settings.compactMode ? 'w-6 h-6' : 'w-10 h-10'} rounded object-cover border border-gray-200`} 
                                alt="" 
                            />
                            </td>
                        )}
                        
                        <td className={`px-2 ${settings.compactMode ? 'py-1' : 'py-3'}`}>
                            <div className="font-semibold text-gray-900">{t.productName}</div>
                            <div className="text-gray-500 text-xs font-mono">{getProductSku(t.productId)}</div>
                        </td>
                        
                        <td className={`px-2 ${settings.compactMode ? 'py-1' : 'py-3'} text-center`}>
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${t.type === 'IN' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                            {t.type === 'IN' ? 'Inward' : 'Outward'}
                            </span>
                        </td>
                        
                        <td className={`px-2 ${settings.compactMode ? 'py-1' : 'py-3'} text-right font-mono font-bold`}>
                            {t.quantity}
                        </td>

                        {settings.showNotes && (
                            <td className={`px-2 ${settings.compactMode ? 'py-1' : 'py-3'} text-gray-500 italic`}>
                            {t.notes || '-'}
                            </td>
                        )}
                        </tr>
                    ))
                  ) : (
                      // Stock Rows
                      (dataToRender as Product[]).map((p) => (
                          <tr key={p.id} className={`${settings.compactMode ? 'text-xs' : 'text-sm'} no-break`}>
                            {settings.showImages && (
                                <td className={`px-2 ${settings.compactMode ? 'py-1' : 'py-3'}`}>
                                <img 
                                    src={p.imageUrl} 
                                    className={`${settings.compactMode ? 'w-6 h-6' : 'w-10 h-10'} rounded object-cover border border-gray-200`} 
                                    alt="" 
                                />
                                </td>
                            )}
                            <td className={`px-2 ${settings.compactMode ? 'py-1' : 'py-3'} font-medium`}>
                                {p.name}
                            </td>
                            <td className={`px-2 ${settings.compactMode ? 'py-1' : 'py-3'} font-mono text-gray-500`}>
                                {p.sku}
                            </td>
                            <td className={`px-2 ${settings.compactMode ? 'py-1' : 'py-3'} text-gray-600`}>
                                {p.category}
                            </td>
                            <td className={`px-2 ${settings.compactMode ? 'py-1' : 'py-3'} text-right`}>
                                {p.price.toFixed(2)}
                            </td>
                            <td className={`px-2 ${settings.compactMode ? 'py-1' : 'py-3'} text-right font-bold`}>
                                {p.quantity} {p.quantity <= p.minLevel && <span className="text-red-500">*</span>}
                            </td>
                            <td className={`px-2 ${settings.compactMode ? 'py-1' : 'py-3'} text-right`}>
                                {(p.price * p.quantity).toFixed(2)}
                            </td>
                          </tr>
                      ))
                  )}
                </tbody>
                {reportType === 'STOCK' && (
                     <tfoot className="border-t-2 border-gray-300">
                        <tr>
                            <td colSpan={settings.showImages ? 5 : 4} className="py-2 px-2 text-right font-bold">Totals:</td>
                            <td className="py-2 px-2 text-right font-bold">{(dataToRender as Product[]).reduce((acc, p) => acc + p.quantity, 0)}</td>
                            <td className="py-2 px-2 text-right font-bold">{(dataToRender as Product[]).reduce((acc, p) => acc + (p.price * p.quantity), 0).toFixed(2)}</td>
                        </tr>
                     </tfoot>
                )}
              </table>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
                End of Report • Total Records: {dataToRender.length}
              </div>
           </div>
        </div>
    </div>
  );
};
