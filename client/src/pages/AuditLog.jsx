import ResourcePage from '../components/ResourcePage';
import { Badge } from '../components/ui';
import { titleCase } from '../lib/format';

const TONE = { create: 'green', update: 'blue', delete: 'red', post: 'blue', void: 'red', payment: 'green', approve: 'green', reject: 'red' };

export default function AuditLog() {
  return (
    <ResourcePage
      title="Audit log"
      description="Who changed what, and when. Entries can't be edited."
      resource="audit"
      entity="Entry"
      module="settings"
      actions={null}
      searchPlaceholder="Search people or changes"
      filters={[{ name: 'action', label: 'Any action', options: Object.keys(TONE).map((a) => ({ value: a, label: titleCase(a) })) }]}
      columns={[
        { key: 'createdAt', label: 'When', width: 190, render: (r) => <span className="text-muted num">{new Date(r.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span> },
        { key: 'userName', label: 'Person', render: (r) => <span className="font-medium">{r.userName}</span> },
        { key: 'action', label: 'Action', render: (r) => <Badge tone={TONE[r.action] || 'neutral'}>{titleCase(r.action)}</Badge> },
        { key: 'summary', label: 'Change' },
      ]}
    />
  );
}
