import ExcelJS from 'exceljs';

export async function purchasesToExcel(purchases) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Purchases Report');

  const columns = [
    { header: 'ID', key: 'id' },
    { header: 'Purchase Number', key: 'purchaseNumber' },
    { header: 'Date', key: 'purchaseDate' },
    { header: 'Supplier', key: 'supplierName' },
    { header: 'Subtotal', key: 'subtotal' },
    { header: 'Discount', key: 'discount' },
    { header: 'GST', key: 'gst' },
    { header: 'Grand Total', key: 'grandTotal' },
    { header: 'Payment Mode', key: 'paymentMode' },
    { header: 'Status', key: 'status' }
  ];

  sheet.columns = columns.map(c => ({ ...c, width: 15 }));

  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0D47A1' } // Dark blue matching IndexedColors.DARK_BLUE
    };
    cell.font = {
      color: { argb: 'FFFFFFFF' },
      bold: true
    };
    cell.alignment = { horizontal: 'center' };
  });

  purchases.forEach((purchase) => {
    sheet.addRow({
      id: Number(purchase.id),
      purchaseNumber: purchase.purchaseNumber,
      purchaseDate: purchase.purchaseDate,
      supplierName: purchase.supplier ? purchase.supplier.name : 'N/A',
      subtotal: Number(purchase.subtotal),
      discount: Number(purchase.discount),
      gst: Number(purchase.gst),
      grandTotal: Number(purchase.grandTotal),
      paymentMode: purchase.paymentMode,
      status: purchase.status
    });
  });

  // Auto-fit columns
  sheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell({ includeHeader: true }, (cell) => {
      const val = cell.value ? cell.value.toString() : '';
      if (val.length > maxLength) {
        maxLength = val.length;
      }
    });
    column.width = Math.max(maxLength + 3, 10);
  });

  return await workbook.xlsx.writeBuffer();
}

export async function salesToExcel(sales) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Sales Report');

  const columns = [
    { header: 'ID', key: 'id' },
    { header: 'Invoice Number', key: 'invoiceNumber' },
    { header: 'Date', key: 'saleDate' },
    { header: 'Customer', key: 'customerName' },
    { header: 'Subtotal', key: 'subtotal' },
    { header: 'Discount', key: 'discount' },
    { header: 'GST', key: 'gst' },
    { header: 'Transport Charges', key: 'transportCharges' },
    { header: 'Grand Total', key: 'grandTotal' },
    { header: 'Payment Mode', key: 'paymentMode' },
    { header: 'Status', key: 'status' }
  ];

  sheet.columns = columns.map(c => ({ ...c, width: 15 }));

  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1B5E20' } // Dark green matching IndexedColors.DARK_GREEN
    };
    cell.font = {
      color: { argb: 'FFFFFFFF' },
      bold: true
    };
    cell.alignment = { horizontal: 'center' };
  });

  sales.forEach((sale) => {
    sheet.addRow({
      id: Number(sale.id),
      invoiceNumber: sale.invoiceNumber,
      saleDate: sale.saleDate,
      customerName: sale.customer ? sale.customer.name : 'N/A',
      subtotal: Number(sale.subtotal),
      discount: Number(sale.discount),
      gst: Number(sale.gst),
      transportCharges: Number(sale.transportCharges || 0.0),
      grandTotal: Number(sale.grandTotal),
      paymentMode: sale.paymentMode,
      status: sale.status
    });
  });

  // Auto-fit columns
  sheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell({ includeHeader: true }, (cell) => {
      const val = cell.value ? cell.value.toString() : '';
      if (val.length > maxLength) {
        maxLength = val.length;
      }
    });
    column.width = Math.max(maxLength + 3, 10);
  });

  return await workbook.xlsx.writeBuffer();
}
