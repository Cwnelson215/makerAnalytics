const { toMonthKey } = require('../utils/date');

function processPoster(items, columnMap) {
  const dateCol = columnMap.dateCol;
  const materialCol = columnMap.materialCol;

  const monthly = {};

  for (const item of items) {
    const dateStr = item[dateCol];
    if (!dateStr) continue;

    const key = toMonthKey(dateStr);
    if (!monthly[key]) {
      monthly[key] = { total: 0, matte: 0, synthetic: 0 };
    }

    monthly[key].total++;
    const material = (item[materialCol] || '').toLowerCase();
    if (material === 'matte') monthly[key].matte++;
    else if (material === 'synthetic') monthly[key].synthetic++;
  }

  const sortedKeys = Object.keys(monthly).sort();
  const rows = sortedKeys.map(key => ({
    month: key,
    total: monthly[key].total,
    matte: monthly[key].matte,
    synthetic: monthly[key].synthetic,
  }));

  const totals = rows.reduce(
    (acc, r) => {
      acc.total += r.total;
      acc.matte += r.matte;
      acc.synthetic += r.synthetic;
      return acc;
    },
    { month: 'Totals', total: 0, matte: 0, synthetic: 0 }
  );
  rows.push(totals);

  return {
    headers: ['Month', 'Total', 'Matte', 'Synthetic'],
    rows: rows.map(r => [r.month, r.total, r.matte, r.synthetic]),
  };
}

module.exports = { processPoster };
