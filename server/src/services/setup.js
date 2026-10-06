import Account from '../models/Account.js';
import Warehouse from '../models/Warehouse.js';

export const DEFAULT_ACCOUNTS = [
  ['1000', 'Cash on hand', 'asset', 'cash', true],
  ['1010', 'Bank account', 'asset', 'bank', true],
  ['1100', 'Accounts receivable', 'asset', 'ar'],
  ['1200', 'Inventory', 'asset', 'inventory'],
  ['1300', 'VAT receivable', 'asset', 'vat_in'],
  ['1500', 'Equipment', 'asset'],
  ['2000', 'Accounts payable', 'liability', 'ap'],
  ['2100', 'VAT payable', 'liability', 'vat_out'],
  ['2150', 'Goods received not invoiced', 'liability', 'grni'],
  ['2200', 'Payroll liabilities', 'liability', 'payroll_liab'],
  ['2500', 'Loans', 'liability'],
  ['3000', "Owner's equity", 'equity', 'equity'],
  ['3100', 'Retained earnings', 'equity', 'retained'],
  ['4000', 'Product sales', 'income', 'sales'],
  ['4100', 'Service revenue', 'income', 'service_rev'],
  ['4900', 'Other income', 'income'],
  ['5000', 'Cost of goods sold', 'expense', 'cogs'],
  ['5100', 'Inventory adjustments', 'expense', 'inv_adjust'],
  ['6000', 'Salaries and wages', 'expense', 'salary_exp'],
  ['6100', 'Rent', 'expense', 'rent'],
  ['6200', 'Utilities', 'expense', 'utilities'],
  ['6300', 'Marketing', 'expense', 'marketing'],
  ['6400', 'Office supplies', 'expense'],
  ['6900', 'General expenses', 'expense', 'expense'],
];

export async function setupCompany(companyId) {
  await Account.insertMany(
    DEFAULT_ACCOUNTS.map(([code, name, type, systemKey, isCash]) => ({
      company: companyId, code, name, type, systemKey, isCash: Boolean(isCash),
    }))
  );
  await Warehouse.create({ company: companyId, name: 'Main warehouse', code: 'MAIN', isDefault: true });
}
