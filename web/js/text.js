export function truncate(str, maxLength) {
  return str.length > maxLength ? `${str.slice(0, maxLength)}…` : str;
}

export function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
