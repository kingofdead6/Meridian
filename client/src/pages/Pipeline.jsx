import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CalendarClock, Plus, Trash2 } from 'lucide-react';
import api, { errorMessage } from '../lib/api';
import { useAction, useList } from '../lib/hooks';
import { compactMoney, money, shortDate } from '../lib/format';
import { Avatar, Button, PageHeader, Spinner } from '../components/ui';
import { Drawer, useConfirm } from '../components/ui/Overlay';
import Kanban from '../components/Kanban';
import FormFields, { fromFormValues, toFormValues } from '../components/FormFields';

const STAGES = [
  { key: 'new', label: 'New', accent: '#98A1A9' },
  { key: 'qualified', label: 'Qualified', accent: '#3A5A8C' },
  { key: 'proposal', label: 'Proposal', accent: '#6B4E8A' },
  { key: 'negotiation', label: 'Negotiation', accent: '#A86E14' },
  { key: 'won', label: 'Won', accent: '#2E6B4E' },
  { key: 'lost', label: 'Lost', accent: '#B3432F' },
];

const FIELDS = [
  { name: 'title', label: 'Opportunity', required: true, span: 'full' },
  { name: 'organization', label: 'Organization' },
  { name: 'contactName', label: 'Contact person' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'phone', label: 'Phone' },
  { name: 'value', label: 'Estimated value', type: 'money' },
  { name: 'stage', label: 'Stage', type: 'select', required: true, options: STAGES.map((s) => ({ value: s.key, label: s.label })) },
  { name: 'source', label: 'Source', type: 'select', options: ['Website', 'Referral', 'Trade show', 'Outbound', 'Partner'] },
  { name: 'expectedClose', label: 'Expected close', type: 'date' },
  { name: 'owner', label: 'Owner', type: 'relation', resource: 'directory' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

export default function Pipeline() {
  const qc = useQueryClient();
  const params = { limit: 500 };
  const { data, isLoading } = useList('leads', params);
  const leads = data?.data || [];
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState({});
  const [confirm, dialog] = useConfirm();

  const open = (lead) => { setEditing(lead || {}); setValues(toFormValues(FIELDS, lead, { stage: 'new', source: 'Website' })); };
  const isNew = !editing?._id;
  const save = useAction((body) => (isNew ? api.post('/leads', body) : api.put(`/leads/${editing._id}`, body)), { success: isNew ? 'Lead added' : 'Lead saved', onSuccess: () => setEditing(null) });
  const remove = useAction(() => api.delete(`/leads/${editing._id}`), { success: 'Lead deleted', onSuccess: () => setEditing(null) });

  // Optimistic drag & drop: reorder locally, then persist
  const move = async (lead, stage, index) => {
    const key = ['leads', params];
    const previous = qc.getQueryData(key);
    const others = leads.filter((l) => l.stage === stage && l._id !== lead._id).sort((a, b) => a.position - b.position);
    others.splice(index, 0, { ...lead, stage });
    const positions = new Map(others.map((l, i) => [l._id, i]));
    qc.setQueryData(key, { ...previous, data: leads.map((l) => (positions.has(l._id) ? { ...l, stage, position: positions.get(l._id) } : l)) });
    try {
      await api.patch(`/leads/${lead._id}/move`, { stage, position: index });
      if (stage === 'won' && lead.stage !== 'won') toast.success(`Won ${lead.title}`);
    } catch (e) {
      qc.setQueryData(key, previous);
      toast.error(errorMessage(e));
    }
  };

  const open_ = leads.filter((l) => !['won', 'lost'].includes(l.stage));
  const weighted = open_.reduce((s, l) => s + l.value, 0);

  return (
    <div>
      <PageHeader title="Pipeline" description={`${open_.length} open opportunities worth ${money(weighted, { compact: true })}. Drag cards between stages.`}
        actions={<Button variant="primary" icon={Plus} onClick={() => open(null)}>New lead</Button>} />
      {isLoading ? <div className="flex justify-center py-20"><Spinner /></div> : (
        <Kanban
          columns={STAGES}
          items={leads}
          columnOf={(l) => l.stage}
          onMove={move}
          onCardClick={open}
          columnMeta={(items) => compactMoney(items.reduce((s, l) => s + l.value, 0))}
          renderCard={(l) => (
            <div>
              <p className="font-medium leading-snug text-graphite">{l.title}</p>
              <p className="mt-0.5 text-[13px] text-muted">{l.organization}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="font-semibold text-ink num">{money(l.value, { compact: true })}</span>
                {l.expectedClose && <span className="ml-auto inline-flex items-center gap-1 text-[12px] text-muted"><CalendarClock className="size-3.5" />{shortDate(l.expectedClose)}</span>}
                {l.owner && <Avatar name={l.owner.name} src={l.owner.avatar?.url} size={22} className={l.expectedClose ? '' : 'ml-auto'} />}
              </div>
            </div>
          )}
        />
      )}

      <Drawer open={Boolean(editing)} onClose={() => setEditing(null)} title={isNew ? 'New lead' : editing?.title}
        footer={<>
          {!isNew && <Button variant="danger" icon={Trash2} className="mr-auto" loading={remove.isPending}
            onClick={async () => (await confirm({ title: 'Delete this lead?', message: 'It will be removed from the pipeline.', confirmLabel: 'Delete', danger: true })) && remove.mutate()}>Delete</Button>}
          <Button onClick={() => setEditing(null)}>Cancel</Button>
          <Button variant="primary" type="submit" form="lead-form" loading={save.isPending}>{isNew ? 'Add lead' : 'Save changes'}</Button>
        </>}>
        <form id="lead-form" onSubmit={(e) => { e.preventDefault(); save.mutate(fromFormValues(FIELDS, values)); }}>
          <FormFields fields={FIELDS} values={values} onChange={setValues} />
        </form>
      </Drawer>
      {dialog}
    </div>
  );
}
