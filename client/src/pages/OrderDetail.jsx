import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, FileText, PackageCheck, Save, Trash2, XCircle } from 'lucide-react';
import api from '../lib/api';
import { useAction, useOptions, useRecord } from '../lib/hooks';
import { date, inputDate, today } from '../lib/format';
import { Button, Field, Input, Select, Spinner, StatusBadge, Textarea } from '../components/ui';
import { Modal, useConfirm } from '../components/ui/Overlay';
import Stamp from '../components/ui/Stamp';
import Steps from '../components/Steps';
import LinesEditor, { blankLine, fromLines, toLines } from '../components/LinesEditor';
import { ORDER_LABELS } from './Orders';

const STEP_INDEX = { draft: 0, confirmed: 1, fulfilled: 2, invoiced: 3, cancelled: 0 };

export default function OrderDetail({ kind }) {
  const { id } = useParams();
  const isNew = id === 'new';
  const sale = kind === 'sale';
  const base = sale ? '/sales/orders' : '/purchases/orders';
  const navigate = useNavigate();
  const { data: order, isLoading } = useRecord(`orders/${id}`);
  const contacts = useOptions('contacts', { type: sale ? 'customer,both' : 'supplier,both', active: true });
  const warehouses = useOptions('warehouses');
  const [form, setForm] = useState(null);
  const [fulfilOpen, setFulfilOpen] = useState(false);
  const [fulfil, setFulfil] = useState({ warehouse: '', date: today() });
  const [confirm, dialog] = useConfirm();

  useEffect(() => {
    if (isNew) setForm({ contact: '', date: today(), expectedDate: '', warehouse: '', notes: '', lines: [blankLine()] });
    else if (order) {
      setForm({ contact: order.contact?._id || '', date: inputDate(order.date), expectedDate: inputDate(order.expectedDate), warehouse: order.warehouse?._id || '', notes: order.notes || '', lines: toLines(order.lines) });
      setFulfil({ warehouse: order.warehouse?._id || '', date: today() });
    }
  }, [order, isNew]);

  const status = isNew ? 'draft' : order?.status;
  const editable = status === 'draft';
  const labels = ORDER_LABELS[kind];
  const body = useMemo(() => form && ({
    kind, contact: form.contact || undefined, date: form.date, expectedDate: form.expectedDate || null,
    warehouse: form.warehouse || undefined, notes: form.notes, lines: fromLines(form.lines),
  }), [form, kind]);

  const save = useAction(() => (isNew ? api.post('/orders', body) : api.put(`/orders/${id}`, body)).then((r) => r.data), {
    success: 'Saved', onSuccess: (doc) => isNew && navigate(`${base}/${doc._id}`, { replace: true }),
  });
  const useOrderAction = (action, msg, payload) => useAction(() => api.post(`/orders/${id}/${action}`, payload?.()).then((r) => r.data), { success: msg });
  const confirmOrder = useAction(async () => { await api.put(`/orders/${id}`, body); return api.post(`/orders/${id}/confirm`); }, { success: sale ? 'Order confirmed' : 'Order placed' });
  const fulfill = useOrderAction('fulfill', sale ? 'Goods delivered and stock updated' : 'Goods received into stock', () => fulfil);
  const cancel = useOrderAction('cancel', 'Order cancelled');
  const invoice = useAction(() => api.post(`/orders/${id}/invoice`).then((r) => r.data), {
    success: sale ? 'Invoice drafted' : 'Bill drafted',
    onSuccess: (inv) => navigate(`${sale ? '/sales/invoices' : '/purchases/bills'}/${inv._id}`),
  });
  const remove = useAction(() => api.delete(`/orders/${id}`), { success: 'Order deleted', onSuccess: () => navigate(base) });

  if (!form || (!isNew && isLoading)) return <div className="flex justify-center py-24"><Spinner /></div>;

  const hasGoods = order?.lines?.some((l) => l.product?.type === 'goods');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <Link to={base} className="mb-3 inline-flex items-center gap-1.5 text-[13.5px] text-muted hover:text-graphite">
        <ArrowLeft className="size-4" /> {sale ? 'Sales orders' : 'Purchase orders'}
      </Link>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[26px] font-semibold text-ink">{isNew ? (sale ? 'New quotation' : 'New purchase order') : order.number}</h1>
          {!isNew && <StatusBadge status={status} label={labels[status]} />}
        </div>
        <div className="flex flex-wrap gap-2">
          {editable && !isNew && <Button variant="ghost" icon={Trash2} onClick={async () => (await confirm({ title: 'Delete this order?', message: 'The draft will be removed for good.', confirmLabel: 'Delete', danger: true })) && remove.mutate()}>Delete</Button>}
          {editable && <Button icon={Save} onClick={() => save.mutate()} loading={save.isPending}>{isNew ? 'Save draft' : 'Save'}</Button>}
          {editable && !isNew && <Button variant="primary" icon={Check} onClick={() => confirmOrder.mutate()} loading={confirmOrder.isPending}>{sale ? 'Confirm order' : 'Place order'}</Button>}
          {status === 'confirmed' && <Button variant="ghost" icon={XCircle} onClick={() => cancel.mutate()} loading={cancel.isPending}>Cancel order</Button>}
          {status === 'confirmed' && hasGoods && <Button variant="primary" icon={PackageCheck} onClick={() => setFulfilOpen(true)}>{sale ? 'Deliver goods' : 'Receive goods'}</Button>}
          {(status === 'fulfilled' || (status === 'confirmed' && !hasGoods)) && (
            <Button variant="primary" icon={FileText} onClick={() => invoice.mutate()} loading={invoice.isPending}>{sale ? 'Create invoice' : 'Enter bill'}</Button>
          )}
          {status === 'invoiced' && order.invoice && (
            <Button variant="ink" icon={FileText} onClick={() => navigate(`${sale ? '/sales/invoices' : '/purchases/bills'}/${order.invoice._id}`)}>Open {order.invoice.number}</Button>
          )}
        </div>
      </div>

      <div className="mb-5"><Steps steps={Object.values(labels).slice(0, 4)} current={STEP_INDEX[status]} cancelled={status === 'cancelled'} /></div>

      <div className="sheet relative p-5 sm:p-7">
        <div className="absolute right-6 top-5 hidden sm:block"><Stamp status={['invoiced', 'cancelled'].includes(status) ? status : null} /></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:pr-40">
          <Field label={sale ? 'Customer' : 'Supplier'}>
            <Select value={form.contact} onChange={set('contact')} disabled={!editable} required>
              <option value="">Choose…</option>
              {contacts.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Order date"><Input type="date" value={form.date} onChange={set('date')} disabled={!editable} /></Field>
          <Field label={sale ? 'Deliver by' : 'Expected on'}><Input type="date" value={form.expectedDate} onChange={set('expectedDate')} disabled={!editable} /></Field>
          <Field label="Warehouse">
            <Select value={form.warehouse} onChange={set('warehouse')} disabled={!editable}>
              <option value="">Default warehouse</option>
              {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
            </Select>
          </Field>
        </div>

        <div className="mt-7">
          <LinesEditor lines={form.lines} onChange={(lines) => setForm((f) => ({ ...f, lines }))} readOnly={!editable} priceField={sale ? 'salePrice' : 'purchasePrice'} />
        </div>

        <Field label="Notes" className="mt-6 max-w-xl">
          <Textarea value={form.notes} onChange={set('notes')} disabled={!editable} placeholder={sale ? 'Visible on the quotation' : 'Instructions for the supplier'} />
        </Field>
        {order?.fulfilledAt && <p className="mt-4 text-[13px] text-muted">{sale ? 'Delivered' : 'Received'} on {date(order.fulfilledAt)} into {order.warehouse?.name}.</p>}
      </div>

      <Modal open={fulfilOpen} onClose={() => setFulfilOpen(false)} title={sale ? 'Deliver goods' : 'Receive goods'}
        footer={<>
          <Button onClick={() => setFulfilOpen(false)}>Cancel</Button>
          <Button variant="primary" loading={fulfill.isPending} onClick={() => fulfill.mutate(undefined, { onSuccess: () => setFulfilOpen(false) })}>{sale ? 'Deliver' : 'Receive'}</Button>
        </>}>
        <p className="mb-4 text-muted">{sale ? 'Stock leaves the warehouse at its average cost, and cost of goods sold is posted.' : 'Stock enters the warehouse at the order price and updates the average cost.'}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Warehouse">
            <Select value={fulfil.warehouse} onChange={(e) => setFulfil((f) => ({ ...f, warehouse: e.target.value }))}>
              {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
            </Select>
          </Field>
          <Field label="Date"><Input type="date" value={fulfil.date} onChange={(e) => setFulfil((f) => ({ ...f, date: e.target.value }))} /></Field>
        </div>
      </Modal>
      {dialog}
    </div>
  );
}
