import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, Sparkles } from 'lucide-react';
import api, { errorMessage } from '../lib/api';
import { PageHeader, Spinner, cx } from '../components/ui';

const SUGGESTIONS = [
  'Which customers owe us the most, and how late are they?',
  'How did profit change over the last three months?',
  'What should I reorder this week?',
  'Where is most of our money going this year?',
];

export default function Assistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef(null);

  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy]);

  const ask = async (question) => {
    const q = question.trim();
    if (!q || busy) return;
    const history = messages.filter((m) => !m.error);
    setMessages((m) => [...m, { role: 'user', content: q }]);
    setInput('');
    setBusy(true);
    try {
      const { data } = await api.post('/assistant', { question: q, history });
      setMessages((m) => [...m, { role: 'assistant', content: data.answer }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: errorMessage(e), error: true }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-140px)] max-w-3xl flex-col">
      <PageHeader title="Assistant" description="Ask questions about sales, cash, stock and spending. Answers use your live figures." />

      <div className="flex-1 space-y-4">
        {!messages.length && (
          <div className="grid gap-2 sm:grid-cols-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => ask(s)} className="sheet px-4 py-3 text-left text-[14px] hover:border-ledger/50 hover:bg-ledger-soft/30">{s}</button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={cx('flex gap-3', m.role === 'user' && 'justify-end')}>
            {m.role === 'assistant' && <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-ink text-ledger-bright"><Sparkles className="size-3.5" /></span>}
            <div className={cx('max-w-[85%] whitespace-pre-wrap rounded-xl px-4 py-2.5 leading-relaxed',
              m.role === 'user' ? 'bg-ink text-white' : m.error ? 'border border-debit/30 bg-debit-soft text-debit' : 'sheet')}>
              {m.content}
            </div>
          </motion.div>
        ))}
        {busy && <div className="flex items-center gap-2 pl-10 text-muted"><Spinner className="size-4" /> Reading the books…</div>}
        <div ref={end} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="sticky bottom-4 mt-6">
        <div className="sheet flex items-end gap-2 p-2 shadow-[0_12px_40px_-20px_rgba(22,35,58,0.4)]">
          <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={1} placeholder="Ask about your business"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input); } }}
            className="max-h-40 flex-1 resize-none bg-transparent px-2 py-2 outline-none placeholder:text-faint" aria-label="Question" />
          <button type="submit" disabled={!input.trim() || busy} className="flex size-9 items-center justify-center rounded-lg bg-ledger text-white disabled:opacity-40" aria-label="Send">
            <ArrowUp className="size-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
