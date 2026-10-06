export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// Shared line math for orders and invoices
export function computeLine(line) {
  const qty = Number(line.quantity) || 0;
  const price = Number(line.unitPrice) || 0;
  const discount = Number(line.discount) || 0;
  const rate = Number(line.taxRate) || 0;
  const subtotal = round2(qty * price * (1 - discount / 100));
  const tax = round2((subtotal * rate) / 100);
  return { subtotal, tax, total: round2(subtotal + tax) };
}

export function computeTotals(doc) {
  let subtotal = 0;
  let taxTotal = 0;
  for (const line of doc.lines || []) {
    const c = computeLine(line);
    line.subtotal = c.subtotal;
    line.tax = c.tax;
    subtotal += c.subtotal;
    taxTotal += c.tax;
  }
  doc.subtotal = round2(subtotal);
  doc.taxTotal = round2(taxTotal);
  doc.total = round2(subtotal + taxTotal);
}
