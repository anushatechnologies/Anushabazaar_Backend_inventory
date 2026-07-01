import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function formatAmount(amount) {
  if (amount == null) return "0.00";
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(parseFloat(amount));
}

// Reusable header builder (matching Java font sizes and styles)
function buildPDFHeader(doc, titleText) {
  // Logo drawing with layout spacing fixes to avoid text overlap
  const logoPath = path.join(__dirname, '..', 'resources', 'logo.png');
  if (fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, {
        fit: [120, 60],
        align: 'center'
      });
      // Move cursor down explicitly past the image height since image doesn't advance it
      doc.y += 65;
    } catch (e) {
      console.error('Error rendering logo in PDF:', e);
    }
  }

  doc.fillColor('#333333');
  doc.font('Helvetica-Bold').fontSize(22).text('ANUSHA BAZAAR', { align: 'center' });
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000').text('GSTIN: 36AIJPN3614J1Z4', { align: 'center' });
  doc.font('Helvetica').fontSize(10).text('FCV7+7Q8Rd Number 5, Plot No 11, Laxminagar Colony, Vivekananda Nagar Extension, Kukatpally, Hyderabad, Telangana 500072', { align: 'center' });
  doc.font('Helvetica-Bold').fontSize(10).text('Contact: 85229 18866', { align: 'center' });
  doc.moveDown(0.5);

  doc.fillColor('#808080').font('Helvetica-Bold').fontSize(12).text(titleText, { align: 'center' });
  doc.moveDown(1.5);
}

// Draw a structured details table with headers and cell borders (matching iText/OpenPDF)
function drawDetailsTable(doc, startY, headerText, headerBgColor, rows) {
  const tableWidth = 495;
  const colWidth = tableWidth / 2;
  const rowHeight = 20;
  let currentY = startY;

  // 1. Draw Header Cell
  doc.fillColor(headerBgColor).rect(50, currentY, tableWidth, rowHeight).fill();
  doc.strokeColor('#c8c8c8').lineWidth(0.5).rect(50, currentY, tableWidth, rowHeight).stroke();
  doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10).text(headerText, 56, currentY + 5);
  currentY += rowHeight;

  // 2. Draw Key-Value Cells in 2 Columns
  doc.font('Helvetica').fontSize(10);
  for (let i = 0; i < rows.length; i += 2) {
    const leftText = rows[i] || '';
    const rightText = rows[i + 1] || '';

    // Draw borders & text for Left Cell
    doc.strokeColor('#c8c8c8').lineWidth(0.5).rect(50, currentY, colWidth, rowHeight).stroke();
    doc.fillColor('#000000').text(leftText, 56, currentY + 5, { width: colWidth - 10, lineBreak: false });

    // Draw borders & text for Right Cell
    doc.strokeColor('#c8c8c8').lineWidth(0.5).rect(50 + colWidth, currentY, colWidth, rowHeight).stroke();
    doc.fillColor('#000000').text(rightText, 56 + colWidth, currentY + 5, { width: colWidth - 10, lineBreak: false });

    currentY += rowHeight;
  }

  return currentY;
}

