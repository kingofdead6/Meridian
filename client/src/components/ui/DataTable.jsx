import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { cx, EmptyState } from './index';

/**
 * Ruled ledger-style table. columns: [{ key, label, render(row), align: 'right', className, width }]
 */
export default function DataTable({ columns, rows = [], loading, onRowClick, empty, page, pages, total, onPage, footer, dense, rowClassName }) {
  return (
    <div className="sheet overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-rule bg-paper-2">
              {columns.map((c) => (
                <th key={c.key} style={{ width: c.width }} className={cx('whitespace-nowrap px-4 py-2.5 text-[12.5px] font-medium text-muted', c.align === 'right' && 'text-right', c.headerClassName)}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <motion.tr
                key={row._id || i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i, 14) * 0.025, ease: [0.2, 0.7, 0.2, 1] }}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cx('border-b border-rule-2 last:border-0 transition-colors', onRowClick && 'cursor-pointer hover:bg-paper-2', rowClassName?.(row))}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cx('px-4 align-middle', dense ? 'py-2' : 'py-3', c.align === 'right' && 'text-right num', c.className)}>
                    {c.render ? c.render(row) : row[c.key] ?? '—'}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
          {footer && <tfoot>{footer}</tfoot>}
        </table>
      </div>
      {loading && !rows.length && (
        <div className="divide-y divide-rule-2" aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <span className="skeleton h-3.5 w-1/4 rounded" /><span className="skeleton h-3.5 w-1/3 rounded" /><span className="skeleton ml-auto h-3.5 w-20 rounded" />
            </div>
          ))}
        </div>
      )}
      {!loading && !rows.length && (empty || <EmptyState icon={Inbox} title="Nothing here yet" />)}
      {pages > 1 && (
        <div className="flex items-center justify-between border-t border-rule px-4 py-2.5 text-[13px] text-muted">
          <span className="num">{total} records</span>
          <div className="flex items-center gap-1">
            <button className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-rule-2 disabled:opacity-40" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft className="size-4" /></button>
            <span className="num px-2">Page {page} of {pages}</span>
            <button className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-rule-2 disabled:opacity-40" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page"><ChevronRight className="size-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
