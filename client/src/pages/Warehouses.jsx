import ResourcePage from '../components/ResourcePage';
import { Badge } from '../components/ui';

export default function Warehouses() {
  return (
    <ResourcePage
      title="Warehouses"
      description="Places where stock is kept. The default warehouse is used when a document doesn't name one."
      resource="warehouses"
      entity="Warehouse"
      module="inventory"
      fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'code', label: 'Code', required: true, hint: 'Short code, e.g. MAIN' },
        { name: 'address', label: 'Address', span: 'full' },
        { name: 'isDefault', type: 'checkbox', checkboxLabel: 'Use as the default warehouse' },
      ]}
      columns={[
        { key: 'name', label: 'Name', render: (r) => <span className="font-medium">{r.name}</span> },
        { key: 'code', label: 'Code', render: (r) => <span className="text-muted">{r.code}</span> },
        { key: 'address', label: 'Address', render: (r) => r.address || '—' },
        { key: 'isDefault', label: '', align: 'right', render: (r) => r.isDefault && <Badge tone="green">Default</Badge> },
      ]}
    />
  );
}
