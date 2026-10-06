import {
  BarChart3, Banknote, Boxes, Building2, CalendarDays, Columns3, FileText, FolderKanban, KeyRound, Package, Receipt,
  ScrollText, Settings, ShoppingCart, Sparkles, UserRound, Users, Wallet, Warehouse,
} from 'lucide-react';

/**
 * Everything a new user needs before the system is useful, in the order to do it.
 * `module` decides who can act on a step; `admin` steps belong to whoever runs Settings.
 */
export const SETUP = [
  { icon: Settings, title: 'Company details, currency and tax', to: '/settings', module: 'settings',
    text: 'Set the company name, address and currency, the tax rates you charge, default payment terms and the note printed on invoices.' },
  { icon: KeyRound, title: 'Invite your team', to: '/settings', module: 'settings',
    text: 'Under Settings → Users and roles, add each person with a role. The role decides which modules they can open.' },
  { icon: Warehouse, title: 'Warehouses', to: '/warehouses', module: 'inventory',
    text: 'One warehouse is created for you. Add more if you keep stock in several places.' },
  { icon: Package, title: 'Products and services', to: '/products', module: ['inventory', 'sales', 'purchasing'],
    text: 'Add what you sell and buy with its sale price, cost and reorder level. Goods track stock; services do not.' },
  { icon: Users, title: 'Customers and suppliers', to: '/contacts', module: ['crm', 'sales', 'purchasing', 'accounting'],
    text: 'Add the companies you sell to and buy from, with their email and payment terms.' },
  { icon: UserRound, title: 'Employees and departments', to: '/hr/employees', module: 'hr',
    text: 'Add departments, then employees with their salary. Payroll uses these figures.' },
  { icon: ScrollText, title: 'Opening balances (optional)', to: '/accounting/journal', module: 'accounting',
    text: 'If you are moving from another system, record bank, receivable and payable balances with one manual journal entry.' },
];

/** The life of a sale. Purchases follow the same path with receipts and bills. */
export const FLOW = [
  { status: 'Draft', text: 'Create the order. Nothing has happened yet; you can still edit or delete it.' },
  { status: 'Confirmed', text: 'The customer agreed. The order is locked and ready to ship.' },
  { status: 'Fulfilled', text: 'Goods leave the warehouse. Stock goes down and the cost of goods is booked.' },
  { status: 'Invoiced', text: 'An invoice is created from the order and posted: the sale and tax hit the ledger.' },
  { status: 'Paid', text: 'Record the payment. The invoice closes and the money lands in the bank account.' },
];

export const RULES = [
  'Posted documents are never edited. Void an invoice or reverse a manual journal entry instead, so the history stays honest.',
  'Every posted document writes its own balanced journal entry. You do not need to touch the journal for daily work.',
  'Every change is recorded in the audit log with who made it and when.',
];

/** What each role does day to day. Paths must exist in App.jsx. */
export const ROLE_GUIDE = {
  admin: {
    focus: 'You set up the company and decide who can do what. You can open every module.',
    tasks: [
      { icon: Settings, label: 'Settings', to: '/settings', text: 'Company details, tax rates, payroll deductions, users and roles.' },
      { icon: BarChart3, label: 'Reports', to: '/reports', text: 'Profit and loss, balance sheet and trial balance.' },
      { icon: Package, label: 'Products', to: '/products', text: 'Keep prices, costs and reorder levels current.' },
      { icon: ScrollText, label: 'Audit log', to: '/audit', text: 'See who changed what, and when.' },
    ],
  },
  manager: {
    focus: 'You follow sales, stock, people and projects, and read the reports.',
    tasks: [
      { icon: BarChart3, label: 'Reports', to: '/reports', text: 'Profit and loss, balance sheet and trial balance.' },
      { icon: Columns3, label: 'Pipeline', to: '/crm', text: 'Open deals by stage and their value.' },
      { icon: FileText, label: 'Sales orders', to: '/sales/orders', text: 'What has been sold and what is still to ship.' },
      { icon: FolderKanban, label: 'Projects', to: '/projects', text: 'Boards, tasks and deadlines for the team.' },
    ],
  },
  accountant: {
    focus: 'You post invoices and bills, record payments and close the month.',
    tasks: [
      { icon: Receipt, label: 'Invoices and bills', to: '/sales/invoices', text: 'Check drafts and post them to the ledger. Void mistakes.' },
      { icon: Wallet, label: 'Payments', to: '/payments', text: 'Record money in and out against open invoices and bills.' },
      { icon: ScrollText, label: 'Journal', to: '/accounting/journal', text: 'Manual entries, accruals and reversals.' },
      { icon: BarChart3, label: 'Reports', to: '/reports', text: 'Trial balance, profit and loss, balance sheet.' },
    ],
  },
  sales: {
    focus: 'You work leads, take orders and invoice customers.',
    tasks: [
      { icon: Columns3, label: 'Pipeline', to: '/crm', text: 'Drag leads from New to Won as deals progress.' },
      { icon: Users, label: 'Contacts', to: '/contacts', text: 'Customers with their details and history.' },
      { icon: FileText, label: 'Sales orders', to: '/sales/orders', text: 'Create, confirm, fulfil and invoice orders.' },
      { icon: Receipt, label: 'Invoices', to: '/sales/invoices', text: 'Send invoices and follow what is overdue.' },
    ],
  },
  warehouse: {
    focus: 'You keep stock accurate, receive purchases and ship orders.',
    tasks: [
      { icon: Boxes, label: 'Inventory', to: '/inventory', text: 'Stock per warehouse, adjustments after counts, and transfers.' },
      { icon: ShoppingCart, label: 'Purchase orders', to: '/purchases/orders', text: 'Order from suppliers and receive the goods.' },
      { icon: Package, label: 'Products', to: '/products', text: 'Reorder levels tell you what to buy next.' },
      { icon: Warehouse, label: 'Warehouses', to: '/warehouses', text: 'The places you keep stock.' },
    ],
  },
  hr: {
    focus: 'You look after employee records, leave and payroll.',
    tasks: [
      { icon: UserRound, label: 'Employees', to: '/hr/employees', text: 'Records, salaries and status.' },
      { icon: Building2, label: 'Departments', to: '/hr/departments', text: 'How the team is organised.' },
      { icon: CalendarDays, label: 'Leave', to: '/hr/leave', text: 'Approve or reject requests.' },
      { icon: Banknote, label: 'Payroll', to: '/hr/payroll', text: 'Generate a monthly run, check it, then post it to the books.' },
    ],
  },
};

export const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], text: 'Search records and jump to any page' },
  { keys: ['Esc'], text: 'Close a drawer, dialog or search' },
];

export const ASSISTANT = { icon: Sparkles, text: 'Ask questions about your numbers in plain language, such as "Who owes us the most?"' };

/** Problems people hit in their first week. */
export const TROUBLESHOOTING = [
  ['I cannot see a module in the sidebar.', 'Your role does not include it. An administrator can change your role under Settings → Users and roles.'],
  ['I cannot edit an invoice.', 'Only drafts can be edited. Once posted, void it and create a new one, so the ledger keeps a record of both.'],
  ['An order will not confirm or fulfil.', 'Check that every line has a product and quantity, and that the warehouse holds enough stock to ship it.'],
  ['The assistant says it is not configured.', 'The server needs an AI key. Whoever runs the server adds AI_API_KEY (and optionally AI_MODEL) to its .env file.'],
  ['The numbers on the dashboard look wrong.', 'Only posted documents count. Drafts and confirmed orders do not move the ledger until they are posted or fulfilled.'],
];
