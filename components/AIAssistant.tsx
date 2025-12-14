
import React, { useState } from 'react';
import { Bot, Sparkles, Send, Loader2 } from 'lucide-react';
import { Product } from '../types';
import { inventoryService } from '../services/geminiService';

interface AIAssistantProps {
  products: Product[];
  onSmartUpdate: (updates: any) => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ products, onSmartUpdate }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [naturalInput, setNaturalInput] = useState('');
  const [smartResult, setSmartResult] = useState<any>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    const result = await inventoryService.analyzeStock(products);
    setAnalysis(result);
    setLoading(false);
  };

  const handleSmartProcess = async () => {
    if (!naturalInput.trim()) return;
    setLoading(true);
    const result = await inventoryService.parseNaturalLanguageUpdate(naturalInput);
    setSmartResult(result);
    setLoading(false);
  };

  const applySmartUpdates = () => {
    if (smartResult && smartResult.updates) {
      onSmartUpdate(smartResult.updates);
      setSmartResult(null);
      setNaturalInput('');
      alert("Updates applied successfully!");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in mt-6">
      {/* Insight Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 text-purple-600 rounded-theme">
            <Sparkles size={24} />
          </div>
          <h2 className="text-lg font-bold text-gray-800">Inventory Intelligence</h2>
        </div>
        
        <p className="text-gray-600 text-sm mb-6">
          Use Google Gemini AI to analyze your current stock levels and get actionable recommendations.
        </p>

        <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-100 mb-4 overflow-y-auto min-h-[200px] max-h-[300px]">
          {loading && !analysis && !smartResult ? (
            <div className="flex items-center justify-center h-full text-gray-400 gap-2">
              <Loader2 className="animate-spin" /> Analyzing data...
            </div>
          ) : analysis ? (
            <div className="prose prose-sm prose-purple max-w-none whitespace-pre-line text-gray-700">
              {analysis}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 italic">
              Click "Generate Report" to start.
            </div>
          )}
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full py-3 bg-purple-600 text-white rounded-theme hover:bg-purple-700 font-medium transition-colors flex justify-center items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Bot size={18} />}
          Generate Stock Report
        </button>
      </div>

      {/* Smart Action Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-brand-100 text-brand-600 rounded-theme">
            <Bot size={24} />
          </div>
          <h2 className="text-lg font-bold text-gray-800">Smart Commands</h2>
        </div>

        <p className="text-gray-600 text-sm mb-4">
          Paste a message or email about a shipment, and let AI update your stock automatically.
        </p>

        <textarea
          value={naturalInput}
          onChange={(e) => setNaturalInput(e.target.value)}
          placeholder="e.g., 'Received 50 Wireless Mice and 20 Keyboards today from supplier X...'"
          className="w-full p-4 border border-gray-300 rounded-theme focus:ring-2 focus:ring-brand-500 focus:border-brand-500 h-32 resize-none text-sm mb-4"
        />

        {smartResult && (
          <div className="bg-green-50 border border-green-100 rounded-lg p-3 mb-4">
            <h4 className="font-semibold text-green-800 text-sm mb-2">Review Changes:</h4>
            <ul className="space-y-1 text-xs text-green-700">
              {smartResult.updates?.map((u: any, i: number) => (
                <li key={i}>• {u.action}: {u.quantity}x {u.productName}</li>
              ))}
            </ul>
            <button 
              onClick={applySmartUpdates}
              className="mt-3 w-full py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 font-medium"
            >
              Confirm & Apply Changes
            </button>
          </div>
        )}

        <button
          onClick={handleSmartProcess}
          disabled={loading || !naturalInput}
          className="w-full py-3 bg-brand-600 text-white rounded-theme hover:bg-brand-700 font-medium transition-colors flex justify-center items-center gap-2 mt-auto"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          Process Command
        </button>
      </div>
    </div>
  );
};
