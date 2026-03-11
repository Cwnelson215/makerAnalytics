const { toMonthKey } = require('../utils/date');

function processPrinting(items, columnMap) {
  const dateCol = columnMap.dateCol;
  const typeCol = columnMap.typeCol;
  const countCol = columnMap.countCol;

  const monthly = {};

  for (const item of items) {
    const dateStr = item[dateCol];
    if (!dateStr) continue;

    const key = toMonthKey(dateStr);
    if (!monthly[key]) {
      monthly[key] = { total: 0, fdm: 0, sla: 0 };
    }

    const count = parseInt(item[countCol], 10) || 1;
    monthly[key].total += count;
    const type = (item[typeCol] || '').toLowerCase();
    if (type === 'fdm') monthly[key].fdm += count;
    else if (type === 'sla') monthly[key].sla += count;
  }

  const sortedKeys = Object.keys(monthly).sort();
  const rows = sortedKeys.map(key => ({
    month: key,
    total: monthly[key].total,
    fdm: monthly[key].fdm,
    sla: monthly[key].sla,
  }));

  const totals = rows.reduce(
    (acc, r) => {
      acc.total += r.total;
      acc.fdm += r.fdm;
      acc.sla += r.sla;
      return acc;
    },
    { month: 'Totals', total: 0, fdm: 0, sla: 0 }
  );
  rows.push(totals);

  return {
    headers: ['Month', 'Total', 'FDM', 'SLA'],
    rows: rows.map(r => [r.month, r.total, r.fdm, r.sla]),
  };
}

module.exports = { processPrinting };
