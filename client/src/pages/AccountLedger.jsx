import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useList } from '../lib/hooks';
import { date, money, titleCase } from '../lib/format';
import { Badge, Field, Input, PageHeader, Spinner } from '../components/ui';
import DataTable from '../components/ui/DataTable';

export default function AccountLedger() {
  const { id } = useParams();
  const now = new Date();
  const [from, setFrom] = useState(new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().slice(0, 10));
  const [to, setTo] = useState(now.toISOString().slice(0, 10));
  const { data, isLoading } = useList(`accounts/${id}/ledger`, { from, to });

  if (isLoading || !data) return <div className="flex justify-center py-24"><Spinner /></div>;
  const { account } = data;

  return (
    <div>
      <Link to="/accounting/accounts" className="mb-3 inline-flex items-center gap-1.5 text-[13.5px] text-muted hover:text-graphite"><ArrowLeft className="size-4" /> Chart of accounts</Link>
      <PageHeader title={`${account.code} ${account.name}`} description={`${titleCase(account.type)} account · every posting with its running balance`}
        actions={<div className="flex items-end gap-2">
          <Field label="From"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Field label="To"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
        </div>} />
      <DataTable rows={data.rows.map((r, i) => ({ ...r, _id: `${r.entryId}-${i}` }))} dense
        columns={[
          { key: 'date', label: 'Date', render: (r) => date(r.date) },
          { key: 'number', label: 'Entry', render: (r) => <Link to={`/accounting/journal?open=${r.entryId}`} className="font-medium text-ledger hover:underline">{r.number}</Link> },
          { key: 'memo', label: 'Description', render: (r) => <span className="text-muted">{r.memo}</span> },
          { key: 'source', label: 'Source', render: (r) => <Badge>{titleCase(r.source)}</Badge> },
          { key: 'debit', label: 'Debit', align: 'right', render: (r) => (r.debit ? money(r.debit) : '') },
          { key: 'credit', label: 'Credit', align: 'right', render: (r) => (r.credit ? money(r.credit) : '') },
          { key: 'balance', label: 'Balance', align: 'right', render: (r) => <span className="font-medium">{money(r.balance)}</span> },
        ]}
        footer={
          <>
            <tr className="border-t border-rule bg-paper-2 text-[13.5px]"><td colSpan={6} className="px-4 py-2 text-muted">Opening balance on {date(from)}</td><td className="px-4 py-2 text-right num">{money(data.opening)}</td></tr>
            <tr className="border-t-2 border-double border-rule bg-paper-2 font-semibold"><td colSpan={6} className="px-4 py-2.5">Closing balance on {date(to)}</td><td className="px-4 py-2.5 text-right num">{money(data.closing)}</td></tr>
          </>
        } />
    </div>
  );
}
