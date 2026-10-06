import {
  LayoutGrid, Sparkles, Columns3, Users, FileText, Receipt, ShoppingCart, FileInput, Package, Boxes, Warehouse,
  Wallet, BookOpen, ScrollText, BarChart3, UserRound, Building2, CalendarDays, Banknote, FolderKanban, Settings, History,
} from 'lucide-react';

export const NAV = [
  { group: 'Overview', items: [
    { to: '/', label: 'Dashboard', icon: LayoutGrid },
    { to: '/assistant', label: 'Assistant', icon: Sparkles },
  ] },
  { group: 'Sell', items: [
    { to: '/crm', label: 'Pipeline', icon: Columns3, module: 'crm' },
    { to: '/contacts', label: 'Contacts', icon: Users, module: ['crm', 'sales', 'purchasing', 'accounting'] },
    { to: '/sales/orders', label: 'Sales orders', icon: FileText, module: 'sales' },
    { to: '/sales/invoices', label: 'Invoices', icon: Receipt, module: 'sales' },
  ] },
  { group: 'Buy', items: [
    { to: '/purchases/orders', label: 'Purchase orders', icon: ShoppingCart, module: 'purchasing' },
    { to: '/purchases/bills', label: 'Bills', icon: FileInput, module: 'purchasing' },
  ] },
  { group: 'Stock', items: [
    { to: '/products', label: 'Products', icon: Package, module: ['inventory', 'sales', 'purchasing'] },
    { to: '/inventory', label: 'Inventory', icon: Boxes, module: 'inventory' },
    { to: '/warehouses', label: 'Warehouses', icon: Warehouse, module: 'inventory' },
  ] },
  { group: 'Money', items: [
    { to: '/payments', label: 'Payments', icon: Wallet, module: 'accounting' },
    { to: '/accounting/accounts', label: 'Chart of accounts', icon: BookOpen, module: ['accounting', 'reports'] },
    { to: '/accounting/journal', label: 'Journal', icon: ScrollText, module: ['accounting', 'reports'] },
    { to: '/reports', label: 'Reports', icon: BarChart3, module: ['accounting', 'reports'] },
  ] },
  { group: 'People', items: [
    { to: '/hr/employees', label: 'Employees', icon: UserRound, module: 'hr' },
    { to: '/hr/departments', label: 'Departments', icon: Building2, module: 'hr' },
    { to: '/hr/leave', label: 'Leave', icon: CalendarDays, module: 'hr' },
    { to: '/hr/payroll', label: 'Payroll', icon: Banknote, module: ['hr', 'accounting'] },
  ] },
  { group: 'Work', items: [
    { to: '/projects', label: 'Projects', icon: FolderKanban, module: 'projects' },
  ] },
  { group: 'Admin', items: [
    { to: '/settings', label: 'Settings', icon: Settings, module: 'settings' },
    { to: '/audit', label: 'Audit log', icon: History, module: 'settings' },
  ] },
];

export const ROLE_LABELS = {
  admin: 'Administrator', manager: 'Manager', accountant: 'Accountant', sales: 'Sales', warehouse: 'Warehouse', hr: 'People & HR',
};