export function generateSaleInvoicePDF(sale, stream) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(stream);

  buildPDFHeader(doc, 'SALES INVOICE / RECEIPT');

  // Draw Invoice Details Table (Background: #dce6f2)
  const detailsRows = [
    `Invoice Number: ${sale.invoiceNumber}`,
    `Sale Date: ${sale.saleDate}`,
    `Customer Name: ${sale.customer ? sale.customer.name : 'N/A'}`,
    `Customer GST: ${sale.customer && sale.customer.gst ? sale.customer.gst : 'N/A'}`,
    `Mobile: ${sale.customer && sale.customer.mobile ? sale.customer.mobile : 'N/A'}`,
    `Email: ${sale.customer && sale.customer.email ? sale.customer.email : 'N/A'}`,
    `Payment Mode: ${sale.paymentMode}`,
    `Status: ${sale.status}`
  ];

  let nextY = drawDetailsTable(doc, doc.y, 'Invoice Details', '#dce6f2', detailsRows);
  doc.y = nextY + 15; // Set next pointer with spacing

  // Draw Vehicle / Transport Details (only if info is present)
  const hasVehicle = (sale.vehicleNumber && sale.vehicleNumber.trim() !== '')
                  || (sale.driverName && sale.driverName.trim() !== '')
                  || (sale.driverNumber && sale.driverNumber.trim() !== '');

  if (hasVehicle) {
    const vehicleRows = [
      `Vehicle No.: ${sale.vehicleNumber || 'N/A'}`,
      `Driver Name: ${sale.driverName || 'N/A'}`,
      `Driver Number: ${sale.driverNumber || 'N/A'}`,
      '' // Blank field to keep 2-column layout even
    ];
    let nextVehY = drawDetailsTable(doc, doc.y, 'Vehicle / Transport Details', '#dce6f2', vehicleRows);
    doc.y = nextVehY + 15;
  }

  // Items Table Definitions
  const colWidths = [35, 195, 75, 95, 95];
  const colOffsets = [50, 85, 280, 355, 450]; // Cumulative X coordinates
  const rowHeight = 20;

  // Draw Items Table Header (Background: Navy Blue #0d47a1, Text: White)
  const tableHeaderY = doc.y;
  doc.fillColor('#0d47a1').rect(50, tableHeaderY, 495, rowHeight).fill();
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10);

  const headers = ['S.No', 'Product Name', 'Qty', 'Selling Price', 'Amount'];
  headers.forEach((h, idx) => {
    doc.strokeColor('#c8c8c8').lineWidth(0.5).rect(colOffsets[idx], tableHeaderY, colWidths[idx], rowHeight).stroke();
    const align = (idx === 0 || idx === 2) ? 'center' : (idx === 3 || idx === 4) ? 'right' : 'left';
    const xPadding = align === 'center' ? 0 : align === 'right' ? 5 : 6;
    doc.text(h, colOffsets[idx] + (align === 'left' ? xPadding : 0), tableHeaderY + 5, {
      width: colWidths[idx] - (align === 'right' ? xPadding * 2 : 0),
      align: align
    });
  });

  // Draw Items Rows with Borders
  let currentY = tableHeaderY + rowHeight;
  let count = 1;
  doc.fillColor('#000000').font('Helvetica').fontSize(10);

  sale.saleItems.forEach(item => {
    // Add page if table rows overflow
    if (currentY > 720) {
      doc.addPage();
      currentY = 50;

      // Draw headers on new page
      doc.fillColor('#0d47a1').rect(50, currentY, 495, rowHeight).fill();
      doc.fillColor('#ffffff').font('Helvetica-Bold');
      headers.forEach((h, idx) => {
        doc.strokeColor('#c8c8c8').lineWidth(0.5).rect(colOffsets[idx], currentY, colWidths[idx], rowHeight).stroke();
        const align = (idx === 0 || idx === 2) ? 'center' : (idx === 3 || idx === 4) ? 'right' : 'left';
        const xPadding = align === 'center' ? 0 : align === 'right' ? 5 : 6;
        doc.text(h, colOffsets[idx] + (align === 'left' ? xPadding : 0), currentY + 5, {
          width: colWidths[idx] - (align === 'right' ? xPadding * 2 : 0),
          align: align
        });
      });
      currentY += rowHeight;
      doc.fillColor('#000000').font('Helvetica');
    }

    const rowData = [
      count.toString(),
      item.product ? `${item.product.name} (${item.product.productCode})` : 'Unknown Product',
      `${item.quantity} ${item.unit}`,
      `₹ ${formatAmount(item.sellingPrice)}`,
      `₹ ${formatAmount(item.amount)}`
    ];

    rowData.forEach((val, idx) => {
      doc.strokeColor('#c8c8c8').lineWidth(0.5).rect(colOffsets[idx], currentY, colWidths[idx], rowHeight).stroke();
      const align = (idx === 0 || idx === 2) ? 'center' : (idx === 3 || idx === 4) ? 'right' : 'left';
      const xPadding = align === 'center' ? 0 : align === 'right' ? 5 : 6;
      doc.text(val, colOffsets[idx] + (align === 'left' ? xPadding : 0), currentY + 5, {
        width: colWidths[idx] - (align === 'right' ? xPadding * 2 : 0),
        align: align,
        lineBreak: false
      });
    });

    currentY += rowHeight;
    count++;
  });

  doc.y = currentY + 15;

  // Add page if summary overflows
  if (doc.y > 680) {
    doc.addPage();
  }

  // Draw Summary Totals Table Box (Width: 198pt aligned on the right)
  const summaryY = doc.y;
  const summaryXLabel = 347;
  const summaryXVal = 447;
  const summaryWidthLabel = 100;
  const summaryWidthVal = 98;
  let currentSumY = summaryY;

  const summaryRows = [
    { label: 'Subtotal:', val: `₹ ${formatAmount(sale.subtotal)}` },
    { label: 'Discount:', val: `₹ ${formatAmount(sale.discount)}` },
    { label: 'GST Amount:', val: `₹ ${formatAmount(sale.gst)}` },
    { label: 'Transport Charges:', val: `₹ ${formatAmount(sale.transportCharges)}` },
    { label: 'Grand Total:', val: `₹ ${formatAmount(sale.grandTotal)}`, bold: true }
  ];

  summaryRows.forEach(row => {
    // Label cell
    doc.strokeColor('#c8c8c8').lineWidth(0.5).rect(summaryXLabel, currentSumY, summaryWidthLabel, rowHeight).stroke();
    doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10).text(row.label, summaryXLabel + 6, currentSumY + 5);

    // Value cell
    doc.strokeColor('#c8c8c8').lineWidth(0.5).rect(summaryXVal, currentSumY, summaryWidthVal, rowHeight).stroke();
    doc.fillColor('#000000').font(row.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(10).text(row.val, summaryXVal, currentSumY + 5, {
      width: summaryWidthVal - 6,
      align: 'right'
    });

    currentSumY += rowHeight;
  });

  // Draw Signature Section
  const sigY = currentSumY + 30;
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000');
  doc.text('For ANUSHA BAZAAR', 347, sigY, { width: 198, align: 'center' });
  doc.text('_________________________\nAuthorized Signatory', 347, sigY + 60, { width: 198, align: 'center' });

  // Thank You Note
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#808080');
  doc.text('Thank you for doing business with us!', 50, sigY + 110, { align: 'center' });

  doc.end();
}

