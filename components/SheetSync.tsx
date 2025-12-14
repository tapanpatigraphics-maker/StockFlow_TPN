
import React, { useState } from 'react';
import { FileSpreadsheet, Download, Upload, Copy, Check } from 'lucide-react';
import { Product } from '../types';

interface SheetSyncProps {
  products: Product[];
  onImport: (csvData: string) => void;
}

export const SheetSync: React.FC<SheetSyncProps> = ({ products, onImport }) => {
  const [csvInput, setCsvInput] = useState('');
  const [copied, setCopied] = useState(false);

  // Convert current products to CSV
  const generateCSV = () => {
    const headers = ['ID,Name,SKU,Category,Quantity,MinLevel,Price,ImageUrl,LastUpdated'];
    const rows = products.map(p => 
      `${p.id},"${p.name}",${p.sku},${p.category},${p.quantity},${p.minLevel},${p.price},${p.imageUrl},${p.lastUpdated}`
    );
    return headers.concat(rows).join('\n');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateCSV());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = () => {
    if (confirm("This will overwrite your current inventory. Are you sure?")) {
      onImport(csvInput);
      setCsvInput('');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in max-w-4xl mx-auto mt-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-green-100 text-green-700 rounded-lg">
          <FileSpreadsheet size={28} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Google Sheet / CSV Sync</h2>
          <p className="text-gray-500 text-sm">Sync your inventory with external spreadsheet tools.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Export Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <Download size={18} /> Export Current Stock
          </h3>
          <p className="text-sm text-gray-600">
            Copy this data and paste it directly into your Google Sheet to update your master records.
          </p>
          <div className="relative">
            <textarea
              readOnly
              value={generateCSV()}
              className="w-full h-48 p-3 text-xs font-mono border border-gray-300 rounded-lg bg-gray-50 focus:ring-0 resize-none text-gray-600"
            />
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-2 bg-white border border-gray-200 rounded shadow-sm hover:bg-gray-50 transition-colors"
              title="Copy to Clipboard"
            >
              {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} className="text-gray-500" />}
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div className="space-y-4">
           <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <Upload size={18} /> Import from Sheet
          </h3>
          <p className="text-sm text-gray-600">
            Paste CSV data from your Google Sheet here to bulk update the inventory in this app.
          </p>
          <textarea
            placeholder="Paste CSV data here... (ID, Name, SKU, Category...)"
            value={csvInput}
            onChange={(e) => setCsvInput(e.target.value)}
            className="w-full h-48 p-3 text-xs font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
          />
          <button
            onClick={handleImport}
            disabled={!csvInput.trim()}
            className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            Update Inventory Database
          </button>
        </div>
      </div>
      
      <div className="mt-8 bg-brand-50 p-4 rounded-lg border border-brand-100 text-sm text-brand-800">
        <strong>Tip:</strong> Ensure your CSV columns match the format: <code>ID, Name, SKU, Category, Quantity, MinLevel, Price, ImageUrl</code> for best results.
      </div>
    </div>
  );
};
