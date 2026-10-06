import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ImagePlus, Trash2 } from 'lucide-react';
import { errorMessage, uploadFile } from '../../lib/api';
import { Spinner, cx } from './index';

/** Uploads to Cloudinary through the API and returns { url, publicId }. */
export default function ImageUpload({ value, onChange, folder = 'images', round, size = 88, label = 'Upload image' }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const asset = await uploadFile(file, folder);
      onChange({ url: asset.url, publicId: asset.publicId });
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
      input.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-4">
      <button type="button" onClick={() => input.current?.click()}
        className={cx('group relative flex shrink-0 items-center justify-center overflow-hidden border border-dashed border-[#C5CDC2] bg-paper-2 text-faint transition-colors hover:border-ledger hover:text-ledger', round ? 'rounded-full' : 'rounded-xl')}
        style={{ width: size, height: size }} aria-label={label}>
        {busy ? <Spinner /> : value?.url ? <img src={value.url} alt="" className="size-full object-cover" /> : <ImagePlus className="size-6" strokeWidth={1.5} />}
      </button>
      <div className="text-[13px]">
        <button type="button" className="font-medium text-ledger hover:underline" onClick={() => input.current?.click()}>{value?.url ? 'Replace image' : label}</button>
        <p className="text-muted">PNG, JPG or WebP, up to 8 MB</p>
        {value?.url && (
          <button type="button" onClick={() => onChange(null)} className="mt-1 inline-flex items-center gap-1 text-debit hover:underline"><Trash2 className="size-3.5" />Remove</button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}
