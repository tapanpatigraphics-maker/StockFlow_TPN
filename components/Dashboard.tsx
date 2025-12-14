
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Package, AlertTriangle, DollarSign, Activity, Lock } from 'lucide-react';
import { Product, Transaction, User } from '../types';

interface DashboardProps {
  products: Product[];
  transactions: Transaction[];
  onQuickAction: (action: 'IN' | 'OUT') => void;
  currentUser?: User; // Optional prop to avoid breaking other calls if not updated yet, though mainly we pass it now.
}

export const Dashboard: React.FC<DashboardProps> = ({ products, transactions, onQuickAction, currentUser }) => {
  const lowStockItems = products.filter(p => p.quantity <= p.minLevel);
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  const totalItems = products.reduce((sum, p) => sum + p.quantity, 0);

  // Prepare chart data: Top 5 items by quantity
  const chartData = [...products]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 7)
    .map(p => ({
      name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
      quantity: p.quantity,
      min: p.minLevel
    }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stock */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-brand-100 text-brand-600 rounded-full">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Items</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalItems}</h3>
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className={`p-3 rounded-full ${lowStockItems.length > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Low Stock Alerts</p>
            <h3 className="text-2xl font-bold text-gray-900">{lowStockItems.length}</h3>
          </div>
        </div>

        {/* Total Value */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-full">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Inventory Value</p>
            <h3 className="text-2xl font-bold text-gray-900">₹{totalValue.toLocaleString()}</h3>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Recent Moves</p>
            <h3 className="text-2xl font-bold text-gray-900">{transactions.length > 0 ? transactions.slice(0, 5).length : 0}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Stock Levels Overview</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="quantity" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.quantity <= entry.min ? '#ef4444' : 'var(--color-brand-500)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions & Alerts */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
          <div className="flex flex-col gap-3 mb-6">
            {currentUser?.permissions.inwardStock ? (
                <button 
                onClick={() => onQuickAction('IN')}
                className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-theme font-medium transition-colors flex items-center justify-center gap-2"
                >
                <Package size={18} /> Inward Stock
                </button>
            ) : (
                <button disabled className="w-full py-2 px-4 bg-gray-100 text-gray-400 rounded-theme font-medium flex items-center justify-center gap-2 cursor-not-allowed">
                    <Lock size={16} /> Inward Stock
                </button>
            )}

            {currentUser?.permissions.outwardStock ? (
                <button 
                onClick={() => onQuickAction('OUT')}
                className="w-full py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-theme font-medium transition-colors flex items-center justify-center gap-2"
                >
                <Package size={18} /> Outward Stock
                </button>
            ) : (
                <button disabled className="w-full py-2 px-4 bg-gray-100 text-gray-400 rounded-theme font-medium flex items-center justify-center gap-2 cursor-not-allowed">
                     <Lock size={16} /> Outward Stock
                </button>
            )}
          </div>
          
          <h4 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Low Stock Alerts</h4>
          <div className="flex-1 overflow-y-auto max-h-48 pr-2">
            {lowStockItems.length === 0 ? (
              <p className="text-gray-400 text-sm italic">All stock levels healthy.</p>
            ) : (
              <ul className="space-y-3">
                {lowStockItems.map(item => (
                  <li key={item.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-red-50 transition-colors">
                    <img src={item.imageUrl} alt="" className="w-10 h-10 rounded object-cover" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.name}</p>
                      <p className="text-xs text-red-600 font-bold">Only {item.quantity} left (Min: {item.minLevel})</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
