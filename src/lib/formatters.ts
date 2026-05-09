export function formatGold(value: number): string {
  return `${Math.max(0, Math.floor(value)).toLocaleString()} Gold`;
}

export function formatEnergy(current: number, max: number): string {
  return `${Math.max(0, Math.floor(current)).toLocaleString()} / ${Math.max(
    0,
    Math.floor(max),
  ).toLocaleString()}`;
}

export function formatGameDate(weekday: string, month: number, day: number): string {
  return `${weekday} ${month}/${day}`;
}