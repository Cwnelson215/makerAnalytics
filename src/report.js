const { fetchBoardItems } = require('./api/mondayClient');
const { processPrinting } = require('./processing/printing');
const { processPoster } = require('./processing/poster');
const { processLaser } = require('./processing/laser');
const { escapeHtml } = require('./utils/html');
const { formatDate } = require('./utils/date');

const QUEUE_CONFIG = {
  printing: {
    boardId: 'PRINTING_BOARD_ID',
    groupId: 'PRINTING_GROUP_ID',
    columnEnvVars: { dateCol: 'PRINTING_DATE_COL', typeCol: 'PRINTING_TYPE_COL', countCol: 'PRINTING_COUNT_COL' },
    processor: processPrinting,
    title: '3D Printing Analytics',
  },
  poster: {
    boardId: 'POSTER_BOARD_ID',
    groupId: 'POSTER_GROUP_ID',
    columnEnvVars: { dateCol: 'POSTER_DATE_COL', materialCol: 'POSTER_MATERIAL_COL', countCol: 'POSTER_COUNT_COL' },
    processor: processPoster,
    title: 'Poster Queue Analytics',
  },
  laser: {
    boardId: 'LASER_BOARD_ID',
    groupId: 'LASER_GROUP_ID',
    columnEnvVars: { dateCol: 'LASER_DATE_COL', filesCol: 'LASER_FILES_COL', minutesCol: 'LASER_MINUTES_COL', secondsCol: 'LASER_SECONDS_COL' },
    processor: processLaser,
    title: 'Laser Cutting Analytics',
  },
};

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

async function generateReport(startDate, endDate) {
  if (!startDate || !endDate || !DATE_REGEX.test(startDate) || !DATE_REGEX.test(endDate)) {
    throw new Error('Invalid date format. Use YYYY-MM-DD.');
  }

  if (startDate > endDate) {
    throw new Error('Start date must be before or equal to end date.');
  }

  const safeStartDate = escapeHtml(formatDate(startDate));
  const safeEndDate = escapeHtml(formatDate(endDate));

  const sections = await Promise.all(
    Object.entries(QUEUE_CONFIG).map(async ([key, config]) => {
      const boardId = process.env[config.boardId];
      const groupId = process.env[config.groupId];
      const columnMap = {};
      for (const [k, envVar] of Object.entries(config.columnEnvVars)) {
        columnMap[k] = process.env[envVar];
      }

      if (!boardId) {
        return `<section><h2>${escapeHtml(config.title)}</h2><p>Board ID not configured for "${escapeHtml(key)}". Check your .env file.</p></section>`;
      }

      const allItems = await fetchBoardItems(boardId, groupId);

      // Forward-fill blank dates from the previous row
      let lastDate = null;
      for (const item of allItems) {
        if (item[columnMap.dateCol]) {
          lastDate = item[columnMap.dateCol];
        } else if (lastDate) {
          item[columnMap.dateCol] = lastDate;
        }
      }

      // Filter to the requested date range
      const items = allItems.filter(item => {
        const d = item[columnMap.dateCol];
        return d && d >= startDate && d <= endDate;
      });

      const { headers, rows } = config.processor(items, columnMap);

      const tableRows = rows
        .map(row => `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
        .join('\n');

      return `<section>
  <h2>${escapeHtml(config.title)}</h2>
  <table>
    <thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
</section>`;
    })
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Makerspace Analytics</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 2rem auto; padding: 0 1rem; }
    h1, h2 { color: #333; }
    p { color: #666; }
    section { margin-bottom: 2rem; }
    table { border-collapse: collapse; width: 100%; margin-top: 1rem; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #f5f5f5; font-weight: 600; }
    tr:last-child { font-weight: 700; background: #fafafa; }
  </style>
</head>
<body>
  <h1>Makerspace Analytics</h1>
  <p>${safeStartDate} to ${safeEndDate}</p>
  ${sections.join('\n  ')}
</body>
</html>`;
}

module.exports = { generateReport };
