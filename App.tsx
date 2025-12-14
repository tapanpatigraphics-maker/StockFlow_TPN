

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Database, 
  Bot,
  Menu,
  X,
  Settings,
  LogOut,
  ChevronUp,
  FileText
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { InventoryList } from './components/InventoryList';
import { StockMovementForm } from './components/StockMovementForm';
import { SheetSync } from './components/SheetSync';
import { AIAssistant } from './components/AIAssistant';
import { ReportsPanel } from './components/ReportsPanel';
import { EditProductModal } from './components/EditProductModal';
import { SettingsPanel } from './components/SettingsPanel';
import { Product, Transaction, ViewState, User, Role, RoleTemplate, AppTheme, LogEntry } from './types';
import { INITIAL_PRODUCTS, INITIAL_TRANSACTIONS, INITIAL_USERS, INITIAL_ROLE_TEMPLATES, DEFAULT_THEME, INITIAL_DESIGNATIONS, INITIAL_LOGS } from './constants';

// Helper to generate color shades
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// Simple mixing function to generate tints/shades
const mixColor = (color: {r:number, g:number, b:number}, mix: {r:number, g:number, b:number}, weight: number) => {
  return {
    r: Math.round(color.r * (1 - weight) + mix.r * weight),
    g: Math.round(color.g * (1 - weight) + mix.g * weight),
    b: Math.round(color.b * (1 - weight) + mix.b * weight),
  };
};

