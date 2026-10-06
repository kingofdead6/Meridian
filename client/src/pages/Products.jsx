import ResourcePage from '../components/ResourcePage';
import { Badge, StatusBadge } from '../components/ui';
import { money, number } from '../lib/format';
import { useAuth } from '../context/AuthContext';

export default function Products() {
  const { company } = useAuth();
  const fields = [
    { name: 'image', label: 'Photo', type: 'image', folder: 'products' },
    { name: 'name', label: 'Name', required: true },
    { name: 'sku', label: 'SKU', required: true, hint: 'Unique code, stored in capitals' },
    { name: 'type', label: 'Type', type: 'select', required: true, options: [{ value: 'goods', label: 'Goods — tracked in stock' }, { value: 'service', label: 'Service — no stock' }] },
    { name: 'category', label: 'Category' },
    { name: 'salePrice', label: 'Sale price', type: 'money' },
    { name: 'purchasePrice', label: 'Purchase price', type: 'money' },
    { name: 'taxRate', label: 'Tax rate', type: 'select', required: true, options: (company?.taxRates || []).map((t) => ({ value: t.rate, label: `${t.name} ${t.rate}%` })) },
    { name: 'unit', label: 'Unit', placeholder: 'pcs, box, hour' },
    { name: 'reorderLevel', label: 'Reorder at', type: 'number', hint: 'Flags the product as low when stock falls to this level', hidden: (v) => v.type === 'service' },
    { name: 'barcode', label: 'Barcode' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'active', type: 'checkbox', checkboxLabel: 'Active — can be added to new documents' },
  ];

  return (
    <ResourcePage
      title="Products"
      description="Goods you stock and services you sell. Cost is the running weighted average of what you paid."
      resource="products"
      entity="Product"
      module="inventory"
      searchPlaceholder="Search by name, SKU or category"
      defaults={{ type: 'goods', unit: 'pcs', taxRate: company?.taxRates?.[0]?.rate ?? 0, active: true, category: 'General' }}
      filters={[{ name: 'type', label: 'Goods and services', options: [{ value: 'goods', label: 'Goods' }, { value: 'service', label: 'Services' }] }]}
      fields={fields}
      columns={[
        { key: 'name', label: 'Product', render: (r) => (
          <div className="flex items-center gap-3">
            {r.image?.url ? <img src={r.image.url} alt="" className="size-10 rounded-lg object-cover" /> : <span className="flex size-10 items-center justify-center rounded-lg bg-paper text-[12px] font-semibold text-faint">{r.sku.slice(0, 3)}</span>}
            <div><p className="font-medium">{r.name}</p><p className="text-[12.5px] text-muted">{r.sku}</p></div>
          </div>) },
        { key: 'category', label: 'Category', render: (r) => <span className="text-muted">{r.category}</span> },
        { key: 'type', label: 'Type', render: (r) => <StatusBadge status={r.type} /> },
        { key: 'salePrice', label: 'Price', align: 'right', render: (r) => money(r.salePrice) },
        { key: 'avgCost', label: 'Avg. cost', align: 'right', render: (r) => (r.type === 'goods' ? <span className="text-muted">{money(r.avgCost)}</span> : '—') },
        { key: 'stock', label: 'In stock', align: 'right', render: (r) => {
          if (r.type !== 'goods') return <span className="text-faint">—</span>;
          const low = r.stock <= r.reorderLevel;
          return low ? <Badge tone={r.stock <= 0 ? 'red' : 'amber'}>{number(r.stock)} {r.unit}</Badge> : <span className="font-medium">{number(r.stock)} <span className="font-normal text-muted">{r.unit}</span></span>;
        } },
      ]}
    />
  );
}