export function generatePurchaseInvoicePDF(purchase, stream) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(stream);

  buildPDFHeader(doc, 'PURCHASE INVOICE RECORD');

  // Draw Purchase Details Table (Background: Grey #f0f0f0)
  const detailsRows = [
    `Purchase Number: ${purchase.purchaseNumber}`,
    `Purchase Date: ${purchase.purchaseDate}`,
    `Supplier Name: ${purchase.supplier ? purchase.supplier.name : 'N/A'}`,
    `Supplier GST: ${purchase.supplier && purchase.supplier.gst ? purchase.supplier.gst : 'N/A'}`,
    `Supplier Mobile: ${purchase.supplier && purchase.supplier.mobile ? purchase.supplier.mobile : 'N/A'}`,
    `Supplier Email: ${purchase.supplier && purchase.supplier.email ? purchase.supplier.email : 'N/A'}`,
    `Payment Mode: ${purchase.paymentMode}`,
    `Status: ${purchase.status}`
  ];

  let nextY = drawDetailsTable(doc, doc.y, 'Purchase Details', '#f0f0f0', detailsRows);
  doc.y = nextY + 15;

  // Items Table Definitions
  const colWidths = [35, 195, 75, 95, 95];
  const colOffsets = [50, 85, 280, 355, 450];
  const rowHeight = 20;

  // Draw Items Table Header (Background: Navy Blue #0d47a1, Text: White)
  const tableHeaderY = doc.y;
  doc.fillColor('#0d47a1').rect(50, tableHeaderY, 495, rowHeight).fill();
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10);

  const headers = ['S.No', 'Product Name', 'Qty', 'Purchase Price', 'Amount'];
  headers.forEach((h, idx) => {
    doc.strokeColor('#c8c8c8').lineWidth(0.5).rect(colOffsets[idx], tableHeaderY, colWidths[idx], rowHeight).stroke();
    const align = (idx === 0 || idx === 2) ? 'center' : (idx === 3 || idx === 4) ? 'right' : 'left';
    const xPadding = align === 'center' ? 0 : align === 'right' ? 5 : 6;
    doc.text(h, colOffsets[idx] + (align === 'left' ? xPadding : 0), tableHeaderY + 5, {
      width: colWidths[idx] - (align === 'right' ? xPadding * 2 : 0),
      align: align
    });
  });

  // Draw Items Rows with Borders
  let currentY = tableHeaderY + rowHeight;
  let count = 1;
  doc.fillColor('#000000').font('Helvetica').fontSize(10);

  purchase.purchaseItems.forEach(item => {
    if (currentY > 720) {
      doc.addPage();
      currentY = 50;

      // Draw headers on new page
      doc.fillColor('#0d47a1').rect(50, currentY, 495, rowHeight).fill();
      doc.fillColor('#ffffff').font('Helvetica-Bold');
      headers.forEach((h, idx) => {
        doc.strokeColor('#c8c8c8').lineWidth(0.5).rect(colOffsets[idx], currentY, colWidths[idx], rowHeight).stroke();
        const align = (idx === 0 || idx === 2) ? 'center' : (idx === 3 || idx === 4) ? 'right' : 'left';
        const xPadding = align === 'center' ? 0 : align === 'right' ? 5 : 6;
        doc.text(h, colOffsets[idx] + (align === 'left' ? xPadding : 0), currentY + 5, {
          width: colWidths[idx] - (align === 'right' ? xPadding * 2 : 0),
          align: align
        });
      });
      currentY += rowHeight;
      doc.fillColor('#000000').font('Helvetica');
    }

    const rowData = [
      count.toString(),
      item.product ? `${item.product.name} (${item.product.productCode})` : 'Unknown Product',
      `${item.quantity} ${item.unit}`,
      `₹ ${formatAmount(item.purchasePrice)}`,
      `₹ ${formatAmount(item.amount)}`
    ];

    rowData.forEach((val, idx) => {
      doc.strokeColor('#c8c8c8').lineWidth(0.5).rect(colOffsets[idx], currentY, colWidths[idx], rowHeight).stroke();
      const align = (idx === 0 || idx === 2) ? 'center' : (idx === 3 || idx === 4) ? 'right' : 'left';
      const xPadding = align === 'center' ? 0 : align === 'right' ? 5 : 6;
      doc.text(val, colOffsets[idx] + (align === 'left' ? xPadding : 0), currentY + 5, {
        width: colWidths[idx] - (align === 'right' ? xPadding * 2 : 0),
        align: align,
        lineBreak: false
      });
    });

    currentY += rowHeight;
    count++;
  });

  doc.y = currentY + 15;

  if (doc.y > 680) {
    doc.addPage();
  }

  // Draw Summary Totals Table Box (Width: 198pt aligned on the right)
  const summaryY = doc.y;
  const summaryXLabel = 347;
  const summaryXVal = 447;
  const summaryWidthLabel = 100;
  const summaryWidthVal = 98;
  let currentSumY = summaryY;

  const summaryRows = [
    { label: 'Subtotal:', val: `₹ ${formatAmount(purchase.subtotal)}` },
    { label: 'Discount:', val: `₹ ${formatAmount(purchase.discount)}` },
    { label: 'GST Amount:', val: `₹ ${formatAmount(purchase.gst)}` },
    { label: 'Grand Total:', val: `₹ ${formatAmount(purchase.grandTotal)}`, bold: true }
  ];

  summaryRows.forEach(row => {
    doc.strokeColor('#c8c8c8').lineWidth(0.5).rect(summaryXLabel, currentSumY, summaryWidthLabel, rowHeight).stroke();
    doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10).text(row.label, summaryXLabel + 6, currentSumY + 5);

    doc.strokeColor('#c8c8c8').lineWidth(0.5).rect(summaryXVal, currentSumY, summaryWidthVal, rowHeight).stroke();
    doc.fillColor('#000000').font(row.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(10).text(row.val, summaryXVal, currentSumY + 5, {
      width: summaryWidthVal - 6,
      align: 'right'
    });

    currentSumY += rowHeight;
  });

  // Draw Signature Section
  const sigY = currentSumY + 30;
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000');
  doc.text('For ANUSHA BAZAAR', 347, sigY, { width: 198, align: 'center' });
  doc.text('_________________________\nAuthorized Signatory', 347, sigY + 60, { width: 198, align: 'center' });

  doc.end();
}
