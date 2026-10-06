import PayrollRun from '../models/PayrollRun.js';
import Employee from '../models/Employee.js';
import Company from '../models/Company.js';
import Account from '../models/Account.js';
import ApiError from '../utils/ApiError.js';
import { nextNumber } from '../utils/numbering.js';
import { round2 } from '../utils/money.js';
import { runInTransaction } from '../utils/transaction.js';
import { postEntry, systemAccounts } from './ledger.js';

export async function generatePayroll(period, { user }) {
  if (!/^\d{4}-\d{2}$/.test(period || '')) throw ApiError.badRequest('Choose a period like 2026-01');
  if (await PayrollRun.exists({ company: user.company, period })) throw ApiError.conflict(`Payroll for ${period} already exists`);

  const company = await Company.findById(user.company);
  const employees = await Employee.find({ company: user.company, status: { $ne: 'terminated' }, salary: { $gt: 0 } }).sort('lastName');
  if (!employees.length) throw ApiError.badRequest('There are no active employees with a salary');

  const lines = employees.map((e) => {
    const deductions = (company.payrollDeductions || []).map((d) => ({ name: d.name, amount: round2((e.salary * d.rate) / 100) }));
    const totalDeductions = round2(deductions.reduce((s, d) => s + d.amount, 0));
    return { employee: e._id, name: e.fullName, position: e.position, gross: e.salary, deductions, totalDeductions, net: round2(e.salary - totalDeductions) };
  });

  const [y, m] = period.split('-').map(Number);
  const endOfMonth = new Date(y, m, 0, 12);
  const date = endOfMonth > new Date() ? new Date() : endOfMonth;

  return PayrollRun.create({
    company: user.company,
    number: await nextNumber(user.company, 'payroll'),
    period,
    date,
    lines,
    totalGross: round2(lines.reduce((s, l) => s + l.gross, 0)),
    totalDeductions: round2(lines.reduce((s, l) => s + l.totalDeductions, 0)),
    totalNet: round2(lines.reduce((s, l) => s + l.net, 0)),
    user: user._id,
  });
}

/** Dr Salaries (gross) / Cr Payroll liabilities (deductions) + Cr Bank (net pay). */
export async function postPayroll(runId, { user, account }) {
  return runInTransaction(async (session) => {
    const run = await PayrollRun.findOne({ _id: runId, company: user.company }).session(session);
    if (!run) throw ApiError.notFound('Payroll run');
    if (run.status !== 'draft') throw ApiError.conflict('This payroll has already been posted');
    const bank = await Account.findOne({ _id: account, company: user.company, isCash: true }).session(session);
    if (!bank) throw ApiError.badRequest('Choose the account salaries are paid from');

    const acc = await systemAccounts(user.company, session);
    const entry = await postEntry(
      {
        company: user.company, date: run.date, user: user._id, source: 'payroll', sourceId: run._id, reference: run.number,
        memo: `Payroll ${run.period}`,
        lines: [
          { account: acc.salary_exp, debit: run.totalGross },
          { account: acc.payroll_liab, credit: run.totalDeductions },
          { account: bank._id, credit: run.totalNet },
        ],
      },
      session
    );
    run.status = 'posted';
    run.paidFrom = bank._id;
    run.journalEntry = entry._id;
    await run.save({ session });
    return run;
  });
}
