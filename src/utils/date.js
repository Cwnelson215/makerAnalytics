const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Parse "YYYY-MM-DD" directly; new Date() would read it as UTC midnight,
// which is the previous day in US time zones.
function parseDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return { year, month: month - 1, day };
}

function toMonthKey(dateStr) {
  const { year, month } = parseDate(dateStr);
  return `${MONTH_NAMES[month]} ${year}`;
}

function formatDate(dateStr) {
  const { year, month, day } = parseDate(dateStr);
  return `${MONTH_NAMES[month]} ${day}, ${year}`;
}

// Sorts "Month YYYY" keys chronologically
function compareMonthKeys(a, b) {
  const [monthA, yearA] = a.split(' ');
  const [monthB, yearB] = b.split(' ');
  return (yearA - yearB) || (MONTH_NAMES.indexOf(monthA) - MONTH_NAMES.indexOf(monthB));
}

module.exports = { toMonthKey, formatDate, compareMonthKeys };
