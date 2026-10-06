import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import ResourcePage from '../components/ResourcePage';
import { Badge, Button, StatusBadge } from '../components/ui';
import { date, isOverdue, money } from '../lib/format';

export default function Invoices({ kind }) {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const customer = kind === 'customer';
  const base = customer ? '/sales/invoices' : '/purchases/bills';
  const overdue = search.get('overdue') === 'true';

  return (
    <ResourcePage
      key={`${kind}-${overdue}`}
      title={overdue ? 'Overdue invoices' : customer ? 'Invoices' : 'Bills'}
      description={customer ? 'Bills you send to customers. Posting an invoice records the sale in the ledger.' : 'Bills from suppliers, including rent, utilities and stock.'}
      resource="invoices"
      entity={customer ? 'Invoice' : 'Bill'}
      module={customer ? 'sales' : 'purchasing'}
      params={overdue ? { kind, overdue: 'true' } : { kind }}
      searchPlaceholder="Search by number"
      actions={<Button variant="primary" icon={Plus} onClick={() => navigate(`${base}/new`)}>{customer ? 'New invoice' : 'New bill'}</Button>}
      filters={overdue ? [] : [{ name: 'status', label: 'All statuses', options: ['draft', 'posted', 'partial', 'paid', 'void'].map((s) => ({ value: s, label: { posted: 'Unpaid', partial: 'Part paid' }[s] || s[0].toUpperCase() + s.slice(1) })) }]}
      onRowClick={(r) => navigate(`${base}/${r._id}`)}
      columns={[
        { key: 'number', label: 'Number', render: (r) => <span className="font-medium">{r.number}</span> },
        { key: 'contact', label: customer ? 'Customer' : 'Supplier', render: (r) => r.contact?.name || '—' },
        { key: 'date', label: 'Issued', render: (r) => date(r.date) },
        { key: 'dueDate', label: 'Due', render: (r) => <span className={isOverdue(r) ? 'font-medium text-debit' : 'text-muted'}>{date(r.dueDate)}</span> },
        { key: 'status', label: 'Status', render: (r) => (isOverdue(r) ? <Badge tone="red">Overdue</Badge> : <StatusBadge status={r.status} label={{ posted: 'Unpaid', partial: 'Part paid' }[r.status]} />) },
        { key: 'total', label: 'Total', align: 'right', render: (r) => money(r.total) },
        { key: 'balance', label: 'Balance due', align: 'right', render: (r) => (['posted', 'partial'].includes(r.status) ? <span className="font-medium">{money(r.total - r.amountPaid)}</span> : <span className="text-faint">—</span>) },
      ]}
    />
  );
}
