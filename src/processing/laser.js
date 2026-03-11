const { toMonthKey } = require('../utils/date');

function formatTime(totalSeconds) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function processLaser(items, columnMap) {
  const dateCol = columnMap.dateCol;
  const filesCol = columnMap.filesCol;
  const minutesCol = columnMap.minutesCol;
  const secondsCol = columnMap.secondsCol;

  const monthly = {};
  const grandTotals = { requests: 0, files: 0, totalSeconds: 0 };

  for (const item of items) {
    const dateStr = item[dateCol];
    if (!dateStr) continue;

    const key = toMonthKey(dateStr);
    if (!monthly[key]) {
      monthly[key] = { requests: 0, files: 0, totalSeconds: 0 };
    }

    const m = monthly[key];
    m.requests++;
    const fileCount = parseInt(item[filesCol], 10) || 1;
    m.files += fileCount;

    const mins = parseInt(item[minutesCol], 10) || 0;
    const secs = parseInt(item[secondsCol], 10) || 0;
    const itemSeconds = mins * 60 + secs;
    m.totalSeconds += itemSeconds;

    grandTotals.requests++;
    grandTotals.files += fileCount;
    grandTotals.totalSeconds += itemSeconds;
  }

  const sortedKeys = Object.keys(monthly).sort();
  const headers = ['Month', 'Requests', 'Files', 'Time'];

  const rows = sortedKeys.map(key => {
    const m = monthly[key];
    return [key, m.requests, m.files, formatTime(m.totalSeconds)];
  });

  rows.push(['Totals', grandTotals.requests, grandTotals.files, formatTime(grandTotals.totalSeconds)]);

  return { headers, rows };
}

module.exports = { processLaser };
