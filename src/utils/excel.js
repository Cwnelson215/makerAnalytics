const ExcelJS = require('exceljs');

const TIME_REGEX = /^(\d+):(\d{2}):(\d{2})$/;

// Excel stores durations as fractions of a day
function toExcelValue(cell) {
  const match = typeof cell === 'string' && cell.match(TIME_REGEX);
  if (match) {
    const [, hrs, mins, secs] = match.map(Number);
    return { value: (hrs * 3600 + mins * 60 + secs) / 86400, numFmt: '[h]:mm:ss' };
  }
  return { value: cell };
}

async function buildWorkbook(sections, startLabel, endLabel) {
  const workbook = new ExcelJS.Workbook();

  for (const { title, headers, rows } of sections) {
    // Sheet names are limited to 31 chars and can't contain : \ / ? * [ ]
    const sheet = workbook.addWorksheet(title.replace(/[:\\/?*[\]]/g, '').slice(0, 31));

    sheet.addRow([title]).font = { bold: true, size: 14 };
    sheet.addRow([`${startLabel} to ${endLabel}`]);
    sheet.addRow([]);

    if (!headers) {
      sheet.addRow([rows]);
      continue;
    }

    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
    });

    rows.forEach((row, i) => {
      const excelRow = sheet.addRow(row.map(cell => toExcelValue(cell).value));
      row.forEach((cell, j) => {
        const { numFmt } = toExcelValue(cell);
        if (numFmt) excelRow.getCell(j + 1).numFmt = numFmt;
      });
      if (i === rows.length - 1) excelRow.font = { bold: true };
    });

    sheet.columns.forEach((col, i) => {
      col.width = i === 0 ? 18 : Math.max(12, String(headers[i] || '').length + 4);
    });
  }

  return workbook.xlsx.writeBuffer();
}

module.exports = { buildWorkbook };
