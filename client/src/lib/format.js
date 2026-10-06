let currency = 'USD';
export const setCurrency = (c) => { currency = c || 'USD'; };

export const money = (n, opts = {}) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: opts.compact ? 0 : 2, minimumFractionDigits: opts.compact ? 0 : 2 }).format(Number(n) || 0);

export const compactMoney = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 }).format(Number(n) || 0);

export const number = (n, digits = 0) => new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(Number(n) || 0);

export const date = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
export const shortDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—');
export const inputDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
export const today = () => new Date().toISOString().slice(0, 10);

export function timeAgo(d) {
  const s = Math.round((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.round(h / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}

export const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
export const titleCase = (s = '') => s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
export const isOverdue = (inv) => ['posted', 'partial'].includes(inv?.status) && inv?.dueDate && new Date(inv.dueDate) < new Date();
