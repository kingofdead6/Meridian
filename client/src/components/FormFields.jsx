import { useOptions } from '../lib/hooks';
import { inputDate } from '../lib/format';
import { Field, Input, Select, Textarea, cx } from './ui';
import ImageUpload from './ui/ImageUpload';

function RelationSelect({ field, value, onChange }) {
  const options = useOptions(field.resource, field.params);
  const label = field.optionLabel || ((o) => o.name || o.title || o.number);
  return (
    <Select value={value || ''} onChange={(e) => onChange(e.target.value || null)} required={field.required}>
      <option value="">{field.placeholder || 'Choose…'}</option>
      {options.map((o) => <option key={o._id} value={o._id}>{label(o)}</option>)}
    </Select>
  );
}

function Control({ field, value, onChange }) {
  const common = { id: field.name, required: field.required, placeholder: field.placeholder, disabled: field.disabled };
  switch (field.type) {
    case 'textarea':
      return <Textarea {...common} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'number':
    case 'money':
      return <Input {...common} type="number" step={field.step || (field.type === 'money' ? '0.01' : 'any')} min={field.min} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} className="num" />;
    case 'date':
      return <Input {...common} type="date" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'select':
      return (
        <Select {...common} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          {!field.required && <option value="">{field.placeholder || 'None'}</option>}
          {field.options.map((o) => (typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
        </Select>
      );
    case 'relation':
      return <RelationSelect field={field} value={value} onChange={onChange} />;
    case 'checkbox':
      return (
        <span className="flex h-9 items-center gap-2.5">
          <input type="checkbox" className="size-4 accent-[#2E6B4E]" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          <span className="text-muted">{field.checkboxLabel}</span>
        </span>
      );
    case 'image':
      return <ImageUpload value={value} onChange={onChange} folder={field.folder} round={field.round} />;
    case 'color':
      return (
        <span className="flex items-center gap-2">
          {['#2E6B4E', '#3A5A8C', '#8A6A1F', '#6B4E8A', '#A1503A', '#2F6F73'].map((c) => (
            <button key={c} type="button" onClick={() => onChange(c)} aria-label={`Colour ${c}`}
              className={cx('size-7 rounded-full ring-offset-2 transition', value === c && 'ring-2 ring-ink')} style={{ background: c }} />
          ))}
        </span>
      );
    default:
      return <Input {...common} type={field.type || 'text'} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
  }
}

export default function FormFields({ fields, values, onChange }) {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
      {fields.filter((f) => !f.hidden?.(values)).map((f) => (
        <Field key={f.name} label={f.type === 'checkbox' && !f.label ? undefined : f.label} hint={f.hint} className={f.span === 'full' || ['textarea', 'image'].includes(f.type) ? 'sm:col-span-2' : ''}>
          <Control field={f} value={values[f.name]} onChange={(v) => onChange({ ...values, [f.name]: v })} />
        </Field>
      ))}
    </div>
  );
}

export function toFormValues(fields, record = {}, defaults = {}) {
  const out = { ...defaults };
  for (const f of fields) {
    let v = record?.[f.name];
    if (v === undefined) continue;
    if (f.type === 'relation' && v && typeof v === 'object') v = v._id;
    if (f.type === 'date') v = inputDate(v);
    out[f.name] = v;
  }
  return out;
}

export function fromFormValues(fields, values) {
  const out = {};
  for (const f of fields) {
    if (f.readOnly) continue;
    let v = values[f.name];
    if (v === '' && (f.type === 'number' || f.type === 'money' || f.type === 'relation' || f.type === 'date')) v = null;
    if (v !== undefined) out[f.name] = v;
  }
  return out;
}
