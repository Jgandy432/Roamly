export const generateId = (): string =>
  Math.random().toString(36).substring(2, 10);

export const formatDateRange = (dateStr: string): string => {
  const parts = dateStr.split(' to ');
  if (parts.length === 2) {
    const formatted = parts.map((d) => {
      const parsed = new Date(d.trim() + 'T00:00:00');
      if (isNaN(parsed.getTime())) return d.trim();
      return parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    });
    return `${formatted[0]} - ${formatted[1]}`;
  }
  return dateStr;
};

export const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
};
