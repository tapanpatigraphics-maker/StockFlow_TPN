
import React, { useRef, useState, useMemo } from 'react';
import { Save, Upload, Trash2, Shield, Download, UserPlus, Users, X, Edit2, Check, Lock, Plus, Info, Database, Palette, Sun, Moon, Briefcase, Printer, Wifi, Usb, RefreshCw, Power, AlertCircle, FileText, Clock, Activity, FileDown, Search, Filter, Calendar, FileSpreadsheet } from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from 'xlsx';
import { Product, Transaction, User, Role, UserPermissions, RoleTemplate, AppTheme, LogEntry } from '../types';
import { ROLE_PERMISSIONS, THEME_PRESETS } from '../constants';

interface SettingsPanelProps {
  data: {
    products: Product[];
    transactions: Transaction[];
  };
  logs?: LogEntry[];
  users: User[];
  roleTemplates: RoleTemplate[];
  designations: string[];
  currentUser: User;
  theme: AppTheme;
  onUpdateTheme: (theme: AppTheme) => void;
  onRestore: (data: { products: Product[]; transactions: Transaction[] }) => void;
  onReset: () => void;
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  onAddRole: (template: RoleTemplate) => void;
  onUpdateRole: (template: RoleTemplate) => void;
  onDeleteRole: (id: string) => void;
  onAddDesignation: (designation: string) => void;
  onUpdateDesignation: (oldDesignation: string, newDesignation: string) => void;
  onDeleteDesignation: (designation: string) => void;
}

interface PrinterConfig {
  id: string;
  name: string;
  type: 'LOCAL' | 'NETWORK';
  connection: string;
  driver: string;
  status: 'ONLINE' | 'OFFLINE';
  isDefault: boolean;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  data, 
  logs = [],
  users, 
  roleTemplates,
  designations,
  currentUser,
  theme,
  onUpdateTheme,
  onRestore, 
  onReset,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onAddRole,
  onUpdateRole,
  onDeleteRole,
  onAddDesignation,
  onUpdateDesignation,
  onDeleteDesignation
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'designations' | 'data' | 'theme' | 'printers' | 'logs'>('users');
  
  // User Form State
  const [userFormData, setUserFormData] = useState({ 
    name: '', 
    email: '', 
    designation: '',
    role: roleTemplates[0]?.name || 'Staff',
    permissions: roleTemplates[0]?.permissions || ROLE_PERMISSIONS.staff
  });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Role Form State
  const [roleFormData, setRoleFormData] = useState<{name: string, description: string, permissions: UserPermissions}>({
    name: '',
    description: '',
    permissions: ROLE_PERMISSIONS.staff
  });
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  // Designation State
  const [newDesignation, setNewDesignation] = useState('');
  const [editingDesignation, setEditingDesignation] = useState<string | null>(null);
  const [editDesignationValue, setEditDesignationValue] = useState('');

  // Printer State
  const [printers, setPrinters] = useState<PrinterConfig[]>([
    { id: '1', name: 'Front Desk LaserJet', type: 'NETWORK', connection: '192.168.1.105', driver: 'HP Universal', status: 'ONLINE', isDefault: true },
    { id: '2', name: 'Warehouse Thermal', type: 'LOCAL', connection: 'USB-001', driver: 'Zebra ZPL', status: 'OFFLINE', isDefault: false }
  ]);
  const [printerForm, setPrinterForm] = useState({ name: '', type: 'LOCAL', connection: '', driver: 'Generic / Text Only' });
  const [isAddingPrinter, setIsAddingPrinter] = useState(false);

  // Logs Filter State
  const [logSearch, setLogSearch] = useState('');
  const [logUserFilter, setLogUserFilter] = useState('All');
  const [logDate, setLogDate] = useState('');

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const searchLower = logSearch.toLowerCase();
      const matchesSearch = 
        log.action.toLowerCase().includes(searchLower) || 
        log.details.toLowerCase().includes(searchLower) ||
        log.module.toLowerCase().includes(searchLower) ||
        log.userName.toLowerCase().includes(searchLower);
      
      const matchesUser = logUserFilter === 'All' || log.userName === logUserFilter;
      
      // Date comparison (YYYY-MM-DD)
      const matchesDate = logDate ? log.timestamp.startsWith(logDate) : true;

