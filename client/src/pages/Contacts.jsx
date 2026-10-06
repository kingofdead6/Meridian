import ResourcePage from '../components/ResourcePage';
import { StatusBadge } from '../components/ui';
import { money } from '../lib/format';

const FIELDS = [
  { name: 'name', label: 'Name', required: true, span: 'full' },
  { name: 'type', label: 'Relationship', type: 'select', required: true, options: [{ value: 'customer', label: 'Customer' }, { value: 'supplier', label: 'Supplier' }, { value: 'both', label: 'Customer and supplier' }] },
  { name: 'contactPerson', label: 'Contact person' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'phone', label: 'Phone' },
  { name: 'taxId', label: 'Tax ID' },
  { name: 'paymentTermsDays', label: 'Payment terms (days)', type: 'number', hint: 'Leave empty to use the company default' },
  { name: 'address', label: 'Address', span: 'full' },
  { name: 'city', label: 'City' },
  { name: 'country', label: 'Country' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
  { name: 'active', type: 'checkbox', checkboxLabel: 'Active — appears in pickers on new documents' },
];

const owed = (v, tone) => (v ? <span className={tone}>{money(v)}</span> : <span className="text-faint">—</span>);

export default function Contacts() {
  return (
    <ResourcePage
      title="Contacts"
      description="Customers and suppliers, with what is still open on their account."
      resource="contacts"
      entity="Contact"
      module={['crm', 'sales', 'purchasing']}
      searchPlaceholder="Search by name, email or city"
      defaults={{ type: 'customer', active: true }}
      filters={[{ name: 'type', label: 'All contacts', options: [{ value: 'customer', label: 'Customers' }, { value: 'supplier', label: 'Suppliers' }, { value: 'both', label: 'Both' }] }]}
      fields={FIELDS}
      columns={[
        { key: 'name', label: 'Name', render: (r) => <div><p className="font-medium">{r.name}</p>{r.contactPerson && <p className="text-[12.5px] text-muted">{r.contactPerson}</p>}</div> },
        { key: 'type', label: 'Relationship', render: (r) => <StatusBadge status={r.type} /> },
        { key: 'email', label: 'Email', render: (r) => <span className="text-muted">{r.email || '—'}</span> },
        { key: 'city', label: 'City', render: (r) => r.city || '—' },
        { key: 'receivable', label: 'Owes us', align: 'right', render: (r) => owed(r.receivable, 'text-ledger font-medium') },
        { key: 'payable', label: 'We owe', align: 'right', render: (r) => owed(r.payable, 'font-medium') },
      ]}
    />
  );
}
