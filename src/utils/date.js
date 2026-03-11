const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toMonthKey(dateStr) {
  const date = new Date(dateStr);
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

module.exports = { toMonthKey, formatDate };
