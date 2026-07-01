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

// Reusable header builder
function buildPDFHeader(doc, titleText) {
  // Logo
  const logoPath = path.join(__dirname, '..', 'resources', 'logo.png');
  if (fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, {
        fit: [120, 60],
        align: 'center'
      });
      doc.moveDown(0.5);
    } catch (e) {
      console.error('Error rendering logo in PDF:', e);
    }
  }

  doc.fillColor('#333333');
  doc.font('Helvetica-Bold').fontSize(22).text('ANUSHA BAZAAR', { align: 'center' });
  doc.font('Helvetica-Bold').fontSize(10).text('GSTIN: 36AIJPN3614J1Z4', { align: 'center' });
  doc.font('Helvetica').fontSize(10).text('FCV7+7Q8Rd Number 5, Plot No 11, Laxminagar Colony, Vivekananda Nagar Extension, Kukatpally, Hyderabad, Telangana 500072', { align: 'center' });
  doc.font('Helvetica-Bold').fontSize(10).text('Contact: 85229 18866', { align: 'center' });
  doc.moveDown(0.5);

  doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.5);

  doc.fillColor('#666666').font('Helvetica-Bold').fontSize(12).text(titleText, { align: 'center' });
  doc.moveDown(1);
}

export function generateSaleInvoicePDF(sale, stream) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(stream);

  buildPDFHeader(doc, 'SALES INVOICE / RECEIPT');

  // Metadata Grid (2 columns)
  const metaY = doc.y;
  doc.fillColor('#000000');
  
  // Left column
  doc.font('Helvetica-Bold').fontSize(10).text(`Invoice Number: `, 50, metaY, { continued: true });
  doc.font('Helvetica').text(sale.invoiceNumber);
  doc.font('Helvetica-Bold').text(`Sale Date: `, { continued: true });
  doc.font('Helvetica').text(sale.saleDate);
  doc.font('Helvetica-Bold').text(`Customer Name: `, { continued: true });
  doc.font('Helvetica').text(sale.customer ? sale.customer.name : 'N/A');
  doc.font('Helvetica-Bold').text(`Customer GST: `, { continued: true });
  doc.font('Helvetica').text(sale.customer && sale.customer.gst ? sale.customer.gst : 'N/A');

  // Right column
  doc.font('Helvetica-Bold').text(`Mobile: `, 300, metaY, { continued: true });
  doc.font('Helvetica').text(sale.customer && sale.customer.mobile ? sale.customer.mobile : 'N/A');
  doc.font('Helvetica-Bold').text(`Email: `, 300, doc.y, { continued: true });
  doc.font('Helvetica').text(sale.customer && sale.customer.email ? sale.customer.email : 'N/A');
  doc.font('Helvetica-Bold').text(`Payment Mode: `, 300, doc.y, { continued: true });
  doc.font('Helvetica').text(sale.paymentMode);
  doc.font('Helvetica-Bold').text(`Status: `, 300, doc.y, { continued: true });
  doc.font('Helvetica').text(sale.status);

  doc.moveDown(1.5);

  // Vehicle Transport details
  const hasVehicle = sale.vehicleNumber || sale.driverName || sale.driverNumber;
  if (hasVehicle) {
    const transportY = doc.y;
    doc.strokeColor('#e2e8f0').rect(50, transportY, 495, 45).stroke();
    doc.fillColor('#475569').font('Helvetica-Bold').fontSize(9).text('TRANSPORT & VEHICLE DETAILS', 60, transportY + 5);
    
    doc.fillColor('#000000').font('Helvetica-Bold').fontSize(8.5).text('Vehicle No: ', 60, transportY + 22, { continued: true });
    doc.font('Helvetica').text(sale.vehicleNumber || 'N/A', { continued: true });
    doc.font('Helvetica-Bold').text('   Driver Name: ', { continued: true });
    doc.font('Helvetica').text(sale.driverName || 'N/A', { continued: true });
    doc.font('Helvetica-Bold').text('   Driver Number: ', { continued: true });
    doc.font('Helvetica').text(sale.driverNumber || 'N/A');
    
    doc.moveDown(2);
  }

  // Draw Items Table Header
  const tableHeaderY = doc.y;
  doc.fillColor('#0D47A1').rect(50, tableHeaderY, 495, 20).fill();

  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9);
  doc.text('S.No', 55, tableHeaderY + 5, { width: 30, align: 'center' });
  doc.text('Product Name', 90, tableHeaderY + 5, { width: 200 });
  doc.text('Qty', 295, tableHeaderY + 5, { width: 60, align: 'center' });
  doc.text('Selling Price', 360, tableHeaderY + 5, { width: 85, align: 'right' });
  doc.text('Amount', 450, tableHeaderY + 5, { width: 90, align: 'right' });

  // Draw Items Rows
  let currentY = tableHeaderY + 20;
  let count = 1;
  doc.fillColor('#000000').font('Helvetica').fontSize(9);

  sale.saleItems.forEach(item => {
    // Add page if table rows overflow
    if (currentY > 700) {
      doc.addPage();
      currentY = 50;
      doc.fillColor('#0D47A1').rect(50, currentY, 495, 20).fill();
      doc.fillColor('#FFFFFF').font('Helvetica-Bold');
      doc.text('S.No', 55, currentY + 5, { width: 30, align: 'center' });
      doc.text('Product Name', 90, currentY + 5, { width: 200 });
      doc.text('Qty', 295, currentY + 5, { width: 60, align: 'center' });
      doc.text('Selling Price', 360, currentY + 5, { width: 85, align: 'right' });
      doc.text('Amount', 450, currentY + 5, { width: 90, align: 'right' });
      currentY += 20;
      doc.fillColor('#000000').font('Helvetica');
    }

    // Border
    doc.strokeColor('#e2e8f0').lineWidth(0.5)
       .moveTo(50, currentY).lineTo(545, currentY).stroke()
       .moveTo(50, currentY + 20).lineTo(545, currentY + 20).stroke();

    doc.text(count.toString(), 55, currentY + 5, { width: 30, align: 'center' });
    const productName = item.product ? `${item.product.name} (${item.product.productCode})` : 'Unknown Product';
    doc.text(productName, 90, currentY + 5, { width: 200, lineBreak: false });
    doc.text(`${item.quantity} ${item.unit}`, 295, currentY + 5, { width: 60, align: 'center' });
    doc.text(`₹ ${formatAmount(item.sellingPrice)}`, 360, currentY + 5, { width: 85, align: 'right' });
    doc.text(`₹ ${formatAmount(item.amount)}`, 450, currentY + 5, { width: 90, align: 'right' });

    currentY += 20;
    count++;
  });

  // Summary totals
  doc.moveDown(1.5);
  const summaryY = doc.y;

  if (summaryY > 650) {
    doc.addPage();
  }

  const rightAlignX = 350;
  const summaryWidth = 195;

  doc.font('Helvetica-Bold').fontSize(9);
  doc.text('Subtotal:', rightAlignX, doc.y, { width: 100 });
  doc.font('Helvetica').text(`₹ ${formatAmount(sale.subtotal)}`, rightAlignX + 100, doc.y - 11, { width: 95, align: 'right' });
  doc.moveDown(0.2);

  doc.font('Helvetica-Bold').text('Discount:', rightAlignX, doc.y, { width: 100 });
  doc.font('Helvetica').text(`₹ ${formatAmount(sale.discount)}`, rightAlignX + 100, doc.y - 11, { width: 95, align: 'right' });
  doc.moveDown(0.2);

  doc.font('Helvetica-Bold').text('GST Amount:', rightAlignX, doc.y, { width: 100 });
  doc.font('Helvetica').text(`₹ ${formatAmount(sale.gst)}`, rightAlignX + 100, doc.y - 11, { width: 95, align: 'right' });
  doc.moveDown(0.2);

  doc.font('Helvetica-Bold').text('Transport Charges:', rightAlignX, doc.y, { width: 110 });
  doc.font('Helvetica').text(`₹ ${formatAmount(sale.transportCharges)}`, rightAlignX + 110, doc.y - 11, { width: 85, align: 'right' });
  doc.moveDown(0.2);

  doc.strokeColor('#cccccc').lineWidth(1).moveTo(rightAlignX, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.3);

  doc.font('Helvetica-Bold').fontSize(10).text('Grand Total:', rightAlignX, doc.y, { width: 100 });
  doc.text(`₹ ${formatAmount(sale.grandTotal)}`, rightAlignX + 100, doc.y - 12, { width: 95, align: 'right' });

  // Signature Block
  doc.moveDown(3);
  const sigY = doc.y;
  doc.font('Helvetica-Bold').fontSize(9).text('For ANUSHA BAZAAR', 350, sigY, { width: 195, align: 'center' });
  doc.moveDown(3);
  doc.font('Helvetica-Bold').text('_________________________\nAuthorized Signatory', 350, doc.y, { width: 195, align: 'center' });

  // Footer notes
  doc.moveDown(2);
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#666666').text('Thank you for doing business with us!', 50, doc.y, { align: 'center' });

  doc.end();
}

