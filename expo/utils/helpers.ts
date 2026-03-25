export const generateId = (): string =>
  Math.random().toString(36).substring(2, 10);

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return '';
  let date: Date | null = null;
  const slashParts = dateStr.split('/');
  if (slashParts.length === 3) {
    const m = parseInt(slashParts[0], 10) - 1;
    const d = parseInt(slashParts[1], 10);
    const y = parseInt(slashParts[2], 10);
    if (!isNaN(m) && !isNaN(d) && !isNaN(y)) date = new Date(y, m, d);
  }
  if (!date) {
    const dashParts = dateStr.split('-');
    if (dashParts.length === 3) {
      const y = parseInt(dashParts[0], 10);
      const m = parseInt(dashParts[1], 10) - 1;
      const d = parseInt(dashParts[2], 10);
      if (!isNaN(m) && !isNaN(d) && !isNaN(y)) date = new Date(y, m, d);
    }
  }
  if (!date || isNaN(date.getTime())) return dateStr;
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()} ${date.getFullYear()}`;
};

export const formatDateFromObj = (date: Date): string => {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()} ${date.getFullYear()}`;
};

export const formatDateRange = (dateStr: string): string => {
  const parts = dateStr.split(' to ');
  if (parts.length === 2) {
    const formatted = parts.map((d) => formatDisplayDate(d.trim()));
    return `${formatted[0]} - ${formatted[1]}`;
  }
  return formatDisplayDate(dateStr);
};

export const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
};
