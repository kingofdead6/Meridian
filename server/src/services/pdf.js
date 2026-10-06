import PDFDocument from 'pdfkit';

const fmt = (n, currency) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(n || 0);
const date = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

async function fetchImage(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

/** Streams a clean, printable invoice or bill to the response. */
export async function invoicePdf(res, invoice, company) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(res);

  const ink = '#16233A';
  const muted = '#66707A';
  const rule = '#DCE2DA';
  const green = '#2E6B4E';
  const cur = company.currency;
  const isCustomer = invoice.kind === 'customer';

  const logo = company.logo?.url ? await fetchImage(company.logo.url) : null;
  if (logo) {
    try { doc.image(logo, 50, 45, { fit: [120, 50] }); } catch { /* unsupported format */ }
  } else {
    doc.fillColor(ink).font('Helvetica-Bold').fontSize(18).text(company.name, 50, 50);
  }

  doc.fillColor(ink).font('Helvetica-Bold').fontSize(22).text(isCustomer ? 'Invoice' : 'Bill', 350, 45, { width: 195, align: 'right' });
  doc.font('Helvetica').fontSize(10).fillColor(muted).text(invoice.number, 350, 72, { width: 195, align: 'right' });

  doc.moveTo(50, 110).lineTo(545, 110).strokeColor(rule).stroke();

  const contact = invoice.contact || {};
  doc.fillColor(muted).fontSize(9).text(isCustomer ? 'Billed to' : 'From supplier', 50, 125);
  doc.fillColor(ink).font('Helvetica-Bold').fontSize(11).text(contact.name || '—', 50, 139);
  doc.font('Helvetica').fontSize(9).fillColor(muted)
    .text([contact.address, contact.city, contact.country].filter(Boolean).join(', ') || '', 50, 155, { width: 230 })
    .text(contact.email || '', 50, doc.y + 2);

  const meta = [
    ['Issued', date(invoice.date)],
    ['Due', date(invoice.dueDate)],
    ['Status', invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)],
  ];
  meta.forEach(([k, v], i) => {
    doc.fillColor(muted).fontSize(9).text(k, 350, 125 + i * 16, { width: 80 });
    doc.fillColor(ink).fontSize(9).text(v, 430, 125 + i * 16, { width: 115, align: 'right' });
  });

  doc.fillColor(muted).fontSize(9).text(company.name, 350, 180, { width: 195, align: 'right' });
  if (company.taxId) doc.text(`Tax ID ${company.taxId}`, 350, doc.y, { width: 195, align: 'right' });

  let y = 230;
  const cols = [50, 280, 330, 400, 445, 545];
  doc.rect(50, y, 495, 22).fill('#F3F5F2');
  doc.fillColor(muted).fontSize(8.5).font('Helvetica-Bold');
  ['Description', 'Qty', 'Unit price', 'Tax', 'Amount'].forEach((h, i) => {
    doc.text(h, cols[i] + 6, y + 7, { width: cols[i + 1] - cols[i] - 12, align: i === 0 ? 'left' : 'right' });
  });
  y += 22;
  doc.font('Helvetica').fontSize(9.5);

  for (const line of invoice.lines) {
    const name = `${line.description || line.product?.name || 'Item'}${line.discount ? ` (${line.discount}% off)` : ''}`;
    const h = Math.max(22, doc.heightOfString(name, { width: 218 }) + 12);
    if (y + h > 720) { doc.addPage(); y = 50; }
    doc.fillColor(ink).text(name, cols[0] + 6, y + 7, { width: 218 });
    doc.text(String(line.quantity), cols[1] + 6, y + 7, { width: 38, align: 'right' });
    doc.text(fmt(line.unitPrice, cur), cols[2] + 6, y + 7, { width: 58, align: 'right' });
    doc.fillColor(muted).text(`${line.taxRate}%`, cols[3] + 6, y + 7, { width: 33, align: 'right' });
    doc.fillColor(ink).text(fmt(line.subtotal, cur), cols[4] + 6, y + 7, { width: 88, align: 'right' });
    y += h;
    doc.moveTo(50, y).lineTo(545, y).strokeColor(rule).stroke();
  }

  y += 14;
  const totals = [['Subtotal', invoice.subtotal], ['Tax', invoice.taxTotal], ['Total', invoice.total]];
  if (invoice.amountPaid) totals.push(['Paid', -invoice.amountPaid], ['Balance due', invoice.total - invoice.amountPaid]);
  totals.forEach(([k, v]) => {
    const strong = k === 'Total' || k === 'Balance due';
    doc.font(strong ? 'Helvetica-Bold' : 'Helvetica').fontSize(strong ? 11 : 9.5)
      .fillColor(k === 'Balance due' ? green : ink)
      .text(k, 345, y, { width: 100 })
      .text(fmt(v, cur), 445, y, { width: 94, align: 'right' });
    y += strong ? 20 : 16;
  });

  if (invoice.notes) {
    doc.font('Helvetica').fontSize(9).fillColor(muted).text(invoice.notes, 50, Math.max(y + 20, 640), { width: 300 });
  }
  doc.page.margins.bottom = 0;
  doc.fontSize(8).fillColor(muted).text(
    [company.name, company.address, company.email, company.phone].filter(Boolean).join('   '),
    50, 790, { width: 495, align: 'center' }
  );
  doc.end();
}
