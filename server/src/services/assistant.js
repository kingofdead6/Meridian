import Company from '../models/Company.js';
import Invoice from '../models/Invoice.js';
import ApiError from '../utils/ApiError.js';
import { dashboard, profitLoss } from './reports.js';

/** Builds a compact snapshot of the business and asks any OpenAI-compatible model about it. */
export async function askAssistant(user, question, history = []) {
  const key = process.env.AI_API_KEY;
  if (!key) throw new ApiError(503, 'The assistant is not configured. Add AI_API_KEY to the server .env file.');
  if (!question?.trim()) throw ApiError.badRequest('Ask a question');

  const company = await Company.findById(user.company).lean();
  const now = new Date();
  const [dash, pl, openInvoices] = await Promise.all([
    dashboard(user.company),
    profitLoss(user.company, { from: new Date(now.getFullYear(), 0, 1), to: now }),
    Invoice.find({ company: user.company, status: { $in: ['posted', 'partial'] } }).populate('contact', 'name').sort('dueDate').limit(25).lean(),
  ]);

  const snapshot = {
    company: company.name,
    currency: company.currency,
    today: now.toISOString().slice(0, 10),
    cash: dash.cash,
    receivables: dash.receivables,
    payables: dash.payables,
    overdue: { count: dash.overdueCount, amount: dash.overdueAmount, invoices: dash.overdueInvoices },
    stockValue: dash.stockValue,
    lastSixMonths: dash.series,
    yearToDate: { income: pl.totalIncome, cogs: pl.totalCogs, operatingExpenses: pl.totalOperating, netProfit: pl.netProfit, expenseBreakdown: pl.operating.map((r) => ({ account: r.name, amount: r.balance })) },
    topProducts: dash.topProducts.map((p) => ({ name: p.name, revenue: p.revenue, quantity: p.quantity })),
    lowStock: dash.lowStock,
    pipeline: dash.pipeline,
    openInvoices: openInvoices.map((i) => ({ number: i.number, kind: i.kind, contact: i.contact?.name, due: i.dueDate, balance: i.total - i.amountPaid })),
  };

  const messages = [
    {
      role: 'system',
      content:
        'You are the finance and operations assistant inside Meridian ERP. Answer using only the JSON snapshot of the business below. ' +
        'Be concise and specific, quote figures with the currency, and say plainly when the snapshot does not contain the answer.\n\n' +
        JSON.stringify(snapshot),
    },
    ...history.slice(-6).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content).slice(0, 4000) })),
    { role: 'user', content: question },
  ];

  const base = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: process.env.AI_MODEL || 'gpt-4o-mini', messages, temperature: 0.2 }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(502, `The AI provider returned ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || 'No answer came back from the model.';
}
