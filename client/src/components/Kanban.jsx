import { useState } from 'react';
import { motion } from 'framer-motion';
import { cx } from './ui';

/**
 * Drag-and-drop board. columns: [{ key, label, accent }]. onMove(item, columnKey, index) persists the move.
 */
export default function Kanban({ columns, items, columnOf, onMove, renderCard, onCardClick, columnMeta }) {
  const [dragging, setDragging] = useState(null);
  const [over, setOver] = useState(null); // { col, index }

  const byColumn = Object.fromEntries(columns.map((c) => [c.key, items.filter((i) => columnOf(i) === c.key).sort((a, b) => (a.position ?? 0) - (b.position ?? 0))]));

  const drop = (col) => {
    if (!dragging) return;
    const index = over?.col === col ? over.index : byColumn[col].length;
    onMove(dragging, col, index);
    setDragging(null);
    setOver(null);
  };

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
      <div className="flex min-w-max gap-3">
        {columns.map((col) => (
          <section key={col.key}
            onDragOver={(e) => { e.preventDefault(); if (over?.col !== col.key) setOver({ col: col.key, index: byColumn[col.key].length }); }}
            onDrop={() => drop(col.key)}
            className={cx('flex w-[272px] shrink-0 flex-col rounded-xl border bg-paper-2 transition-colors', over?.col === col.key && dragging ? 'border-ledger/50 bg-ledger-soft/40' : 'border-rule')}>
            <header className="flex items-center gap-2 px-3.5 pb-2 pt-3">
              <span className="size-2 rounded-full" style={{ background: col.accent || '#98A1A9' }} />
              <h3 className="text-[14px] font-semibold text-ink">{col.label}</h3>
              <span className="text-[13px] text-faint num">{byColumn[col.key].length}</span>
              {columnMeta && <span className="ml-auto text-[13px] font-medium text-muted num">{columnMeta(byColumn[col.key], col)}</span>}
            </header>
            <ul className="flex min-h-[120px] flex-1 flex-col gap-2 px-2 pb-2">
              {byColumn[col.key].map((item, index) => (
                <motion.li key={item._id} layout transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  draggable
                  onDragStart={(e) => { setDragging(item); e.dataTransfer.effectAllowed = 'move'; }}
                  onDragEnd={() => { setDragging(null); setOver(null); }}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setOver({ col: col.key, index }); }}
                  onDrop={(e) => { e.stopPropagation(); drop(col.key); }}
                  onClick={() => onCardClick?.(item)}
                  className={cx('cursor-grab rounded-lg border border-rule bg-sheet p-3 active:cursor-grabbing hover:border-[#C5CDC2]',
                    dragging?._id === item._id && 'opacity-40',
                    over?.col === col.key && over.index === index && dragging && dragging._id !== item._id && 'shadow-[0_-2px_0_0_#2E6B4E]')}>
                  {renderCard(item)}
                </motion.li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
