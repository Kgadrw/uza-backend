const { parse } = require('json2csv');
const PDFDocument = require('pdfkit');

const exportToCSV = (data, title) => {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    // Get fields from first object
    const fields = Object.keys(data[0]);
    const csv = parse(data, { fields });

    return csv;
  } catch (error) {
    throw new Error(`CSV export failed: ${error.message}`);
  }
};

const exportToPDF = (data, title) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });

      // Collect PDF data
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Add header
      doc.rect(0, 0, doc.page.width, 30).fill('#10b981');
      doc.fillColor('#ffffff')
        .fontSize(12)
        .text('UZAEMPOWER', 50, 10, { align: 'center' });

      // Add title
      doc.fillColor('#000000')
        .fontSize(16)
        .text(title, 50, 50);

      // Add table
      if (data && data.length > 0) {
        const fields = Object.keys(data[0]);
        let y = 100;

        // Table header
        doc.fontSize(10).font('Helvetica-Bold');
        fields.forEach((field, index) => {
          doc.text(field, 50 + index * 100, y);
        });
        y += 20;

        // Table rows
        doc.font('Helvetica');
        data.forEach((row) => {
          fields.forEach((field, index) => {
            const value = String(row[field] || '');
            doc.text(value.substring(0, 20), 50 + index * 100, y);
          });
          y += 20;
          if (y > doc.page.height - 50) {
            doc.addPage();
            y = 50;
          }
        });
      }

      // Add footer
      doc.fontSize(8)
        .fillColor('#666666')
        .text('Powered by UZAEMPOWER', doc.page.width / 2, doc.page.height - 30, {
          align: 'center',
        });

      doc.end();
    } catch (error) {
      reject(new Error(`PDF export failed: ${error.message}`));
    }
  });
};

module.exports = {
  exportToCSV,
  exportToPDF,
};

