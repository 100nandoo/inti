const filenameDateFormatter = new Intl.DateTimeFormat('sv-SE', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function formatFilenameDate(date) {
  return filenameDateFormatter.format(date);
}

export function formatFeedTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
