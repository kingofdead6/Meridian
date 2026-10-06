import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Ban, FileDown, Paperclip, Save, Send, Trash2, Wallet, X } from 'lucide-react';
import api, { errorMessage, openPdf, uploadFile } from '../lib/api';
import { useAction, useOptions, useRecord } from '../lib/hooks';
import { date, inputDate, isOverdue, money, titleCase, today } from '../lib/format';
import { Badge, Button, Field, Input, Panel, Select, Spinner, StatusBadge, Textarea } from '../components/ui';
import { Modal, useConfirm } from '../components/ui/Overlay';
import Stamp from '../components/ui/Stamp';
import LinesEditor, { blankLine, fromLines, toLines } from '../components/LinesEditor';

const METHODS = ['bank_transfer', 'card', 'cash', 'check', 'other'];

export default function InvoiceDetail({ kind }) {
  const { id } = useParams();
  const isNew = id === 'new';
  const customer = kind === 'customer';
  const base = customer ? '/sales/invoices' : '/purchases/bills';
  const noun = customer ? 'invoice' : 'bill';
  const navigate = useNavigate();
  const { data: inv, isLoading } = useRecord(`invoices/${id}`);
  const contacts = useOptions('contacts', { type: customer ? 'customer,both' : 'supplier,both', active: true });
  const cashAccounts = useOptions('accounts/cash');
  const [form, setForm] = useState(null);
  const [payOpen, setPayOpen] = useState(false);
  const [pay, setPay] = useState({});
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef(null);
  const [confirm, dialog] = useConfirm();

  useEffect(() => {
    if (isNew) setForm({ contact: '', date: today(), dueDate: '', supplierReference: '', notes: '', lines: [blankLine()] });
    else if (inv) setForm({ contact: inv.contact?._id || '', date: inputDate(inv.date), dueDate: inputDate(inv.dueDate), supplierReference: inv.supplierReference || '', notes: inv.notes || '', lines: toLines(inv.lines) });
  }, [inv, isNew]);

  const status = isNew ? 'draft' : inv?.status;
  const editable = status === 'draft';
  const body = useMemo(() => form && Object.fromEntries(Object.entries({
    kind, contact: form.contact, date: form.date, dueDate: form.dueDate, supplierReference: form.supplierReference, notes: form.notes, lines: fromLines(form.lines),
  }).filter(([, v]) => v !== '')), [form, kind]);

  const save = useAction(() => (isNew ? api.post('/invoices', body) : api.put(`/invoices/${id}`, body)).then((r) => r.data), {
    success: 'Draft saved', onSuccess: (doc) => isNew && navigate(`${base}/${doc._id}`, { replace: true }),
  });
  const post = useAction(async () => { await api.put(`/invoices/${id}`, body); return api.post(`/invoices/${id}/post`); }, { success: `${titleCase(noun)} posted to the ledger` });
  const voidIt = useAction(() => api.post(`/invoices/${id}/void`), { success: `${titleCase(noun)} voided and reversed` });
  const remove = useAction(() => api.delete(`/invoices/${id}`), { success: 'Draft deleted', onSuccess: () => navigate(base) });
  const recordPayment = useAction(() => api.post('/payments', { ...pay, invoice: id }), { success: 'Payment recorded', onSuccess: () => setPayOpen(false) });
  const saveAttachments = useAction((attachments) => api.put(`/invoices/${id}`, { attachments }), { success: 'Attachments updated' });

  if (!form || (!isNew && isLoading)) return <div className="flex justify-center py-24"><Spinner /></div>;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const openPay = () => {
    setPay({ amount: inv.balanceDue, date: today(), method: 'bank_transfer', account: cashAccounts.find((a) => a.code === '1010')?._id || cashAccounts[0]?._id, reference: '' });
    setPayOpen(true);
  };
  const attach = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const asset = await uploadFile(file, 'documents');
      saveAttachments.mutate([...(inv.attachments || []), asset]);
    } catch (e) { toast.error(errorMessage(e)); } finally { setUploading(false); fileInput.current.value = ''; }
  };
  const overdue = isOverdue(inv);

  return (
    <div>
      <Link to={base} className="mb-3 inline-flex items-center gap-1.5 text-[13.5px] text-muted hover:text-graphite">
        <ArrowLeft className="size-4" /> {customer ? 'Invoices' : 'Bills'}
      </Link>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[26px] font-semibold text-ink">{isNew ? `New ${noun}` : inv.number}</h1>
          {!isNew && (overdue ? <Badge tone="red">Overdue</Badge> : <StatusBadge status={status} label={{ posted: 'Unpaid', partial: 'Part paid' }[status]} />)}
        </div>
        <div className="flex flex-wrap gap-2">
          {editable && !isNew && <Button variant="ghost" icon={Trash2} onClick={async () => (await confirm({ title: `Delete this draft ${noun}?`, message: 'Drafts have not touched the ledger, so nothing else changes.', confirmLabel: 'Delete', danger: true })) && remove.mutate()}>Delete</Button>}
          {editable && <Button icon={Save} onClick={() => save.mutate()} loading={save.isPending}>{isNew ? 'Save draft' : 'Save'}</Button>}
          {editable && !isNew && (
            <Button variant="primary" icon={Send} loading={post.isPending}
              onClick={async () => (await confirm({ title: `Post ${inv.number}?`, message: `Posting records this ${noun} in the ledger${customer ? ' and ships any goods from stock' : ''}. After that it can only be voided, not edited.`, confirmLabel: 'Post' })) && post.mutate()}>
              Post {noun}
            </Button>
          )}
          {status === 'posted' && <Button variant="ghost" icon={Ban} loading={voidIt.isPending} onClick={async () => (await confirm({ title: `Void ${inv.number}?`, message: 'A reversing entry is posted and any stock it moved goes back. The document stays for the record.', confirmLabel: 'Void', danger: true })) && voidIt.mutate()}>Void</Button>}
          {!isNew && status !== 'draft' && <Button icon={FileDown} onClick={() => openPdf(`/invoices/${id}/pdf`).catch((e) => toast.error(errorMessage(e)))}>PDF</Button>}
          {['posted', 'partial'].includes(status) && <Button variant="primary" icon={Wallet} onClick={openPay}>Record payment</Button>}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <div className="sheet relative p-5 sm:p-7">
          <div className="absolute right-6 top-5 hidden sm:block"><Stamp status={['posted', 'partial', 'paid', 'void'].includes(status) ? status : null} /></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:pr-40">
            <Field label={customer ? 'Customer' : 'Supplier'}>
              <Select value={form.contact} onChange={set('contact')} disabled={!editable} required>
                <option value="">Choose…</option>
                {contacts.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Issue date"><Input type="date" value={form.date} onChange={set('date')} disabled={!editable} /></Field>
            <Field label="Due date" hint={editable && !form.dueDate ? 'Uses payment terms if empty' : undefined}><Input type="date" value={form.dueDate} onChange={set('dueDate')} disabled={!editable} /></Field>
            {!customer && <Field label="Supplier reference"><Input value={form.supplierReference} onChange={set('supplierReference')} disabled={!editable} placeholder="Their invoice number" /></Field>}
          </div>

          <div className="mt-7">
            <LinesEditor lines={form.lines} onChange={(lines) => setForm((f) => ({ ...f, lines }))} readOnly={!editable} priceField={customer ? 'salePrice' : 'purchasePrice'} showAccount={!customer} />
          </div>

          {!isNew && inv.amountPaid > 0 && (
            <dl className="ml-auto mt-2 w-full max-w-[300px] space-y-1.5 text-[14px]">
              <div className="flex justify-between text-muted"><dt>Paid</dt><dd className="num">−{money(inv.amountPaid)}</dd></div>
              <div className="flex justify-between font-semibold text-ledger"><dt>Balance due</dt><dd className="num">{money(inv.balanceDue)}</dd></div>
            </dl>
          )}

          <Field label={customer ? 'Note to customer' : 'Notes'} className="mt-6 max-w-xl">
            <Textarea value={form.notes} onChange={set('notes')} disabled={!editable} />
          </Field>
        </div>

        {!isNew && (
          <div className="space-y-6">
            <Panel title="Payments">
              {inv.payments?.length ? (
                <ul className="divide-y divide-rule-2">
                  {inv.payments.map((p) => (
                    <li key={p._id} className="px-5 py-3">
                      <div className="flex justify-between"><span className="font-medium">{p.number}</span><span className="font-medium num">{money(p.amount)}</span></div>
                      <p className="text-[12.5px] text-muted">{date(p.date)} · {titleCase(p.method)} · {p.account?.name}</p>
                    </li>
                  ))}
                </ul>
              ) : <p className="px-5 py-6 text-[13.5px] text-muted">{status === 'draft' ? 'Post the document to start taking payments.' : 'No payments yet.'}</p>}
            </Panel>

            <Panel title="Attachments" action={
              <button onClick={() => fileInput.current?.click()} className="inline-flex items-center gap-1 text-[13px] font-medium text-ledger hover:underline" disabled={uploading}>
                {uploading ? <Spinner className="size-3.5" /> : <Paperclip className="size-3.5" />} Attach
              </button>}>
              <input ref={fileInput} type="file" hidden accept="image/*,application/pdf" onChange={(e) => attach(e.target.files?.[0])} />
              {inv.attachments?.length ? (
                <ul className="divide-y divide-rule-2">
                  {inv.attachments.map((a) => (
                    <li key={a.publicId} className="flex items-center gap-2 px-5 py-2.5">
                      <a href={a.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-[13.5px] text-ledger hover:underline">{a.name || 'File'}</a>
                      <button onClick={() => saveAttachments.mutate(inv.attachments.filter((x) => x.publicId !== a.publicId))} className="text-faint hover:text-debit" aria-label="Remove attachment"><X className="size-4" /></button>
                    </li>
                  ))}
                </ul>
              ) : <p className="px-5 py-6 text-[13.5px] text-muted">{customer ? 'Attach a signed delivery note or purchase order.' : 'Attach the scanned supplier bill.'}</p>}
            </Panel>

            <Panel title="Linked records" bodyClassName="space-y-2 px-5 py-4 text-[13.5px]">
              {inv.order ? <p>Order <Link className="font-medium text-ledger hover:underline" to={`${customer ? '/sales/orders' : '/purchases/orders'}/${inv.order._id}`}>{inv.order.number}</Link></p> : <p className="text-muted">Created directly, without an order.</p>}
              {inv.journalEntry && <p>Ledger entry <Link className="font-medium text-ledger hover:underline" to={`/accounting/journal?open=${inv.journalEntry._id}`}>{inv.journalEntry.number}</Link></p>}
            </Panel>
          </div>
        )}
      </div>

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title={customer ? 'Record a payment received' : 'Record a payment sent'}
        footer={<>
          <Button onClick={() => setPayOpen(false)}>Cancel</Button>
          <Button variant="primary" loading={recordPayment.isPending} onClick={() => recordPayment.mutate()}>Record payment</Button>
        </>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount" hint={`Balance due ${money(inv?.balanceDue)}`}>
            <Input type="number" step="0.01" min="0" className="num" value={pay.amount ?? ''} onChange={(e) => setPay((p) => ({ ...p, amount: Number(e.target.value) }))} />
          </Field>
          <Field label="Date"><Input type="date" value={pay.date || ''} onChange={(e) => setPay((p) => ({ ...p, date: e.target.value }))} /></Field>
          <Field label="Method">
            <Select value={pay.method} onChange={(e) => setPay((p) => ({ ...p, method: e.target.value }))}>
              {METHODS.map((m) => <option key={m} value={m}>{titleCase(m)}</option>)}
            </Select>
          </Field>
          <Field label={customer ? 'Deposit to' : 'Pay from'}>
            <Select value={pay.account || ''} onChange={(e) => setPay((p) => ({ ...p, account: e.target.value }))}>
              {cashAccounts.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
            </Select>
          </Field>
          <Field label="Reference" className="sm:col-span-2"><Input value={pay.reference || ''} onChange={(e) => setPay((p) => ({ ...p, reference: e.target.value }))} placeholder="Transfer ID or check number" /></Field>
        </div>
      </Modal>
      {dialog}
    </div>
  );
}