export function generatePurchaseInvoicePDF(purchase, stream) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(stream);

  buildPDFHeader(doc, 'PURCHASE INVOICE RECORD');

  // Metadata Grid
  const metaY = doc.y;
  doc.fillColor('#000000');
  
  // Left column
  doc.font('Helvetica-Bold').fontSize(10).text(`Purchase Number: `, 50, metaY, { continued: true });
  doc.font('Helvetica').text(purchase.purchaseNumber);
  doc.font('Helvetica-Bold').text(`Purchase Date: `, { continued: true });
  doc.font('Helvetica').text(purchase.purchaseDate);
  doc.font('Helvetica-Bold').text(`Supplier Name: `, { continued: true });
  doc.font('Helvetica').text(purchase.supplier ? purchase.supplier.name : 'N/A');
  doc.font('Helvetica-Bold').text(`Supplier GST: `, { continued: true });
  doc.font('Helvetica').text(purchase.supplier && purchase.supplier.gst ? purchase.supplier.gst : 'N/A');

  // Right column
  doc.font('Helvetica-Bold').text(`Supplier Mobile: `, 300, metaY, { continued: true });
  doc.font('Helvetica').text(purchase.supplier && purchase.supplier.mobile ? purchase.supplier.mobile : 'N/A');
  doc.font('Helvetica-Bold').text(`Supplier Email: `, 300, doc.y, { continued: true });
  doc.font('Helvetica').text(purchase.supplier && purchase.supplier.email ? purchase.supplier.email : 'N/A');
  doc.font('Helvetica-Bold').text(`Payment Mode: `, 300, doc.y, { continued: true });
  doc.font('Helvetica').text(purchase.paymentMode);
  doc.font('Helvetica-Bold').text(`Status: `, 300, doc.y, { continued: true });
  doc.font('Helvetica').text(purchase.status);

  doc.moveDown(2);

  // Draw Items Table Header
  const tableHeaderY = doc.y;
  doc.fillColor('#0D47A1').rect(50, tableHeaderY, 495, 20).fill();

  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9);
  doc.text('S.No', 55, tableHeaderY + 5, { width: 30, align: 'center' });
  doc.text('Product Name', 90, tableHeaderY + 5, { width: 200 });
  doc.text('Qty', 295, tableHeaderY + 5, { width: 60, align: 'center' });
  doc.text('Purchase Price', 360, tableHeaderY + 5, { width: 85, align: 'right' });
  doc.text('Amount', 450, tableHeaderY + 5, { width: 90, align: 'right' });

  // Draw Items Rows
  let currentY = tableHeaderY + 20;
  let count = 1;
  doc.fillColor('#000000').font('Helvetica').fontSize(9);

  purchase.purchaseItems.forEach(item => {
    if (currentY > 700) {
      doc.addPage();
      currentY = 50;
      doc.fillColor('#0D47A1').rect(50, currentY, 495, 20).fill();
      doc.fillColor('#FFFFFF').font('Helvetica-Bold');
      doc.text('S.No', 55, currentY + 5, { width: 30, align: 'center' });
      doc.text('Product Name', 90, currentY + 5, { width: 200 });
      doc.text('Qty', 295, currentY + 5, { width: 60, align: 'center' });
      doc.text('Purchase Price', 360, currentY + 5, { width: 85, align: 'right' });
      doc.text('Amount', 450, currentY + 5, { width: 90, align: 'right' });
      currentY += 20;
      doc.fillColor('#000000').font('Helvetica');
    }

    doc.strokeColor('#e2e8f0').lineWidth(0.5)
       .moveTo(50, currentY).lineTo(545, currentY).stroke()
       .moveTo(50, currentY + 20).lineTo(545, currentY + 20).stroke();

    doc.text(count.toString(), 55, currentY + 5, { width: 30, align: 'center' });
    const productName = item.product ? `${item.product.name} (${item.product.productCode})` : 'Unknown Product';
    doc.text(productName, 90, currentY + 5, { width: 200, lineBreak: false });
    doc.text(`${item.quantity} ${item.unit}`, 295, currentY + 5, { width: 60, align: 'center' });
    doc.text(`₹ ${formatAmount(item.purchasePrice)}`, 360, currentY + 5, { width: 85, align: 'right' });
    doc.text(`₹ ${formatAmount(item.amount)}`, 450, currentY + 5, { width: 90, align: 'right' });

    currentY += 20;
    count++;
  });

  // Summary totals
  doc.moveDown(1.5);
  const summaryY = doc.y;

  if (summaryY > 650) {
    doc.addPage();
  }

  const rightAlignX = 350;

  doc.font('Helvetica-Bold').fontSize(9);
  doc.text('Subtotal:', rightAlignX, doc.y, { width: 100 });
  doc.font('Helvetica').text(`₹ ${formatAmount(purchase.subtotal)}`, rightAlignX + 100, doc.y - 11, { width: 95, align: 'right' });
  doc.moveDown(0.2);

  doc.font('Helvetica-Bold').text('Discount:', rightAlignX, doc.y, { width: 100 });
  doc.font('Helvetica').text(`₹ ${formatAmount(purchase.discount)}`, rightAlignX + 100, doc.y - 11, { width: 95, align: 'right' });
  doc.moveDown(0.2);

  doc.font('Helvetica-Bold').text('GST Amount:', rightAlignX, doc.y, { width: 100 });
  doc.font('Helvetica').text(`₹ ${formatAmount(purchase.gst)}`, rightAlignX + 100, doc.y - 11, { width: 95, align: 'right' });
  doc.moveDown(0.2);

  doc.strokeColor('#cccccc').lineWidth(1).moveTo(rightAlignX, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.3);

  doc.font('Helvetica-Bold').fontSize(10).text('Grand Total:', rightAlignX, doc.y, { width: 100 });
  doc.text(`₹ ${formatAmount(purchase.grandTotal)}`, rightAlignX + 100, doc.y - 12, { width: 95, align: 'right' });

  // Signature Block
  doc.moveDown(3);
  const sigY = doc.y;
  doc.font('Helvetica-Bold').fontSize(9).text('For ANUSHA BAZAAR', 350, sigY, { width: 195, align: 'center' });
  doc.moveDown(3);
  doc.font('Helvetica-Bold').text('_________________________\nAuthorized Signatory', 350, doc.y, { width: 195, align: 'center' });

  doc.end();
}
