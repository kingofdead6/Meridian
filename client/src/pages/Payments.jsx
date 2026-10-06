import { useNavigate } from 'react-router-dom';
import ResourcePage from '../components/ResourcePage';
import { Badge } from '../components/ui';
import { date, money, titleCase } from '../lib/format';

export default function Payments() {
  const navigate = useNavigate();
  return (
    <ResourcePage
      title="Payments"
      description="Money received from customers and paid to suppliers. Record payments from an invoice or bill."
      resource="payments"
      entity="Payment"
      module="accounting"
      actions={null}
      searchPlaceholder="Search by number or reference"
      filters={[
        { name: 'kind', label: 'In and out', options: [{ value: 'in', label: 'Received' }, { value: 'out', label: 'Paid out' }] },
        { name: 'method', label: 'Any method', options: ['bank_transfer', 'card', 'cash', 'check', 'other'].map((m) => ({ value: m, label: titleCase(m) })) },
      ]}
      onRowClick={(r) => r.invoice && navigate(`${r.invoice.kind === 'customer' ? '/sales/invoices' : '/purchases/bills'}/${r.invoice._id}`)}
      columns={[
        { key: 'number', label: 'Number', render: (r) => <span className="font-medium">{r.number}</span> },
        { key: 'date', label: 'Date', render: (r) => date(r.date) },
        { key: 'contact', label: 'Contact', render: (r) => r.contact?.name || '—' },
        { key: 'invoice', label: 'For', render: (r) => <span className="text-muted">{r.invoice?.number}</span> },
        { key: 'method', label: 'Method', render: (r) => titleCase(r.method) },
        { key: 'account', label: 'Account', render: (r) => <span className="text-muted">{r.account?.name}</span> },
        { key: 'amount', label: 'Amount', align: 'right', render: (r) => (
          <span className="inline-flex items-center gap-2 font-medium">
            <Badge tone={r.kind === 'in' ? 'green' : 'blue'} dot={false}>{r.kind === 'in' ? 'In' : 'Out'}</Badge>{money(r.amount)}
          </span>) },
      ]}
    />
  );
}
