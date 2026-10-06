import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, Trash2 } from 'lucide-react';
import api from '../lib/api';
import { useAction, useOptions, useRecord } from '../lib/hooks';
import { date, money } from '../lib/format';
import { Avatar, Button, Field, Select, Spinner, StatusBadge } from '../components/ui';
import { Modal, useConfirm } from '../components/ui/Overlay';
import Stamp from '../components/ui/Stamp';

export default function PayrollDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: run, isLoading } = useRecord(`payroll/${id}`);
  const cash = useOptions('accounts/cash');
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState('');
  const [confirm, dialog] = useConfirm();
  const post = useAction(() => api.post(`/payroll/${id}/post`, { account }), { success: 'Payroll posted and salaries paid', onSuccess: () => setOpen(false) });
  const remove = useAction(() => api.delete(`/payroll/${id}`), { success: 'Draft deleted', onSuccess: () => navigate('/hr/payroll') });

  if (isLoading || !run) return <div className="flex justify-center py-24"><Spinner /></div>;
  const deductionNames = run.lines[0]?.deductions.map((d) => d.name) || [];
  const label = new Date(`${run.period}-01T12:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <div>
      <Link to="/hr/payroll" className="mb-3 inline-flex items-center gap-1.5 text-[13.5px] text-muted hover:text-graphite"><ArrowLeft className="size-4" /> Payroll</Link>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[26px] font-semibold text-ink">Payroll for {label}</h1>
          <StatusBadge status={run.status} label={run.status === 'posted' ? 'Paid' : 'Draft'} />
        </div>
        {run.status === 'draft' && (
          <div className="flex gap-2">
            <Button variant="ghost" icon={Trash2} onClick={async () => (await confirm({ title: 'Delete this draft?', message: 'You can prepare it again afterwards.', confirmLabel: 'Delete', danger: true })) && remove.mutate()}>Delete</Button>
            <Button variant="primary" icon={Send} onClick={() => { setAccount(cash.find((a) => a.code === '1010')?._id || cash[0]?._id); setOpen(true); }}>Post and pay</Button>
          </div>
        )}
      </div>

      <div className="sheet relative overflow-hidden">
        <div className="absolute right-6 top-4 hidden sm:block"><Stamp status={run.status === 'posted' ? 'paid' : null} /></div>
        <dl className="grid gap-4 border-b border-rule px-6 py-5 sm:grid-cols-4 sm:pr-48">
          <div><dt className="text-[12.5px] text-muted">People</dt><dd className="text-[20px] font-semibold num">{run.lines.length}</dd></div>
          <div><dt className="text-[12.5px] text-muted">Gross</dt><dd className="text-[20px] font-semibold num">{money(run.totalGross)}</dd></div>
          <div><dt className="text-[12.5px] text-muted">Deductions</dt><dd className="text-[20px] font-semibold num">{money(run.totalDeductions)}</dd></div>
          <div><dt className="text-[12.5px] text-muted">Net pay</dt><dd className="text-[20px] font-semibold text-ledger num">{money(run.totalNet)}</dd></div>
        </dl>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-[14px]">
            <thead><tr className="border-b border-rule bg-paper-2 text-left text-[12.5px] text-muted">
              <th className="px-5 py-2.5 font-medium">Employee</th><th className="px-4 py-2.5 text-right font-medium">Gross</th>
              {deductionNames.map((n) => <th key={n} className="px-4 py-2.5 text-right font-medium">{n}</th>)}
              <th className="px-5 py-2.5 text-right font-medium">Net</th>
            </tr></thead>
            <tbody>
              {run.lines.map((l) => (
                <tr key={l._id} className="border-b border-rule-2">
                  <td className="px-5 py-2.5"><span className="flex items-center gap-3"><Avatar name={l.name} src={l.employee?.avatar?.url} size={28} /><span><span className="font-medium">{l.name}</span><span className="block text-[12.5px] text-muted">{l.position}</span></span></span></td>
                  <td className="px-4 py-2.5 text-right num">{money(l.gross)}</td>
                  {l.deductions.map((d) => <td key={d.name} className="px-4 py-2.5 text-right text-muted num">{money(d.amount)}</td>)}
                  <td className="px-5 py-2.5 text-right font-medium num">{money(l.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {run.status === 'posted' && <p className="px-6 py-4 text-[13px] text-muted">Paid on {date(run.date)} from {run.paidFrom?.name} · ledger entry <Link to={`/accounting/journal?open=${run.journalEntry?._id}`} className="text-ledger hover:underline">{run.journalEntry?.number}</Link></p>}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Post and pay salaries"
        footer={<><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="primary" loading={post.isPending} onClick={() => post.mutate()}>Pay {money(run.totalNet)}</Button></>}>
        <p className="mb-4 text-muted">Salaries are expensed at gross. Deductions are held as payroll liabilities, and net pay leaves the account below.</p>
        <Field label="Pay from"><Select value={account} onChange={(e) => setAccount(e.target.value)}>{cash.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}</Select></Field>
      </Modal>
      {dialog}
    </div>
  );
}
