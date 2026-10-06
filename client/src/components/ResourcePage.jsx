import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Trash2 } from 'lucide-react';
import api from '../lib/api';
import { useAction, useDebounced, useList } from '../lib/hooks';
import { useAuth } from '../context/AuthContext';
import { Button, Input, PageHeader, Select } from './ui';
import DataTable from './ui/DataTable';
import { Drawer, useConfirm } from './ui/Overlay';
import FormFields, { fromFormValues, toFormValues } from './FormFields';

/**
 * Generic list + create/edit drawer for a REST resource.
 * Pages describe columns and fields; this handles search, filters, paging, forms and deletes.
 */
export default function ResourcePage({
  title, description, resource, entity, columns, fields, defaults = {}, filters = [], searchPlaceholder,
  module, params: baseParams = {}, onRowClick, headerExtra, embedded, drawerExtra, transform, actions,
}) {
  const { can } = useAuth();
  const editable = can(module);
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [filterValues, setFilterValues] = useState(() => Object.fromEntries(filters.map((f) => [f.name, f.default || ''])));
  const [drawer, setDrawer] = useState(null); // { record?: object }
  const [values, setValues] = useState({});
  const [confirm, confirmDialog] = useConfirm();
  const term = useDebounced(q);

  const params = useMemo(() => ({ ...baseParams, ...filterValues, q: term || undefined, page, limit: 25 }), [baseParams, filterValues, term, page]);
  const { data, isLoading } = useList(resource, params);
  const rows = transform ? transform(data?.data || []) : data?.data || [];

  const openRecord = (record) => {
    setDrawer({ record });
    setValues(toFormValues(fields, record, record ? {} : defaults));
  };

  // Deep link: ?open=<id> opens the edit drawer (used by global search)
  useEffect(() => {
    const id = searchParams.get('open');
    if (!id) return;
    api.get(`/${resource}/${id}`).then((r) => openRecord(r.data)).catch(() => {});
    searchParams.delete('open');
    setSearchParams(searchParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const isNew = !drawer?.record;
  const save = useAction(
    (body) => (isNew ? api.post(`/${resource}`, body) : api.put(`/${resource}/${drawer.record._id}`, body)),
    { success: isNew ? `${entity} created` : 'Changes saved', onSuccess: () => setDrawer(null) }
  );
  const remove = useAction(() => api.delete(`/${resource}/${drawer.record._id}`), { success: `${entity} deleted`, onSuccess: () => setDrawer(null) });

  const submit = (e) => {
    e.preventDefault();
    save.mutate({ ...baseParams, ...fromFormValues(fields, values) });
  };

  const askDelete = async () => {
    if (await confirm({ title: `Delete this ${entity.toLowerCase()}?`, message: 'This cannot be undone.', confirmLabel: 'Delete', danger: true })) remove.mutate();
  };

  return (
    <div>
      {!embedded && (
        <PageHeader title={title} description={description}
          actions={actions !== undefined ? actions : editable && fields && <Button variant="primary" icon={Plus} onClick={() => openRecord(null)}>New {entity.toLowerCase()}</Button>} />
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder={searchPlaceholder || 'Search'} className="pl-9" aria-label="Search" />
        </div>
        {filters.map((f) => (
          <Select key={f.name} value={filterValues[f.name]} aria-label={f.label} className="w-auto min-w-[150px]"
            onChange={(e) => { setFilterValues((v) => ({ ...v, [f.name]: e.target.value })); setPage(1); }}>
            <option value="">{f.label}</option>
            {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        ))}
        {headerExtra}
        {embedded && editable && fields && <Button className="ml-auto" variant="primary" icon={Plus} onClick={() => openRecord(null)}>New {entity.toLowerCase()}</Button>}
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={isLoading}
        page={data?.page}
        pages={data?.pages}
        total={data?.total}
        onPage={setPage}
        onRowClick={onRowClick || (fields ? openRecord : undefined)}
      />

      {fields && (
        <Drawer
          open={Boolean(drawer)}
          onClose={() => setDrawer(null)}
          title={isNew ? `New ${entity.toLowerCase()}` : `Edit ${entity.toLowerCase()}`}
          footer={editable && (
            <>
              {!isNew && <Button variant="danger" icon={Trash2} className="mr-auto" onClick={askDelete} loading={remove.isPending}>Delete</Button>}
              <Button onClick={() => setDrawer(null)}>Cancel</Button>
              <Button variant="primary" type="submit" form="resource-form" loading={save.isPending}>{isNew ? `Create ${entity.toLowerCase()}` : 'Save changes'}</Button>
            </>
          )}
        >
          <form id="resource-form" onSubmit={submit}>
            <fieldset disabled={!editable}>
              <FormFields fields={fields} values={values} onChange={setValues} />
            </fieldset>
          </form>
          {drawer?.record && drawerExtra?.(drawer.record)}
        </Drawer>
      )}
      {confirmDialog}
    </div>
  );
}
