
export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  minLevel: number;
  price: number;
  imageUrl: string;
  lastUpdated: string;
}

export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

export interface Transaction {
  id: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantity: number;
  date: string;
  notes?: string;
}

export interface LogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  module: string;
  timestamp: string;
}

export interface DashboardStats {
  totalItems: number;
  lowStockItems: number;
  totalValue: number;
  recentTransactions: Transaction[];
}

export type ViewState = 'DASHBOARD' | 'INVENTORY' | 'INWARD' | 'OUTWARD' | 'REPORTS' | 'SYNC' | 'AI_ASSISTANT' | 'SETTINGS';

export type Role = string;

export interface UserPermissions {
  viewDashboard: boolean;
  viewInventory: boolean;
  addProduct: boolean;
  editProduct: boolean;
  deleteProduct: boolean;
  inwardStock: boolean;
  outwardStock: boolean;
  viewReports: boolean; // Includes AI & History
  importExport: boolean;
  manageSettings: boolean;
}

export interface RoleTemplate {
  id: string;
  name: string;
  description?: string;
  permissions: UserPermissions;
  isSystem?: boolean;
}

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar: string;
  email: string;
  designation?: string;
  permissions: UserPermissions;
}

export interface AppTheme {
  primaryColor: string; // Hex code
  radius: string; // css value like '0.5rem'
  name: string;
  mode: 'light' | 'dark';
}
