import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import ResourcePage from '../components/ResourcePage';
import { Button, StatusBadge } from '../components/ui';
import { date, money } from '../lib/format';

export const ORDER_LABELS = {
  sale: { draft: 'Quotation', confirmed: 'Confirmed', fulfilled: 'Delivered', invoiced: 'Invoiced', cancelled: 'Cancelled' },
  purchase: { draft: 'Draft', confirmed: 'Ordered', fulfilled: 'Received', invoiced: 'Billed', cancelled: 'Cancelled' },
};

export default function Orders({ kind }) {
  const navigate = useNavigate();
  const sale = kind === 'sale';
  const base = sale ? '/sales/orders' : '/purchases/orders';
  const labels = ORDER_LABELS[kind];

  return (
    <ResourcePage
      key={kind}
      title={sale ? 'Sales orders' : 'Purchase orders'}
      description={sale ? 'Quotations and orders from quote to delivery to invoice.' : 'What you have ordered from suppliers, from order to receipt to bill.'}
      resource="orders"
      entity="Order"
      module={sale ? 'sales' : 'purchasing'}
      params={{ kind }}
      searchPlaceholder="Search by number"
      actions={<Button variant="primary" icon={Plus} onClick={() => navigate(`${base}/new`)}>{sale ? 'New quotation' : 'New purchase order'}</Button>}
      filters={[{ name: 'status', label: 'All statuses', options: Object.entries(labels).map(([value, label]) => ({ value, label })) }]}
      onRowClick={(r) => navigate(`${base}/${r._id}`)}
      columns={[
        { key: 'number', label: 'Number', render: (r) => <span className="font-medium">{r.number}</span> },
        { key: 'contact', label: sale ? 'Customer' : 'Supplier', render: (r) => r.contact?.name || '—' },
        { key: 'date', label: 'Date', render: (r) => date(r.date) },
        { key: 'expectedDate', label: sale ? 'Delivery by' : 'Expected', render: (r) => <span className="text-muted">{date(r.expectedDate)}</span> },
        { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} label={labels[r.status]} /> },
        { key: 'total', label: 'Total', align: 'right', render: (r) => <span className="font-medium">{money(r.total)}</span> },
      ]}
    />
  );
}
