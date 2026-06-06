export const getRangeDates = (preset) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let start = new Date(today);
  let end = new Date(today);
  end.setHours(23, 59, 59, 999);

  switch (preset) {
    case 'today':
      break;
    case 'yesterday':
      start.setDate(start.getDate() - 1);
      end = new Date(start);
      end.setHours(23, 59, 59, 999);
      break;
    case 'last7':
      start.setDate(start.getDate() - 6);
      break;
    case 'last30':
      start.setDate(start.getDate() - 29);
      break;
    case 'thisMonth':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      break;
  }

  return { start, end };
};

export const isInRange = (date, range) => {
  if (!date || !range.start || !range.end) return true;
  const d = new Date(date);
  return d >= range.start && d <= range.end;
};
