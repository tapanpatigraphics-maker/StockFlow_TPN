
import { Product, Transaction, User, UserPermissions, RoleTemplate, AppTheme, LogEntry } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Wireless Ergonomic Mouse',
    sku: 'TECH-001',
    category: 'Electronics',
    quantity: 45,
    minLevel: 10,
    price: 29.99,
    imageUrl: 'https://picsum.photos/200/200?random=1',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Mechanical Keyboard RGB',
    sku: 'TECH-002',
    category: 'Electronics',
    quantity: 8,
    minLevel: 15,
    price: 89.99,
    imageUrl: 'https://picsum.photos/200/200?random=2',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Office Chair Mesh',
    sku: 'FUR-001',
    category: 'Furniture',
    quantity: 12,
    minLevel: 5,
    price: 150.00,
    imageUrl: 'https://picsum.photos/200/200?random=3',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'USB-C Hub Multiport',
    sku: 'ACC-005',
    category: 'Accessories',
    quantity: 120,
    minLevel: 30,
    price: 45.50,
    imageUrl: 'https://picsum.photos/200/200?random=4',
    lastUpdated: new Date().toISOString(),
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    productId: '1',
    productName: 'Wireless Ergonomic Mouse',
    type: 'IN',
    quantity: 50,
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    notes: 'Initial stock',
  },
  {
    id: 't2',
    productId: '1',
    productName: 'Wireless Ergonomic Mouse',
    type: 'OUT',
    quantity: 5,
    date: new Date(Date.now() - 86400000).toISOString(),
    notes: 'Sales order #101',
  },
];

export const INITIAL_LOGS: LogEntry[] = [
  {
    id: 'l1',
    userId: 'u1',
    userName: 'Admin User',
    action: 'SYSTEM_INIT',
    details: 'System initialized with default data',
    module: 'SYSTEM',
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString()
  }
];

export const ROLE_PERMISSIONS: Record<string, UserPermissions> = {
  admin: {
    viewDashboard: true,
    viewInventory: true,
    addProduct: true,
    editProduct: true,
    deleteProduct: true,
    inwardStock: true,
    outwardStock: true,
    viewReports: true,
    importExport: true,
    manageSettings: true,
  },
  manager: {
    viewDashboard: true,
    viewInventory: true,
    addProduct: true,
    editProduct: true,
    deleteProduct: false,
    inwardStock: true,
    outwardStock: true,
    viewReports: true,
    importExport: true,
    manageSettings: false,
  },
  staff: {
    viewDashboard: true,
    viewInventory: true,
    addProduct: false,
    editProduct: false,
    deleteProduct: false,
    inwardStock: true,
    outwardStock: true,
    viewReports: false,
    importExport: false,
    manageSettings: false,
  }
};

export const INITIAL_ROLE_TEMPLATES: RoleTemplate[] = [
  { 
    id: 'admin', 
    name: 'Admin', 
    description: 'Full access to all system features including settings.',
    permissions: ROLE_PERMISSIONS.admin, 
    isSystem: true 
  },
  { 
    id: 'manager', 
    name: 'Manager', 
    description: 'Can manage inventory and view reports, but cannot delete products or change settings.',
    permissions: ROLE_PERMISSIONS.manager, 
    isSystem: true 
  },
  { 
    id: 'staff', 
    name: 'Staff', 
    description: 'Limited access to viewing inventory and recording stock movements.',
    permissions: ROLE_PERMISSIONS.staff, 
    isSystem: true 
  },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'u1',
    name: 'Admin User',
    role: 'Admin',
    email: 'admin@stockflow.com',
    designation: 'System Administrator',
    avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff',
    permissions: ROLE_PERMISSIONS.admin
  },
  {
    id: 'u2',
    name: 'Store Manager',
    role: 'Manager',
    email: 'manager@stockflow.com',
    designation: 'Branch Manager',
    avatar: 'https://ui-avatars.com/api/?name=Store+Manager&background=6366f1&color=fff',
    permissions: ROLE_PERMISSIONS.manager
  },
  {
    id: 'u3',
    name: 'Warehouse Staff',
    role: 'Staff',
    email: 'staff@stockflow.com',
    designation: 'Inventory Clerk',
    avatar: 'https://ui-avatars.com/api/?name=Warehouse+Staff&background=10b981&color=fff',
    permissions: ROLE_PERMISSIONS.staff
  }
];

export const INITIAL_DESIGNATIONS = [
  'System Administrator',
  'Branch Manager',
  'Inventory Clerk',
  'Sales Associate',
  'Warehouse Supervisor',
  'Logistics Coordinator'
];

export const DEFAULT_THEME: AppTheme = {
  primaryColor: '#2563eb', // Blue-600
  radius: '0.5rem',
  name: 'Ocean Blue',
  mode: 'light'
};

export const THEME_PRESETS: AppTheme[] = [
  { primaryColor: '#2563eb', radius: '0.5rem', name: 'Ocean Blue', mode: 'light' },
  { primaryColor: '#7c3aed', radius: '0.75rem', name: 'Royal Purple', mode: 'light' },
  { primaryColor: '#059669', radius: '0.25rem', name: 'Emerald Green', mode: 'light' },
  { primaryColor: '#e11d48', radius: '1rem', name: 'Rose Red', mode: 'light' },
  { primaryColor: '#d97706', radius: '0.5rem', name: 'Sunset Amber', mode: 'light' },
  { primaryColor: '#475569', radius: '0rem', name: 'Slate Grey', mode: 'light' },
];
