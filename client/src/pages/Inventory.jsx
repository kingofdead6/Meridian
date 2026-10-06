import { useState } from 'react';
import { ArrowLeftRight, Search, SlidersHorizontal } from 'lucide-react';
import api from '../lib/api';
import { useAction, useDebounced, useList, useOptions } from '../lib/hooks';
import { date, money, number, titleCase } from '../lib/format';
import { Badge, Button, Field, Input, PageHeader, Select, Tabs } from '../components/ui';
import DataTable from '../components/ui/DataTable';
import { Modal } from '../components/ui/Overlay';

const MOVE_TONE = { receipt: 'green', delivery: 'blue', adjustment: 'amber', transfer_in: 'neutral', transfer_out: 'neutral', reversal: 'red' };

export default function Inventory() {
  const [tab, setTab] = useState('levels');
  const [q, setQ] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // 'adjust' | 'transfer'
  const [form, setForm] = useState({});
  const term = useDebounced(q);
  const warehouses = useOptions('warehouses');
  const products = useOptions('products', { type: 'goods' });

  const levels = useList('inventory/levels', { q: term, warehouse }, { enabled: tab === 'levels' });
  const moves = useList('inventory/moves', { warehouse, page, limit: 30 }, { enabled: tab === 'moves' });

  const adjust = useAction(() => api.post('/inventory/adjust', form), { success: 'Stock adjusted', onSuccess: () => setModal(null) });
  const transfer = useAction(() => api.post('/inventory/transfer', form), { success: 'Stock transferred', onSuccess: () => setModal(null) });

  const open = (type) => {
    setForm({ product: products[0]?._id, warehouse: warehouses.find((w) => w.isDefault)?._id, from: warehouses[0]?._id, to: warehouses[1]?._id, quantity: '', reason: '' });
    setModal(type);
  };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <PageHeader title="Inventory" description={`Stock on hand is worth ${money(levels.data?.totalValue || 0)} at average cost.`}
        actions={<>
          <Button icon={ArrowLeftRight} onClick={() => open('transfer')}>Transfer</Button>
          <Button variant="primary" icon={SlidersHorizontal} onClick={() => open('adjust')}>Adjust stock</Button>
        </>} />

      <Tabs className="mb-4" value={tab} onChange={(t) => { setTab(t); setPage(1); }} tabs={[{ value: 'levels', label: 'Stock on hand' }, { value: 'moves', label: 'Movements' }]} />

      <div className="mb-4 flex flex-wrap gap-2">
        {tab === 'levels' && (
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search product or SKU" className="pl-9" aria-label="Search" />
          </div>
        )}
        <Select value={warehouse} onChange={(e) => { setWarehouse(e.target.value); setPage(1); }} className="w-auto min-w-[180px]" aria-label="Warehouse">
          <option value="">All warehouses</option>
          {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
        </Select>
      </div>

      {tab === 'levels' ? (
        <DataTable loading={levels.isLoading} rows={levels.data?.data || []} columns={[
          { key: 'product', label: 'Product', render: (r) => <div><p className="font-medium">{r.product.name}</p><p className="text-[12.5px] text-muted">{r.product.sku}</p></div> },
          { key: 'warehouse', label: 'Warehouse', render: (r) => r.warehouse?.name },
          { key: 'quantity', label: 'On hand', align: 'right', render: (r) => {
            const low = r.quantity <= r.product.reorderLevel;
            return <span className={low ? (r.quantity <= 0 ? 'font-semibold text-debit' : 'font-semibold text-amber') : 'font-medium'}>{number(r.quantity)} <span className="font-normal text-muted">{r.product.unit}</span></span>;
          } },
          { key: 'cost', label: 'Avg. cost', align: 'right', render: (r) => <span className="text-muted">{money(r.product.avgCost)}</span> },
          { key: 'value', label: 'Value', align: 'right', render: (r) => <span className="font-medium">{money(r.value)}</span> },
        ]} />
      ) : (
        <DataTable loading={moves.isLoading} rows={moves.data?.data || []} page={moves.data?.page} pages={moves.data?.pages} total={moves.data?.total} onPage={setPage} dense columns={[
          { key: 'date', label: 'Date', render: (r) => date(r.date) },
          { key: 'product', label: 'Product', render: (r) => <span className="font-medium">{r.product?.name}</span> },
          { key: 'warehouse', label: 'Warehouse', render: (r) => <span className="text-muted">{r.warehouse?.code}</span> },
          { key: 'type', label: 'Movement', render: (r) => <Badge tone={MOVE_TONE[r.type]}>{titleCase(r.type)}</Badge> },
          { key: 'reference', label: 'Reference', render: (r) => <span className="text-muted">{r.reference || r.note || '—'}</span> },
          { key: 'quantity', label: 'Quantity', align: 'right', render: (r) => <span className={r.quantity > 0 ? 'font-medium text-ledger' : 'font-medium'}>{r.quantity > 0 ? '+' : ''}{number(r.quantity, 2)}</span> },
          { key: 'unitCost', label: 'Unit cost', align: 'right', render: (r) => <span className="text-muted">{money(r.unitCost)}</span> },
        ]} />
      )}

      <Modal open={Boolean(modal)} onClose={() => setModal(null)} title={modal === 'adjust' ? 'Adjust stock' : 'Transfer between warehouses'}
        footer={<>
          <Button onClick={() => setModal(null)}>Cancel</Button>
          <Button variant="primary" loading={adjust.isPending || transfer.isPending} onClick={() => (modal === 'adjust' ? adjust : transfer).mutate()}>
            {modal === 'adjust' ? 'Adjust stock' : 'Transfer stock'}
          </Button>
        </>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Product" className="sm:col-span-2">
            <Select value={form.product || ''} onChange={set('product')}>
              {products.map((p) => <option key={p._id} value={p._id}>{p.name} · {number(p.stock)} {p.unit} in total</option>)}
            </Select>
          </Field>
          {modal === 'adjust' ? (
            <>
              <Field label="Warehouse">
                <Select value={form.warehouse || ''} onChange={set('warehouse')}>{warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}</Select>
              </Field>
              <Field label="Change in quantity" hint="Negative to remove, e.g. −2"><Input type="number" className="num" value={form.quantity} onChange={set('quantity')} /></Field>
              <Field label="Reason" className="sm:col-span-2"><Input value={form.reason} onChange={set('reason')} placeholder="Damaged, count correction, sample…" /></Field>
              <p className="text-[13px] text-muted sm:col-span-2">The value of the change is posted against the inventory adjustments account.</p>
            </>
          ) : (
            <>
              <Field label="From"><Select value={form.from || ''} onChange={set('from')}>{warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}</Select></Field>
              <Field label="To"><Select value={form.to || ''} onChange={set('to')}>{warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}</Select></Field>
              <Field label="Quantity"><Input type="number" min="0" className="num" value={form.quantity} onChange={set('quantity')} /></Field>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
