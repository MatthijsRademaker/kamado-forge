/** Durations read as clock time on the spine: `4:05`, `20:00`, `65:30`. */
export function formatDuration(seconds: number): string {
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  return `${Math.floor(wholeSeconds / 60)}:${String(wholeSeconds % 60).padStart(2, "0")}`;
}

export function formatPlannedMinutes(minutes: number): string {
  return formatDuration(minutes * 60);
}

/** Cumulative planned offset from the start of the cook, read as `h:mm`. */
export function formatOffset(minutes: number): string {
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
}

export function formatClock(value: string | number): string {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** States the direction and size of a visit's difference from its plan. */
export function formatDrift(driftSeconds: number): string {
  if (driftSeconds === 0) return "on plan";
  return driftSeconds > 0 ? `${formatDuration(driftSeconds)} over plan` : `${formatDuration(-driftSeconds)} under plan`;
}
