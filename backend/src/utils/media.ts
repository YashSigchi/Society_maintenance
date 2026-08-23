export function thumbnailFromUrl(url: string) {
  if (url.includes('/upload/')) {
    return url.replace('/upload/', '/upload/w_480,c_limit,q_auto,f_auto/');
  }
  return url;
}

export function formatMailDate(date = new Date()) {
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).replace(',', ' •');
}
