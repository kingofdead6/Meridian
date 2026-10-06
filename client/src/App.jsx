import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import AppShell from './components/layout/AppShell';
import { EmptyState, Spinner } from './components/ui';
import Login from './pages/Login';
import SiteLayout from './site/SiteLayout';

const Home = lazy(() => import('./site/Home'));
const Features = lazy(() => import('./site/Features'));
const Pricing = lazy(() => import('./site/Pricing'));
const About = lazy(() => import('./site/About'));
const Contact = lazy(() => import('./site/Contact'));
const Guide = lazy(() => import('./site/Guide'));

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Assistant = lazy(() => import('./pages/Assistant'));
const Pipeline = lazy(() => import('./pages/Pipeline'));
const Contacts = lazy(() => import('./pages/Contacts'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const Invoices = lazy(() => import('./pages/Invoices'));
const InvoiceDetail = lazy(() => import('./pages/InvoiceDetail'));
const Products = lazy(() => import('./pages/Products'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Warehouses = lazy(() => import('./pages/Warehouses'));
const Payments = lazy(() => import('./pages/Payments'));
const Accounts = lazy(() => import('./pages/Accounts'));
const AccountLedger = lazy(() => import('./pages/AccountLedger'));
const Journal = lazy(() => import('./pages/Journal'));
const Reports = lazy(() => import('./pages/Reports'));
const Employees = lazy(() => import('./pages/Employees'));
const Departments = lazy(() => import('./pages/Departments'));
const Leaves = lazy(() => import('./pages/Leaves'));
const Payroll = lazy(() => import('./pages/Payroll'));
const PayrollDetail = lazy(() => import('./pages/PayrollDetail'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const Settings = lazy(() => import('./pages/Settings'));
const AuditLog = lazy(() => import('./pages/AuditLog'));

function Guard({ module, children }) {
  const { can } = useAuth();
  if (module && !can(module)) {
    return <EmptyState icon={ShieldOff} title="This area isn't part of your role">Ask an administrator if you need access.</EmptyState>;
  }
  return children;
}

const routes = [
  ['/', Dashboard],
  ['/assistant', Assistant],
  ['/crm', Pipeline, 'crm'],
  ['/contacts', Contacts, ['crm', 'sales', 'purchasing', 'accounting']],
  ['/sales/orders', () => <Orders kind="sale" />, 'sales'],
  ['/sales/orders/:id', () => <OrderDetail kind="sale" />, 'sales'],
  ['/sales/invoices', () => <Invoices kind="customer" />, ['sales', 'accounting']],
  ['/sales/invoices/:id', () => <InvoiceDetail kind="customer" />, ['sales', 'accounting']],
  ['/purchases/orders', () => <Orders kind="purchase" />, 'purchasing'],
  ['/purchases/orders/:id', () => <OrderDetail kind="purchase" />, 'purchasing'],
  ['/purchases/bills', () => <Invoices kind="supplier" />, ['purchasing', 'accounting']],
  ['/purchases/bills/:id', () => <InvoiceDetail kind="supplier" />, ['purchasing', 'accounting']],
  ['/products', Products, ['inventory', 'sales', 'purchasing']],
  ['/inventory', Inventory, 'inventory'],
  ['/warehouses', Warehouses, 'inventory'],
  ['/payments', Payments, 'accounting'],
  ['/accounting/accounts', Accounts, ['accounting', 'reports']],
  ['/accounting/accounts/:id', AccountLedger, ['accounting', 'reports']],
  ['/accounting/journal', Journal, ['accounting', 'reports']],
  ['/reports', Reports, ['accounting', 'reports']],
  ['/hr/employees', Employees, 'hr'],
  ['/hr/departments', Departments, 'hr'],
  ['/hr/leave', Leaves, 'hr'],
  ['/hr/payroll', Payroll, ['hr', 'accounting']],
  ['/hr/payroll/:id', PayrollDetail, ['hr', 'accounting']],
  ['/projects', Projects, 'projects'],
  ['/projects/:id', ProjectDetail, 'projects'],
  ['/settings', Settings, 'settings'],
  ['/audit', AuditLog, 'settings'],
];

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><Spinner /></div>;
  }

  // Marketing pages stay reachable when signed in; the home page gives way to the dashboard.
  const site = (
    <Route element={<SiteLayout />}>
      {!user && <Route path="/" element={<Home />} />}
      <Route path="/features" element={<Features />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/guide" element={<Guide />} />
    </Route>
  );

  if (!user) {
    return (
      <Routes>
        {site}
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {site}
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route element={<AppShell />}>
        {routes.map(([path, Component, module]) => (
          <Route key={path} path={path} element={
            <Guard module={module}>
              <Suspense fallback={<div className="flex justify-center py-24"><Spinner /></div>}>
                <Component />
              </Suspense>
            </Guard>
          } />
        ))}
        <Route path="*" element={<EmptyState title="Page not found">The link may be broken or the record was removed.</EmptyState>} />
      </Route>
    </Routes>
  );
}