const App: React.FC = () => {
  // --- State ---
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Auth State
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [roleTemplates, setRoleTemplates] = useState<RoleTemplate[]>(INITIAL_ROLE_TEMPLATES);
  const [designations, setDesignations] = useState<string[]>(INITIAL_DESIGNATIONS);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]); // Default to Admin
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Theme State
  const [theme, setTheme] = useState<AppTheme>(() => {
    try {
      const savedTheme = localStorage.getItem('stockflow_theme');
      return savedTheme ? JSON.parse(savedTheme) : DEFAULT_THEME;
    } catch (error) {
      return DEFAULT_THEME;
    }
  });

  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);

  // Apply Theme Effect
  useEffect(() => {
    const root = document.documentElement;
    const baseRgb = hexToRgb(theme.primaryColor);
    
    // Toggle Dark Mode
    if (theme.mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Save preference
    localStorage.setItem('stockflow_theme', JSON.stringify(theme));

    if (!baseRgb) return;

    const white = { r: 255, g: 255, b: 255 };
    const black = { r: 0, g: 0, b: 0 };

    // Generate shades
    const shades = {
        50: mixColor(baseRgb, white, 0.95),
        100: mixColor(baseRgb, white, 0.9),
        200: mixColor(baseRgb, white, 0.8),
        300: mixColor(baseRgb, white, 0.6),
        400: mixColor(baseRgb, white, 0.3),
        500: baseRgb,
        600: mixColor(baseRgb, black, 0.1),
        700: mixColor(baseRgb, black, 0.2),
        800: mixColor(baseRgb, black, 0.3),
        900: mixColor(baseRgb, black, 0.4),
        950: mixColor(baseRgb, black, 0.5),
    };

    Object.entries(shades).forEach(([key, value]) => {
        root.style.setProperty(`--color-brand-${key}`, `rgb(${value.r}, ${value.g}, ${value.b})`);
    });

    root.style.setProperty('--radius-theme', theme.radius);
  }, [theme]);

  // Ensure view respects permissions on switch
  useEffect(() => {
    if (view === 'SETTINGS' && !currentUser.permissions.manageSettings) setView('DASHBOARD');
    if (view === 'SYNC' && !currentUser.permissions.importExport) setView('DASHBOARD');
    if (view === 'AI_ASSISTANT' && !currentUser.permissions.viewReports) setView('DASHBOARD');
    if (view === 'REPORTS' && !currentUser.permissions.viewReports) setView('DASHBOARD');
    if (view === 'INWARD' && !currentUser.permissions.inwardStock) setView('DASHBOARD');
    if (view === 'OUTWARD' && !currentUser.permissions.outwardStock) setView('DASHBOARD');
  }, [currentUser, view]);

  // --- Helper: Logging ---
  const addLog = (action: string, details: string, module: string) => {
    const newLog: LogEntry = {
        id: Math.random().toString(36).substr(2, 9),
        userId: currentUser.id,
        userName: currentUser.name,
        action,
        details,
        module,
        timestamp: new Date().toISOString()
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // --- Handlers ---

  const handleEditProduct = (product: Product) => {
    if (!currentUser.permissions.editProduct) return;
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const handleAddNewProduct = () => {
    if (!currentUser.permissions.addProduct) return;
    setEditingProduct(undefined);
    setIsEditModalOpen(true);
  };

  const handleDeleteProduct = (id: string) => {
    if (!currentUser.permissions.deleteProduct) return;
    const product = products.find(p => p.id === id);
    if(confirm("Are you sure you want to delete this product? Transactions will remain.")) {
      setProducts(prev => prev.filter(p => p.id !== id));
      addLog('DELETE_PRODUCT', `Deleted product: ${product?.name || id}`, 'INVENTORY');
    }
  };

  const handleSaveProduct = (updated: Partial<Product>) => {
    if (editingProduct) {
      // Update existing
      setProducts(prev => prev.map(p => 
        p.id === editingProduct.id ? { ...p, ...updated, lastUpdated: new Date().toISOString() } as Product : p
      ));
      addLog('UPDATE_PRODUCT', `Updated product details: ${updated.name || editingProduct.name}`, 'INVENTORY');
    } else {
      // Create new
      const newProduct: Product = {
        ...updated,
        id: Math.random().toString(36).substr(2, 9),
        lastUpdated: new Date().toISOString()
      } as Product;
      setProducts(prev => [...prev, newProduct]);
      addLog('CREATE_PRODUCT', `Created new product: ${newProduct.name}`, 'INVENTORY');
    }
  };

  const handleBulkUpdate = (ids: string[], updates: Partial<Product>) => {
    if (!currentUser.permissions.editProduct) return;
    if (ids.length === 0) return;
    
    setProducts(prev => prev.map(p => {
      if (ids.includes(p.id)) {
        return { ...p, ...updates, lastUpdated: new Date().toISOString() };
      }
      return p;
    }));
    addLog('BULK_UPDATE', `Bulk updated ${ids.length} products`, 'INVENTORY');
    alert(`Successfully updated ${ids.length} products.`);
  };

  // Supports multiple item entry
  const handleTransaction = (items: { productId: string, quantity: number, notes: string }[]) => {
    const isOut = view === 'OUTWARD';
    const currentProductsMap = new Map<string, Product>(products.map(p => [p.id, p]));
    const newTransactions: Transaction[] = [];

    items.forEach(item => {
        const product = currentProductsMap.get(item.productId);
        if (product) {
            // Update quantity logic
            const quantityChange = isOut ? -item.quantity : item.quantity;
            const updatedProduct = {
                ...product,
                quantity: product.quantity + quantityChange,
                lastUpdated: new Date().toISOString()
            };
            
            // Update map to ensure subsequent items for same product use updated stock
            currentProductsMap.set(item.productId, updatedProduct);

            // Create Record
            newTransactions.push({
                id: Math.random().toString(36).substr(2, 9),
                productId: item.productId,
                productName: product.name,
                type: isOut ? 'OUT' : 'IN',
                quantity: item.quantity,
                date: new Date().toISOString(),
                notes: item.notes
            });
        }
    });

    // Update State
    setProducts(Array.from(currentProductsMap.values()));
    setTransactions(prev => [...newTransactions, ...prev]);

    const actionType = isOut ? 'OUTWARD_STOCK_BATCH' : 'INWARD_STOCK_BATCH';
    addLog(actionType, `Processed batch of ${items.length} items.`, 'OPERATIONS');

    alert(`Successfully recorded ${items.length} ${isOut ? 'outward' : 'inward'} entries.`);
  };

  const handleUpdateTransaction = (updatedTx: Transaction) => {
    const originalTx = transactions.find(t => t.id === updatedTx.id);
    if (!originalTx) return;

    // 1. Update the transaction record list
    setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));

    // 2. Adjust Product Stock if quantity changed (and product still exists)
    let stockAdjustMsg = '';
    if (originalTx.quantity !== updatedTx.quantity) {
        const product = products.find(p => p.id === updatedTx.productId);
        if (product) {
            const diff = updatedTx.quantity - originalTx.quantity;
            
            // Logic:
            // If Type is IN:  New Qty > Old Qty => Stock Increases (+ diff)
            // If Type is OUT: New Qty > Old Qty => Stock Decreases (- diff)
            
            const adjustment = updatedTx.type === 'IN' ? diff : -diff;
            const newQuantity = product.quantity + adjustment;

            setProducts(prev => prev.map(p => 
                p.id === product.id 
                ? { ...p, quantity: newQuantity, lastUpdated: new Date().toISOString() } 
                : p
            ));
            stockAdjustMsg = `Stock auto-adjusted by ${adjustment > 0 ? '+' : ''}${adjustment}.`;
        }
    }
    addLog('UPDATE_TRANSACTION', `Updated transaction ${updatedTx.id}. ${stockAdjustMsg}`, 'REPORTS');
  };

  const handleDeleteTransaction = (transactionId: string) => {
    if (!currentUser.permissions.deleteProduct) {
        alert("You do not have permission to delete records.");
        return;
    }

    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;

    if (confirm("Are you sure you want to delete this transaction record? \n\nThis will revert the stock changes associated with this record.")) {
        const product = products.find(p => p.id === transaction.productId);
        
        if (product) {
            // Revert logic: 
            // IN (previously added) -> Remove (- qty)
            // OUT (previously removed) -> Add back (+ qty)
            const adjustment = transaction.type === 'IN' ? -transaction.quantity : transaction.quantity;
            const newQuantity = Math.max(0, product.quantity + adjustment);
            
            setProducts(prev => prev.map(p => 
                p.id === product.id 
                ? { ...p, quantity: newQuantity, lastUpdated: new Date().toISOString() } 
                : p
            ));
        }

        setTransactions(prev => prev.filter(t => t.id !== transactionId));
        addLog('DELETE_TRANSACTION', `Deleted transaction ${transactionId} for ${transaction.productName}. Stock reverted.`, 'REPORTS');
    }
  };

  const handleSheetImport = (csvData: string) => {
    if (!currentUser.permissions.importExport) return;
    try {
      // Simple CSV Parse logic
      const lines = csvData.trim().split('\n');
      const newProducts: Product[] = [];
      // Skip header index 0 if it exists and looks like header
      const startIdx = lines[0].toLowerCase().includes('id') ? 1 : 0;

      for (let i = startIdx; i < lines.length; i++) {
        // Handle basic CSV (doesn't handle commas inside quotes perfectly without complex regex, simpler for this demo)
        const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim()); 
        if (cols.length < 5) continue;

        newProducts.push({
          id: cols[0] || Math.random().toString(36).substr(2, 9),
          name: cols[1],
          sku: cols[2],
          category: cols[3],
          quantity: parseInt(cols[4]) || 0,
          minLevel: parseInt(cols[5]) || 0,
          price: parseFloat(cols[6]) || 0,
          imageUrl: cols[7] || 'https://picsum.photos/200/200',
          lastUpdated: new Date().toISOString()
        });
      }
      
      if (newProducts.length > 0) {
        setProducts(newProducts);
        addLog('IMPORT_DATA', `Imported ${newProducts.length} items from CSV`, 'SYSTEM');
        alert(`Imported ${newProducts.length} items successfully.`);
        setView('INVENTORY');
      } else {
        alert("Failed to parse CSV. Check format.");
      }
    } catch (e) {
      alert("Error importing data.");
      console.error(e);
    }
  };

  const handleSmartUpdate = (updates: any[]) => {
    if (!currentUser.permissions.addProduct && !currentUser.permissions.editProduct) return;
    let successCount = 0;
    const currentProducts = [...products];

    updates.forEach(update => {
      if (update.action === 'ADD_STOCK' || update.action === 'REMOVE_STOCK') {
        // Find best match by name
        const product = currentProducts.find(p => p.name.toLowerCase().includes(update.productName.toLowerCase()));
        if (product) {
          const qty = update.quantity;
          product.quantity = update.action === 'ADD_STOCK' ? product.quantity + qty : product.quantity - qty;
          product.lastUpdated = new Date().toISOString();
          successCount++;
          
          // Add transaction log
          setTransactions(prev => [{
            id: Math.random().toString(36).substr(2, 9),
            productId: product.id,
            productName: product.name,
            type: update.action === 'ADD_STOCK' ? 'IN' : 'OUT',
            quantity: qty,
            date: new Date().toISOString(),
            notes: 'AI Smart Update'
          }, ...prev]);
        }
      }
    });

    setProducts(currentProducts);
    addLog('AI_SMART_UPDATE', `AI Agent applied updates to ${successCount} products`, 'AI_ASSISTANT');
    setView('INVENTORY');
  };

  const handleRestoreData = (data: { products: Product[]; transactions: Transaction[] }) => {
    setProducts(data.products);
    setTransactions(data.transactions);
    setView('DASHBOARD');
    addLog('SYSTEM_RESTORE', 'Restored system data from backup', 'SYSTEM');
    alert('Application data restored successfully.');
  };

  const handleResetData = () => {
    setProducts([]);
    setTransactions([]);
    setLogs([]); // Reset logs too? Maybe keep logs of the reset.
    setView('DASHBOARD');
    addLog('SYSTEM_RESET', 'Performed factory reset of data', 'SYSTEM');
    alert('Application has been reset to empty state.');
  };

  // --- User Management Handlers ---

  const handleAddUser = (user: User) => {
    setUsers([...users, user]);
    addLog('USER_CREATE', `Created new user: ${user.name}`, 'SETTINGS');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    // If updating current user, update session immediately
    if (currentUser.id === updatedUser.id) {
        setCurrentUser(updatedUser);
    }
    addLog('USER_UPDATE', `Updated details for user: ${updatedUser.name}`, 'SETTINGS');
  };

  const handleDeleteUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    setUsers(users.filter(u => u.id !== userId));
    addLog('USER_DELETE', `Deleted user: ${user?.name || userId}`, 'SETTINGS');
  };

  const handleSwitchUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      addLog('USER_SWITCH', `Switched session to user: ${user.name}`, 'AUTH');
      setCurrentUser(user);
      setView('DASHBOARD'); // Reset view to dashboard on user switch to avoid unauthorized screens
      setUserMenuOpen(false);
    }
  };

  // --- Designation Handlers ---

  const handleAddDesignation = (designation: string) => {
    if (!designations.includes(designation)) {
        setDesignations([...designations, designation]);
        addLog('DESIGNATION_ADD', `Added designation: ${designation}`, 'SETTINGS');
    }
  };

  const handleUpdateDesignation = (oldDesignation: string, newDesignation: string) => {
    if (designations.includes(newDesignation)) {
        alert("Designation already exists.");
        return;
    }
    setDesignations(prev => prev.map(d => d === oldDesignation ? newDesignation : d));
    // Update all users who had the old designation
    setUsers(prevUsers => prevUsers.map(u => 
        u.designation === oldDesignation ? { ...u, designation: newDesignation } : u
    ));
    // Update current user if needed
    if (currentUser.designation === oldDesignation) {
        setCurrentUser({ ...currentUser, designation: newDesignation });
    }
    addLog('DESIGNATION_UPDATE', `Renamed designation '${oldDesignation}' to '${newDesignation}'`, 'SETTINGS');
  };

  const handleDeleteDesignation = (designation: string) => {
    if (confirm(`Are you sure you want to delete '${designation}'? Users with this designation will need to be updated.`)) {
        setDesignations(prev => prev.filter(d => d !== designation));
        // Optionally clear designation from users? keeping as is usually safer or set to empty
        setUsers(prevUsers => prevUsers.map(u => 
            u.designation === designation ? { ...u, designation: '' } : u
        ));
         if (currentUser.designation === designation) {
            setCurrentUser({ ...currentUser, designation: '' });
        }
        addLog('DESIGNATION_DELETE', `Deleted designation: ${designation}`, 'SETTINGS');
    }
  };

  // --- Role Management Handlers ---

  const handleAddRoleTemplate = (template: RoleTemplate) => {
    setRoleTemplates([...roleTemplates, template]);
    addLog('ROLE_CREATE', `Created role template: ${template.name}`, 'SETTINGS');
  };

  const handleUpdateRoleTemplate = (template: RoleTemplate) => {
    setRoleTemplates(prev => prev.map(t => t.id === template.id ? template : t));
    addLog('ROLE_UPDATE', `Updated role template: ${template.name}`, 'SETTINGS');
  };

  const handleDeleteRoleTemplate = (id: string) => {
    const role = roleTemplates.find(r => r.id === id);
    setRoleTemplates(prev => prev.filter(t => t.id !== id));
    addLog('ROLE_DELETE', `Deleted role template: ${role?.name || id}`, 'SETTINGS');
  };

  const handleUpdateTheme = (newTheme: AppTheme) => {
      setTheme(newTheme);
      // Optional: don't log every minor theme change to avoid clutter, or log only on save?
      // addLog('THEME_UPDATE', `Updated theme settings`, 'SETTINGS');
  };

  // --- Render ---

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100 overflow-hidden transition-colors duration-200">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-brand-600 text-white p-2 rounded-theme">
              <Package size={24} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-purple-600">
              StockFlow
            </h1>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-500 dark:text-gray-400">
            <X size={24} />
          </button>
        </div>

        <nav className="px-4 space-y-2 mt-4 flex-1">
          {currentUser.permissions.viewDashboard && (
            <SidebarItem 
              icon={<LayoutDashboard size={20} />} 
              label="Dashboard" 
              active={view === 'DASHBOARD'} 
              onClick={() => { setView('DASHBOARD'); setSidebarOpen(false); }} 
            />
          )}
          {currentUser.permissions.viewInventory && (
            <SidebarItem 
              icon={<Package size={20} />} 
              label="Inventory List" 
              active={view === 'INVENTORY'} 
              onClick={() => { setView('INVENTORY'); setSidebarOpen(false); }} 
            />
          )}
          
          <div className="pt-4 pb-2">
            <p className="px-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Operations</p>
          </div>
          
          {currentUser.permissions.inwardStock && (
            <SidebarItem 
              icon={<ArrowDownLeft size={20} />} 
              label="Inward Stock" 
              active={view === 'INWARD'} 
              onClick={() => { setView('INWARD'); setSidebarOpen(false); }} 
            />
          )}
          {currentUser.permissions.outwardStock && (
            <SidebarItem 
              icon={<ArrowUpRight size={20} />} 
              label="Outward Stock" 
              active={view === 'OUTWARD'} 
              onClick={() => { setView('OUTWARD'); setSidebarOpen(false); }} 
            />
          )}
          
          {/* Tools */}
          {(currentUser.permissions.viewReports || currentUser.permissions.importExport) && (
            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Tools</p>
            </div>
          )}
          
          {currentUser.permissions.viewReports && (
            <>
              <SidebarItem 
                icon={<Bot size={20} />} 
                label="AI Assistant" 
                active={view === 'AI_ASSISTANT'} 
                onClick={() => { setView('AI_ASSISTANT'); setSidebarOpen(false); }} 
              />
              <SidebarItem 
                icon={<FileText size={20} />} 
                label="Reports" 
                active={view === 'REPORTS'} 
                onClick={() => { setView('REPORTS'); setSidebarOpen(false); }} 
              />
            </>
          )}
          
          {currentUser.permissions.importExport && (
            <SidebarItem 
              icon={<Database size={20} />} 
              label="Sheet Sync (CSV)" 
              active={view === 'SYNC'} 
              onClick={() => { setView('SYNC'); setSidebarOpen(false); }} 
            />
          )}

          {/* System */}
          {currentUser.permissions.manageSettings && (
            <>
              <div className="pt-4 pb-2">
                <p className="px-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">System</p>
              </div>
              <SidebarItem 
                icon={<Settings size={20} />} 
                label="Settings" 
                active={view === 'SETTINGS'} 
                onClick={() => { setView('SETTINGS'); setSidebarOpen(false); }} 
              />
            </>
          )}
        </nav>

        {/* User Profile / Switcher */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 relative">
          <button 
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-full flex items-center gap-3 p-2 rounded-theme hover:bg-white dark:hover:bg-gray-700 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-500 to-purple-500 overflow-hidden">
               <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{currentUser.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{currentUser.role}</p>
            </div>
            <ChevronUp size={16} className={`text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* User Switcher Dropdown */}
          {userMenuOpen && (
            <div className="absolute bottom-full left-0 w-full mb-2 px-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-2 space-y-1">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 px-2 py-1 uppercase">Switch User</p>
                {users.map(u => (
                  <button
                    key={u.id}
                    onClick={() => handleSwitchUser(u.id)}
                    className={`w-full text-left px-2 py-2 rounded-theme text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 ${currentUser.id === u.id ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden shrink-0">
                       <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className="truncate">{u.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 shrink-0 transition-colors duration-200">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-500 dark:text-gray-400 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-theme">
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 capitalize">
              {view.replace('_', ' ').toLowerCase()}
            </h2>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Logged in as: <strong className="text-gray-800 dark:text-gray-200">{currentUser.name}</strong></span>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {view === 'DASHBOARD' && currentUser.permissions.viewDashboard && (
            <Dashboard 
              products={products} 
              transactions={transactions} 
              onQuickAction={(type) => setView(type === 'IN' ? 'INWARD' : 'OUTWARD')}
              currentUser={currentUser}
            />
          )}

          {view === 'INVENTORY' && currentUser.permissions.viewInventory && (
            <InventoryList 
              products={products} 
              transactions={transactions}
              onEdit={handleEditProduct} 
              onDelete={handleDeleteProduct}
              onAddNew={handleAddNewProduct}
              onBulkUpdate={handleBulkUpdate}
              currentUser={currentUser}
            />
          )}

          {(view === 'INWARD' || view === 'OUTWARD') && (
            <div className="flex items-center justify-center min-h-[calc(100%-2rem)]">
              <StockMovementForm 
                type={view === 'INWARD' ? 'IN' : 'OUT'} 
                products={products}
                onSubmit={handleTransaction}
                onCancel={() => setView('INVENTORY')}
                transactions={transactions}
                onUpdateTransaction={handleUpdateTransaction}
                onDeleteTransaction={handleDeleteTransaction}
              />
            </div>
          )}

          {view === 'SYNC' && currentUser.permissions.importExport && (
            <SheetSync 
              products={products} 
              onImport={handleSheetImport}
            />
          )}

          {view === 'AI_ASSISTANT' && currentUser.permissions.viewReports && (
            <AIAssistant 
              products={products}
              onSmartUpdate={handleSmartUpdate}
            />
          )}

          {view === 'REPORTS' && currentUser.permissions.viewReports && (
            <ReportsPanel 
              transactions={transactions} 
              products={products}
              onUpdateTransaction={handleUpdateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {view === 'SETTINGS' && currentUser.permissions.manageSettings && (
            <SettingsPanel 
              data={{ products, transactions }}
              logs={logs}
              users={users}
              roleTemplates={roleTemplates}
              designations={designations}
              onRestore={handleRestoreData}
              onReset={handleResetData}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              onAddRole={handleAddRoleTemplate}
              onUpdateRole={handleUpdateRoleTemplate}
              onDeleteRole={handleDeleteRoleTemplate}
              onAddDesignation={handleAddDesignation}
              onUpdateDesignation={handleUpdateDesignation}
              onDeleteDesignation={handleDeleteDesignation}
              currentUser={currentUser}
              theme={theme}
              onUpdateTheme={handleUpdateTheme}
            />
          )}
        </div>
      </main>

      <EditProductModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        product={editingProduct} 
        onSave={handleSaveProduct}
      />
    </div>
  );
};

// Sidebar Helper Component
const SidebarItem: React.FC<{
  icon: React.ReactNode; 
  label: string; 
  active?: boolean; 
  onClick: () => void
}> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-theme text-sm font-medium transition-colors
      ${active 
        ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300' 
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'}
    `}
  >
    {icon}
    {label}
  </button>
);

export default App;
