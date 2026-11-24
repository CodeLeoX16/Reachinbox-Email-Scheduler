export function formatScheduledPill(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export function formatDetailDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function getPresetDate(preset: 'tomorrow_9' | 'tomorrow_10' | 'tomorrow_11' | 'tomorrow_15'): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const hourMap = {
    tomorrow_9: 9,
    tomorrow_10: 10,
    tomorrow_11: 11,
    tomorrow_15: 15,
  };
  d.setHours(hourMap[preset], 0, 0, 0);
  return d;
}