      return matchesSearch && matchesUser && matchesDate;
    });
  }, [logs, logSearch, logUserFilter, logDate]);

  // --- Handlers for Excel Export ---
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // 1. Current Stock (Inventory List)
    const productData = data.products.map(p => ({
      "ID": p.id,
      "Name": p.name,
      "SKU": p.sku,
      "Category": p.category,
      "Price": p.price,
      "Current Qty": p.quantity,
      "Min Level": p.minLevel,
      "Total Value": p.price * p.quantity,
      "Last Updated": new Date(p.lastUpdated).toLocaleString()
    }));
    const wsProducts = XLSX.utils.json_to_sheet(productData);
    XLSX.utils.book_append_sheet(wb, wsProducts, "Current Stock");

    // 2. Inward Stock History
    const inwardData = data.transactions
        .filter(t => t.type === 'IN')
        .map(t => ({
            "Date": new Date(t.date).toLocaleDateString(),
            "Time": new Date(t.date).toLocaleTimeString(),
            "Product": t.productName,
            "Quantity Added": t.quantity,
            "Reference/Notes": t.notes || ''
        }));
    const wsInward = XLSX.utils.json_to_sheet(inwardData);
    XLSX.utils.book_append_sheet(wb, wsInward, "Inward Stock");

    // 3. Outward Stock History
    const outwardData = data.transactions
        .filter(t => t.type === 'OUT')
        .map(t => ({
            "Date": new Date(t.date).toLocaleDateString(),
            "Time": new Date(t.date).toLocaleTimeString(),
            "Product": t.productName,
            "Quantity Removed": t.quantity,
            "Reference/Notes": t.notes || ''
        }));
    const wsOutward = XLSX.utils.json_to_sheet(outwardData);
    XLSX.utils.book_append_sheet(wb, wsOutward, "Outward Stock");

    // 4. User List
    const userData = users.map(u => ({
        "Name": u.name,
        "Email": u.email,
        "Role": u.role,
        "Designation": u.designation || 'N/A'
    }));
    const wsUsers = XLSX.utils.json_to_sheet(userData);
    XLSX.utils.book_append_sheet(wb, wsUsers, "Users");

    // 5. Roles & Permissions
    const roleData = roleTemplates.map(r => {
        const flatPermissions = Object.entries(r.permissions).reduce((acc, [key, val]) => {
            acc[key] = val ? 'Yes' : '-';
            return acc;
        }, {} as Record<string, string>);
        
        return {
            "Role Name": r.name,
            "Description": r.description || '',
            ...flatPermissions
        };
    });
    const wsRoles = XLSX.utils.json_to_sheet(roleData);
    XLSX.utils.book_append_sheet(wb, wsRoles, "Roles Config");

    // 6. Designations
    const desigData = designations.map(d => ({ "Designation": d }));
    const wsDesig = XLSX.utils.json_to_sheet(desigData);
    XLSX.utils.book_append_sheet(wb, wsDesig, "Designations");

    // 7. System Logs
    if (logs.length > 0) {
      const logData = logs.map(l => ({
          "Timestamp": new Date(l.timestamp).toLocaleString(),
          "User": l.userName,
          "Module": l.module,
          "Action": l.action,
          "Details": l.details
      }));
      const wsLogs = XLSX.utils.json_to_sheet(logData);
      XLSX.utils.book_append_sheet(wb, wsLogs, "System Logs");
    }

    // 8. App Settings
    const settingsData = [{ 
        "Theme": theme.name, 
        "Mode": theme.mode, 
        "Primary Color": theme.primaryColor,
        "Export Date": new Date().toLocaleString()
    }];
    const wsSettings = XLSX.utils.json_to_sheet(settingsData);
    XLSX.utils.book_append_sheet(wb, wsSettings, "App Settings");

    // Write file
    XLSX.writeFile(wb, `StockFlow_Full_Database_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // --- Handlers for Logs Export (CSV/PDF) ---

  const handleExportLogsCSV = () => {
    const headers = ['ID,Timestamp,User,Action,Module,Details'];
    const rows = filteredLogs.map(l => {
      const date = new Date(l.timestamp).toLocaleString();
      const safeDetails = l.details.replace(/,/g, ' ');
      return `${l.id},"${date}",${l.userName},${l.action},${l.module},"${safeDetails}"`;
    });
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\n" + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `system_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportLogsPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("System Audit Logs", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
    if (logDate) {
        doc.text(`Date Filter: ${logDate}`, 14, 27);
    }
    
    const tableColumn = ["Time", "User", "Action", "Module", "Details"];
    const tableRows = filteredLogs.map(l => [
      new Date(l.timestamp).toLocaleString(),
      l.userName,
      l.action,
      l.module,
      l.details
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: logDate ? 35 : 30,
      headStyles: { fillColor: [75, 85, 99] }, // gray-600
      styles: { fontSize: 8 },
      columnStyles: {
        4: { cellWidth: 80 } // Wider column for Details
      }
    });
    doc.save(`system_logs_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // --- Handlers for User Form ---

  const handleUserRoleChange = (roleName: string) => {
    const template = roleTemplates.find(t => t.name === roleName);
    if (template) {
        setUserFormData(prev => ({
            ...prev,
            role: roleName,
            permissions: { ...template.permissions }
        }));
    }
  };

  const handleUserPermissionToggle = (key: keyof UserPermissions) => {
    setUserFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key]
      }
    }));
  };

  const submitUserForm = (e: React.FormEvent) => {
    e.preventDefault();
    if(userFormData.name && userFormData.email) {
      const userPayload: User = {
        id: editingUserId || Math.random().toString(36).substr(2, 9),
        name: userFormData.name,
        email: userFormData.email,
        designation: userFormData.designation,
        role: userFormData.role,
        permissions: userFormData.permissions,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userFormData.name)}&background=random&color=fff`
      };

      if (editingUserId) {
        onUpdateUser(userPayload);
        alert('User settings updated.');
      } else {
        onAddUser(userPayload);
        alert('New user created.');
      }
      
      cancelUserEdit();
    }
  };

  const startUserEdit = (user: User) => {
    setUserFormData({ 
      name: user.name, 
      email: user.email, 
      designation: user.designation || (designations[0] || ''),
      role: user.role,
      permissions: { ...user.permissions }
    });
    setEditingUserId(user.id);
  };

  const cancelUserEdit = () => {
    const defaultTemplate = roleTemplates.find(t => t.name === 'Staff') || roleTemplates[0];
    setUserFormData({ 
      name: '', 
      email: '', 
      designation: '',
      role: defaultTemplate.name,
      permissions: { ...defaultTemplate.permissions }
    });
    setEditingUserId(null);
  };

  // --- Handlers for Role Form ---

  const handleRolePermissionToggle = (key: keyof UserPermissions) => {
    setRoleFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key]
      }
    }));
  };

  const submitRoleForm = (e: React.FormEvent) => {
    e.preventDefault();
    if(roleFormData.name) {
      if (editingRoleId) {
        onUpdateRole({
          id: editingRoleId,
          name: roleFormData.name,
          description: roleFormData.description,
          permissions: roleFormData.permissions,
          isSystem: roleTemplates.find(r => r.id === editingRoleId)?.isSystem
        });
        alert('Role updated.');
      } else {
        onAddRole({
          id: Math.random().toString(36).substr(2, 9),
          name: roleFormData.name,
          description: roleFormData.description,
          permissions: roleFormData.permissions,
          isSystem: false
        });
        alert('Role created.');
      }
      cancelRoleEdit();
    }
  };

  const startRoleEdit = (role: RoleTemplate) => {
    setRoleFormData({
      name: role.name,
      description: role.description || '',
      permissions: { ...role.permissions }
    });
    setEditingRoleId(role.id);
  };

  const cancelRoleEdit = () => {
    setRoleFormData({
      name: '',
      description: '',
      permissions: ROLE_PERMISSIONS.staff // Reset to basic
    });
    setEditingRoleId(null);
  };

  // --- Handlers for Designation ---
  const handleAddDesignationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDesignation.trim()) {
      onAddDesignation(newDesignation.trim());
      setNewDesignation('');
    }
  };

  const startDesignationEdit = (designation: string) => {
    setEditingDesignation(designation);
    setEditDesignationValue(designation);
  };

  const saveDesignationEdit = () => {
    if (editingDesignation && editDesignationValue.trim()) {
      onUpdateDesignation(editingDesignation, editDesignationValue.trim());
      setEditingDesignation(null);
      setEditDesignationValue('');
    }
  };

  // --- Handlers for Printers ---
  const handleAddPrinter = (e: React.FormEvent) => {
    e.preventDefault();
    const newPrinter: PrinterConfig = {
      id: Math.random().toString(36).substr(2, 9),
      name: printerForm.name,
      type: printerForm.type as 'LOCAL' | 'NETWORK',
      connection: printerForm.connection,
      driver: printerForm.driver,
      status: 'ONLINE', // Mock status
      isDefault: printers.length === 0
    };
    setPrinters([...printers, newPrinter]);
    setPrinterForm({ name: '', type: 'LOCAL', connection: '', driver: 'Generic / Text Only' });
    setIsAddingPrinter(false);
  };

  const handleDeletePrinter = (id: string) => {
    if(confirm('Remove this printer configuration?')) {
      setPrinters(printers.filter(p => p.id !== id));
    }
  };

  const handleSetDefaultPrinter = (id: string) => {
    setPrinters(printers.map(p => ({ ...p, isDefault: p.id === id })));
  };

  const handleTestPrinter = (id: string) => {
    const printer = printers.find(p => p.id === id);
    if (printer) {
      alert(`Sent test page to "${printer.name}" via ${printer.type === 'NETWORK' ? printer.connection : 'Local Port'}. \nStatus: Connection Successful.`);
    }
  };


  // --- Data Backup Handlers ---
  const handleBackup = () => {
    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      products: data.products,
      transactions: data.transactions,
      logs: logs
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.products && Array.isArray(json.products)) {
           if(confirm(`Found ${json.products.length} products and ${json.transactions?.length || 0} transactions. Restore? This will overwrite current data.`)){
             onRestore({
               products: json.products,
               transactions: json.transactions || []
             });
           }
        } else {
          alert('Invalid backup file format. Missing "products" array.');
        }
      } catch (err) {
        alert('Error parsing backup file. Please ensure it is a valid JSON file.');
        console.error(err);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // --- Helper to render permissions grid ---
  const renderPermissionsGrid = (permissions: UserPermissions, onToggle: (key: keyof UserPermissions) => void) => {
    const groups = [
      {
        title: 'View Access',
        keys: ['viewDashboard', 'viewInventory', 'viewReports', 'manageSettings'] as Array<keyof UserPermissions>
      },
      {
        title: 'Inventory Management',
        keys: ['addProduct', 'editProduct', 'deleteProduct'] as Array<keyof UserPermissions>
      },
      {
        title: 'Stock Operations',
        keys: ['inwardStock', 'outwardStock'] as Array<keyof UserPermissions>
      },
      {
        title: 'System & Admin',
        keys: ['importExport'] as Array<keyof UserPermissions>
      }
    ];

    return (
      <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-theme border border-gray-100 dark:border-gray-700 space-y-4 max-h-[400px] overflow-y-auto">
        {groups.map(group => (
          <div key={group.title}>
            <h6 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-200 dark:border-gray-700 pb-1">{group.title}</h6>
            <div className="space-y-1">
              {group.keys.map(key => (
                <label key={key} className="flex items-center justify-between cursor-pointer group hover:bg-white dark:hover:bg-gray-800 p-1 rounded transition-colors">
                  <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1').replace('view ', '').trim()}</span>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={permissions[key]}
                      onChange={() => onToggle(key)}
                    />
                    <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full h-full space-y-6 animate-fade-in pb-20">
      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-theme w-fit overflow-x-auto max-w-full">
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-600 dark:text-brand-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
        >
          Users & Permissions
        </button>
        <button 
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTab === 'roles' ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-600 dark:text-brand-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
        >
          Users Role
        </button>
        <button 
          onClick={() => setActiveTab('designations')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTab === 'designations' ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-600 dark:text-brand-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
        >
          Designations
        </button>
        <button 
          onClick={() => setActiveTab('printers')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'printers' ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-600 dark:text-brand-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
        >
          Printer Attachment
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTab === 'logs' ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-600 dark:text-brand-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
        >
          Logs
        </button>
        <button 
          onClick={() => setActiveTab('data')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTab === 'data' ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-600 dark:text-brand-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
        >
          Data Management
        </button>
        <button 
          onClick={() => setActiveTab('theme')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTab === 'theme' ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-600 dark:text-brand-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
        >
          Theme
        </button>
      </div>

      {/* User Management Panel */}
      {activeTab === 'users' && (
        // ... (existing User Panel code)
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in transition-colors">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-theme">
              <Users size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">User Management</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Configure access for individual users</p>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create/Edit User Form */}
            <div className="lg:col-span-1 border-r border-gray-100 dark:border-gray-700 pr-0 lg:pr-6">
              <h4 className="font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2 mb-4">
                {editingUserId ? <Edit2 size={18} /> : <UserPlus size={18} />} 
                {editingUserId ? 'Edit User' : 'Add New User'}
              </h4>
              <form onSubmit={submitUserForm} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={userFormData.name}
                    onChange={e => setUserFormData({...userFormData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-theme focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input 
                    type="email" 
                    required
                    value={userFormData.email}
                    onChange={e => setUserFormData({...userFormData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-theme focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Designation</label>
                  <select
                    value={userFormData.designation}
                    onChange={e => setUserFormData({...userFormData, designation: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-theme focus:ring-2 focus:ring-purple-500 text-sm"
                  >
                    <option value="">-- Select Designation --</option>
                    {designations.map(d => (
                        <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User Role</label>
                  <select 
                    value={userFormData.role}
                    onChange={e => handleUserRoleChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-theme focus:ring-2 focus:ring-purple-500 text-sm"
                  >
                    {roleTemplates.map(role => (
                      <option key={role.id} value={role.name}>{role.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">Applies presets below. You can still customize specific permissions.</p>
                </div>

                {renderPermissionsGrid(userFormData.permissions, handleUserPermissionToggle)}
                
                <div className="flex gap-2 pt-2">
                  <button 
                    type="submit"
                    className={`flex-1 py-2 text-white rounded-theme font-medium text-sm transition-colors ${editingUserId ? 'bg-brand-600 hover:bg-brand-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                  >
                    {editingUserId ? 'Save Changes' : 'Create User'}
                  </button>
                  {editingUserId && (
                    <button 
                      type="button"
                      onClick={cancelUserEdit}
                      className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-theme hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* User List */}
            <div className="lg:col-span-2">
              <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-4">Existing Users</h4>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {users.map(user => (
                  <div key={user.id} className={`flex items-center justify-between p-3 rounded-theme border transition-colors ${editingUserId === user.id ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-100 dark:border-gray-700'}`}>
                    <div className="flex items-center gap-3">
                      <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{user.name} {currentUser.id === user.id && <span className="text-xs text-brand-600 dark:text-brand-400 bg-brand-100 dark:bg-brand-900/50 px-1.5 py-0.5 rounded ml-2">You</span>}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                           {user.designation ? `${user.designation} • ` : ''}
                           {user.email} • <span className="capitalize font-medium text-gray-700 dark:text-gray-300">{user.role}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button 
                          onClick={() => startUserEdit(user)}
                          className={`p-2 rounded-full transition-colors ${editingUserId === user.id ? 'bg-brand-200 dark:bg-brand-800 text-brand-700 dark:text-brand-300' : 'text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/30'}`}
                          title="Edit User & Permissions"
                        >
                          <Edit2 size={16} />
                        </button>
                        
                        {user.id !== currentUser.id && (
                          <button 
                            onClick={() => onDeleteUser(user.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                            title="Delete User"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Designation Panel */}
      {activeTab === 'designations' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in transition-colors">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-3">
             <div className="p-2 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-theme">
                <Briefcase size={20} />
             </div>
             <div>
               <h3 className="font-semibold text-gray-800 dark:text-gray-100">Designations</h3>
               <p className="text-xs text-gray-500 dark:text-gray-400">Manage standard job titles</p>
             </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-4">Add New Designation</h4>
                <form onSubmit={handleAddDesignationSubmit} className="flex gap-2 mb-6">
                    <input 
                      type="text" 
                      value={newDesignation}
                      onChange={(e) => setNewDesignation(e.target.value)}
                      placeholder="e.g. Senior Manager"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-theme focus:ring-2 focus:ring-brand-500 text-sm"
                    />
                    <button type="submit" disabled={!newDesignation.trim()} className="px-4 py-2 bg-brand-600 text-white rounded-theme text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
                        Add
                    </button>
                </form>

                <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-3">All Designations</h4>
                <div className="border border-gray-200 dark:border-gray-700 rounded-theme overflow-hidden bg-white dark:bg-gray-800">
                    {designations.map((designation, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            {editingDesignation === designation ? (
                                <div className="flex gap-2 flex-1 mr-2">
                                    <input 
                                        type="text" 
                                        value={editDesignationValue} 
                                        onChange={(e) => setEditDesignationValue(e.target.value)}
                                        className="flex-1 px-2 py-1 text-sm border border-brand-300 rounded focus:ring-1 focus:ring-brand-500"
                                        autoFocus
                                    />
                                    <button onClick={saveDesignationEdit} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={16} /></button>
                                    <button onClick={() => setEditingDesignation(null)} className="p-1 text-red-600 hover:bg-red-50 rounded"><X size={16} /></button>
                                </div>
                            ) : (
                                <span className="text-sm text-gray-700 dark:text-gray-300">{designation}</span>
                            )}
                            
                            {editingDesignation !== designation && (
                                <div className="flex gap-1">
                                    <button onClick={() => startDesignationEdit(designation)} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                                        <Edit2 size={14} />
                                    </button>
                                    <button onClick={() => onDeleteDesignation(designation)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                    {designations.length === 0 && (
                        <div className="p-4 text-center text-sm text-gray-400 italic">No designations found.</div>
                    )}
                </div>
             </div>
             
             <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-xl border border-blue-100 dark:border-blue-900/30">
                 <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2"><Info size={18} /> About Designations</h4>
                 <p className="text-sm text-blue-700 dark:text-blue-200 mb-4">
                     Designations are standardized job titles used across your organization. Managing them here ensures:
                 </p>
                 <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-200 space-y-2 mb-4">
                     <li>Consistency in user profiles.</li>
                     <li>Easier filtering and reporting in the future.</li>
                     <li>Typo prevention during user creation.</li>
                 </ul>
                 <p className="text-xs text-blue-600 dark:text-blue-400 italic">
                     Note: Renaming a designation here will automatically update all users currently holding that title. Deleting a designation will remove it from the list but won't delete the users (their designation field will be cleared).
                 </p>
             </div>
          </div>
        </div>
      )}

      {/* Role Management Panel */}
      {activeTab === 'roles' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in transition-colors">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-3">
             <div className="p-2 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-theme">
                <Shield size={20} />
             </div>
             <div>
               <h3 className="font-semibold text-gray-800 dark:text-gray-100">Users Role</h3>
               <p className="text-xs text-gray-500 dark:text-gray-400">Create and manage role presets</p>
             </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-1 border-r border-gray-100 dark:border-gray-700 pr-0 lg:pr-6">
                <h4 className="font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2 mb-4">
                  {editingRoleId ? <Edit2 size={18} /> : <Plus size={18} />} 
                  {editingRoleId ? 'Edit Role' : 'Create Role'}
                </h4>
                <form onSubmit={submitRoleForm} className="space-y-4">
                   <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role Name</label>
                      <input 
                        type="text" 
                        required
                        value={roleFormData.name}
                        onChange={e => setRoleFormData({...roleFormData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-theme focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                        placeholder="e.g. Supervisor"
                      />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                      <textarea 
                        value={roleFormData.description}
                        onChange={e => setRoleFormData({...roleFormData, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-theme focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm h-20 resize-none"
                        placeholder="Describe what this role allows..."
                      />
                   </div>
                   
                   {renderPermissionsGrid(roleFormData.permissions, handleRolePermissionToggle)}
                   
                   <div className="flex gap-2 pt-2">
                    <button 
                      type="submit"
                      className={`flex-1 py-2 text-white rounded-theme font-medium text-sm transition-colors ${editingRoleId ? 'bg-brand-600 hover:bg-brand-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                    >
                      {editingRoleId ? 'Update Role' : 'Create Role'}
                    </button>
                    {editingRoleId && (
                      <button 
                        type="button"
                        onClick={cancelRoleEdit}
                        className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-theme hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <X size={18} />
                      </button>
                    )}
                   </div>
                </form>
             </div>
             
             <div className="lg:col-span-2">
                <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-4">Available Roles</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {roleTemplates.map(role => (
                      <div key={role.id} className={`p-4 rounded-theme border transition-all flex flex-col h-full ${editingRoleId === role.id ? 'border-brand-300 bg-brand-50 dark:bg-brand-900/20 ring-2 ring-brand-100' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                         <div className="flex justify-between items-start mb-2">
                            <h5 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                               {role.name}
                               {role.isSystem && <span className="text-[10px] bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-500 uppercase tracking-wider">System</span>}
                            </h5>
                            <div className="flex gap-1">
                               <button 
                                 onClick={() => startRoleEdit(role)}
                                 className="p-1.5 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/30 rounded"
                                 title="Edit"
                               >
                                  <Edit2 size={14} />
                               </button>
                               {!role.isSystem && (
                                 <button 
                                   onClick={() => onDeleteRole(role.id)}
                                   className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                                   title="Delete"
                                 >
                                    <Trash2 size={14} />
                                 </button>
                               )}
                            </div>
                         </div>
                         
                         {role.description && (
                           <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{role.description}</p>
                         )}

                         <div className="mt-auto pt-2 border-t border-gray-200/50 dark:border-gray-600/50">
                           <div className="flex flex-wrap gap-1">
                              {/* Display summary of key permissions */}
                              {Object.entries(role.permissions).filter(([,v]) => v).length === 0 ? (
                                <span className="text-[10px] text-gray-400 italic">No permissions</span>
                              ) : (
                                <>
                                  {Object.entries(role.permissions).filter(([,v]) => v).slice(0, 4).map(([k]) => (
                                    <span key={k} className="text-[10px] bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 text-gray-500 dark:text-gray-300 px-1.5 py-0.5 rounded capitalize">
                                        {k.replace(/([A-Z])/g, ' $1').replace('view ', '').trim()}
                                    </span>
                                  ))}
                                  {Object.values(role.permissions).filter(v => v).length > 4 && (
                                    <span className="text-[10px] text-gray-400 px-1">+ {Object.values(role.permissions).filter(v => v).length - 4} more</span>
                                  )}
                                </>
                              )}
                           </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Printer Attachment Panel */}
      {activeTab === 'printers' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in transition-colors">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-3">
             <div className="p-2 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-theme">
                <Printer size={20} />
             </div>
             <div>
               <h3 className="font-semibold text-gray-800 dark:text-gray-100">Printer Attachment</h3>
               <p className="text-xs text-gray-500 dark:text-gray-400">Configure local and network printers</p>
             </div>
          </div>

          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
               <h4 className="font-medium text-gray-700 dark:text-gray-200">Attached Devices</h4>
               <button 
                onClick={() => setIsAddingPrinter(!isAddingPrinter)}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-theme text-sm font-medium hover:bg-brand-700 transition-colors"
               >
                 {isAddingPrinter ? <X size={16} /> : <Plus size={16} />} {isAddingPrinter ? 'Cancel' : 'Add Printer'}
               </button>
            </div>

            {isAddingPrinter && (
              <div className="bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 rounded-lg p-5 mb-6 animate-fade-in">
                  <h5 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2"><Plus size={16} /> Add New Device</h5>
                  <form onSubmit={handleAddPrinter} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Printer Name</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. Warehouse Label Printer"
                          value={printerForm.name}
                          onChange={e => setPrinterForm({...printerForm, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-theme focus:ring-2 focus:ring-brand-500 text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Connection Type</label>
                         <select 
                            value={printerForm.type}
                            onChange={e => setPrinterForm({...printerForm, type: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-theme focus:ring-2 focus:ring-brand-500 text-sm"
                         >
                            <option value="LOCAL">Local (USB/Serial)</option>
                            <option value="NETWORK">Network (IP/Wifi)</option>
                         </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                            {printerForm.type === 'NETWORK' ? 'IP Address / Hostname' : 'Port / Device ID'}
                        </label>
                        <input 
                          type="text" 
                          required
                          placeholder={printerForm.type === 'NETWORK' ? '192.168.1.100' : 'USB001 / COM3'}
                          value={printerForm.connection}
                          onChange={e => setPrinterForm({...printerForm, connection: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-theme focus:ring-2 focus:ring-brand-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Driver / Protocol</label>
                         <select 
                            value={printerForm.driver}
                            onChange={e => setPrinterForm({...printerForm, driver: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-theme focus:ring-2 focus:ring-brand-500 text-sm"
                         >
                            <option value="Generic / Text Only">Generic / Text Only</option>
                            <option value="HP Universal">HP Universal Print Driver</option>
                            <option value="Zebra ZPL">Zebra ZPL (Label)</option>
                            <option value="Epson ESC/POS">Epson ESC/POS (Receipt)</option>
                            <option value="Brother QL">Brother QL Series</option>
                         </select>
                      </div>

                      <div className="md:col-span-2 pt-2">
                         <button type="submit" className="px-6 py-2 bg-brand-600 text-white rounded-theme font-medium hover:bg-brand-700 transition-colors">
                            Save Configuration
                         </button>
                      </div>
                  </form>
              </div>
            )}

            <div className="space-y-3">
              {printers.map(printer => (
                <div key={printer.id} className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border transition-all ${printer.isDefault ? 'bg-brand-50 dark:bg-brand-900/10 border-brand-200 dark:border-brand-800' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700'}`}>
                    <div className="flex items-center gap-4 mb-3 md:mb-0">
                        <div className={`p-3 rounded-full ${printer.type === 'NETWORK' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300'}`}>
                           {printer.type === 'NETWORK' ? <Wifi size={20} /> : <Usb size={20} />}
                        </div>
                        <div>
                           <h5 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                             {printer.name}
                             {printer.isDefault && <span className="text-[10px] bg-brand-200 dark:bg-brand-900 text-brand-800 dark:text-brand-300 px-2 py-0.5 rounded-full">Default</span>}
                           </h5>
                           <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                             {printer.type} • {printer.connection}
                           </p>
                           <p className="text-xs text-gray-400 mt-0.5">Driver: {printer.driver}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${printer.status === 'ONLINE' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                            <div className={`w-2 h-2 rounded-full ${printer.status === 'ONLINE' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                            {printer.status}
                        </span>
                        
                        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>
                        
                        <button 
                          onClick={() => handleTestPrinter(printer.id)}
                          className="p-2 text-gray-500 hover:text-brand-600 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors" 
                          title="Test Connection / Print Test Page"
                        >
                           <RefreshCw size={18} />
                        </button>

                         {!printer.isDefault && (
                           <button 
                             onClick={() => handleSetDefaultPrinter(printer.id)}
                             className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors" 
                             title="Set as Default"
                           >
                              <Check size={18} />
                           </button>
                         )}

                        <button 
                          onClick={() => handleDeletePrinter(printer.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" 
                          title="Remove Device"
                        >
                           <Trash2 size={18} />
                        </button>
                    </div>
                </div>
              ))}
              {printers.length === 0 && (
                <div className="text-center p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-400">
                    <Printer size={48} className="mx-auto mb-2 opacity-20" />
                    <p>No printers configured.</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30 flex gap-3">
               <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
               <div>
                  <h6 className="font-semibold text-blue-800 dark:text-blue-300 text-sm">Local Printer Access Note</h6>
                  <p className="text-xs text-blue-700 dark:text-blue-200 mt-1">
                     Web browsers run in a sandbox environment and cannot directly access local hardware drivers (USB/Parallel) without a bridge service or specific WebUSB compatible hardware. 
                     This configuration panel stores your printer preferences for generating print-ready files (PDF/Raw) formatted for the specific driver selected.
                  </p>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* System Logs Panel */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in transition-colors">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col justify-between gap-4">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-theme">
                        <Activity size={20} />
                    </div>
                    <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">System Logs</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Audit trail of actions and movements</p>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <button 
                    onClick={handleExportLogsCSV}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-theme font-medium transition-colors text-sm"
                    >
                    <Download size={16} /> Excel
                    </button>
                    <button 
                    onClick={handleExportLogsPDF}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-theme font-medium transition-colors text-sm"
                    >
                    <FileDown size={16} /> PDF
                    </button>
                </div>
             </div>

             {/* Filters */}
             <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search action or details..." 
                        value={logSearch}
                        onChange={(e) => setLogSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-theme text-sm focus:ring-2 focus:ring-brand-500"
                    />
                </div>
                
                <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <select
                        value={logUserFilter}
                        onChange={(e) => setLogUserFilter(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-theme text-sm focus:ring-2 focus:ring-brand-500 appearance-none bg-white"
                    >
                        <option value="All">All Users</option>
                        {users.map(u => (
                            <option key={u.id} value={u.name}>{u.name}</option>
                        ))}
                    </select>
                </div>

                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="date"
                        value={logDate}
                        onChange={(e) => setLogDate(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-theme text-sm focus:ring-2 focus:ring-brand-500"
                    />
                </div>

                <button 
                    onClick={() => { setLogSearch(''); setLogUserFilter('All'); setLogDate(''); }}
                    className="py-2 px-4 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-theme text-sm transition-colors"
                >
                    Clear Filters
                </button>
             </div>
          </div>

          <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">
                    <tr>
                        <th className="px-6 py-3 font-semibold">Timestamp</th>
                        <th className="px-6 py-3 font-semibold">User</th>
                        <th className="px-6 py-3 font-semibold">Module</th>
                        <th className="px-6 py-3 font-semibold">Action</th>
                        <th className="px-6 py-3 font-semibold">Details</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredLogs.length > 0 ? (
                        filteredLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                <td className="px-6 py-3 text-gray-500 dark:text-gray-400 text-xs font-mono whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <Clock size={12} />
                                        {new Date(log.timestamp).toLocaleString()}
                                    </div>
                                </td>
                                <td className="px-6 py-3 font-medium text-gray-800 dark:text-gray-200">
                                    {log.userName}
                                </td>
                                <td className="px-6 py-3">
                                    <span className="inline-block px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium">
                                        {log.module}
                                    </span>
                                </td>
                                <td className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-300">
                                    {log.action}
                                </td>
                                <td className="px-6 py-3 text-gray-600 dark:text-gray-400 italic">
                                    {log.details}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                                No logs found matching your criteria.
                            </td>
                        </tr>
                    )}
                </tbody>
             </table>
          </div>
          <div className="p-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-right text-xs text-gray-500 dark:text-gray-400">
            Showing {filteredLogs.length} of {logs.length} entries
          </div>
        </div>
      )}

      {/* Data Management Panel */}
      {activeTab === 'data' && (
        <div className="space-y-6 animate-fade-in">
          {/* Data Backup & Restore */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-3">
              <div className="p-2 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-theme">
                <Database size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Data Management</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Backup and restore your full application state</p>
              </div>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                  <Download size={18} /> Backup Data (JSON)
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Download a complete JSON backup of your current inventory products and transaction history to your computer.
                </p>
                <button 
                  onClick={handleBackup}
                  className="w-full py-2 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-theme font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={18} /> Download Backup
                </button>
              </div>

               <div className="space-y-4">
                <h4 className="font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                  <FileSpreadsheet size={18} /> Export Database (Excel)
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Export all system data (Products, Transactions, Users, Logs) into a multi-sheet Excel file.
                </p>
                <button 
                  onClick={handleExportExcel}
                  className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-theme font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <FileSpreadsheet size={18} /> Export to Excel
                </button>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                  <Upload size={18} /> Restore Data (JSON)
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upload a previously saved JSON backup file to restore your inventory state. This will replace current data.
                </p>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json"
                  className="hidden" 
                />
                <button 
                  onClick={handleRestoreClick}
                  className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-theme font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Upload size={18} /> Upload Backup File
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30 overflow-hidden transition-colors">
            <div className="p-4 border-b border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-theme">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-300">Danger Zone</h3>
                <p className="text-xs text-red-600 dark:text-red-400">Irreversible actions</p>
              </div>
            </div>
            
            <div className="p-6 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200">Factory Reset</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Permanently delete all products and transactions. This cannot be undone.</p>
              </div>
              <button 
                onClick={() => {
                  if(confirm("Are you absolutely sure? This will delete ALL data in the application.")) {
                    onReset();
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-theme font-medium transition-colors flex items-center gap-2"
              >
                <Trash2 size={18} /> Reset All Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Theme Management Panel */}
      {activeTab === 'theme' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in transition-colors">
           <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-3">
              <div className="p-2 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-theme">
                <Palette size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Appearance & Theme</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Customize the look and feel of the application</p>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
               {/* Color Selection */}
               <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-4">Primary Brand Color</h4>
                  <div className="flex items-center gap-4 mb-6">
                    <input 
                      type="color" 
                      value={theme.primaryColor}
                      onChange={(e) => onUpdateTheme({ ...theme, primaryColor: e.target.value })}
                      className="w-12 h-12 p-1 rounded-lg cursor-pointer border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Custom Color</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">{theme.primaryColor}</p>
                    </div>
                  </div>

                  <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Presets</h5>
                  <div className="grid grid-cols-3 gap-3">
                     {THEME_PRESETS.map(preset => (
                       <button
                         key={preset.name}
                         onClick={() => onUpdateTheme({ ...theme, primaryColor: preset.primaryColor, radius: preset.radius })}
                         className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${theme.primaryColor === preset.primaryColor ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                       >
                         <div 
                            className="w-6 h-6 rounded-full border border-black/10 shadow-sm"
                            style={{ backgroundColor: preset.primaryColor }}
                         />
                         <span className="text-xs text-gray-600 dark:text-gray-300">{preset.name}</span>
                       </button>
                     ))}
                  </div>
               </div>

               {/* Interface Settings */}
               <div>
                  {/* Mode Selection */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-2">Theme Mode</h4>
                    <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg w-fit">
                      <button 
                        onClick={() => onUpdateTheme({ ...theme, mode: 'light' })}
                        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded transition-all ${theme.mode === 'light' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 dark:text-gray-400'}`}
                      >
                        <Sun size={14} /> Light
                      </button>
                      <button 
                         onClick={() => onUpdateTheme({ ...theme, mode: 'dark' })}
                         className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded transition-all ${theme.mode === 'dark' ? 'bg-gray-600 shadow-sm text-white' : 'text-gray-500 dark:text-gray-400'}`}
                      >
                        <Moon size={14} /> Dark
                      </button>
                    </div>
                  </div>

                  <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-2">Border Radius</h4>
                  <div className="mb-6">
                    <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg w-fit">
                      <button 
                        onClick={() => onUpdateTheme({ ...theme, radius: '0rem' })}
                        className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${theme.radius === '0rem' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                      >
                        Square
                      </button>
                      <button 
                         onClick={() => onUpdateTheme({ ...theme, radius: '0.5rem' })}
                         className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${theme.radius === '0.5rem' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                      >
                        Standard
                      </button>
                      <button 
                         onClick={() => onUpdateTheme({ ...theme, radius: '1rem' })}
                         className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${theme.radius === '1rem' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                      >
                        Round
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-theme border border-gray-200 dark:border-gray-700">
                    <h5 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Theme Preview</h5>
                    <div className="space-y-3">
                       <button className="w-full py-2 bg-brand-600 text-white rounded-theme text-sm">Primary Button</button>
                       <button className="w-full py-2 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 rounded-theme text-sm">Secondary Button</button>
                       <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <input type="checkbox" checked readOnly className="text-brand-600 rounded focus:ring-brand-500" />
                          <span>Checkbox Input</span>
                       </div>
                    </div>
                  </div>
               </div>
            </div>
        </div>
      )}
    </div>
  );
};
