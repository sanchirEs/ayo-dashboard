/**
 * Ulaanbaatar wall-clock helpers.
 *
 * The flash sale scheduler is operated from Mongolia, so every time an admin
 * types is Ulaanbaatar wall clock — never the browser's local timezone and
 * never UTC. Parsing `new Date('2026-07-22T17:20')` uses whatever timezone the
 * admin's machine happens to be set to, which silently shifts the sale by
 * hours on a mis-set clock, a travelling laptop or a remote desktop.
 *
 * The offset is derived from the IANA database rather than hardcoded to +08:00
 * so a future Mongolian DST change cannot break scheduling.
 */

const UB_TZ = 'Asia/Ulaanbaatar';

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: UB_TZ,
  hour12: false,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

function ubParts(instant: Date) {
  const parts: Record<string, string> = {};
  for (const { type, value } of partsFormatter.formatToParts(instant)) {
    parts[type] = value;
  }
  // Intl renders midnight as hour "24" in some ICU versions.
  const hour = parts.hour === '24' ? '00' : parts.hour;
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

/** Minutes Ulaanbaatar is ahead of UTC at the given instant. */
function ubOffsetMinutes(instant: Date): number {
  const p = ubParts(instant);
  const asIfUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return (asIfUTC - instant.getTime()) / 60000;
}

/**
 * Turn a `YYYY-MM-DD` date and `HH:mm` time typed by an admin — understood as
 * Ulaanbaatar wall clock — into the actual instant it refers to.
 * Returns null when either half is missing or malformed.
 */
export function ubWallClockToDate(dateStr: string, timeStr: string): Date | null {
  if (!dateStr || !timeStr) return null;

  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  if ([year, month, day, hour, minute].some(n => !Number.isFinite(n))) return null;

  // Guess that the offset at the target wall clock matches the offset at the
  // naive UTC reading of it, then correct. A second pass settles the rare case
  // where the guess lands on the far side of a DST transition.
  const naive = Date.UTC(year, month - 1, day, hour, minute);
  let instant = new Date(naive - ubOffsetMinutes(new Date(naive)) * 60000);
  instant = new Date(naive - ubOffsetMinutes(instant) * 60000);
  return instant;
}

/** Format an instant as Ulaanbaatar wall clock: `2026.07.22 17:20`. */
export function formatUB(instant: Date | string | number | null | undefined): string {
  // Guard null/'' explicitly: `new Date(null)` is the epoch, not an invalid
  // date, so without this an unset field would render as 1970.01.01.
  if (instant === null || instant === undefined || instant === '') return '—';
  const date = instant instanceof Date ? instant : new Date(instant);
  if (Number.isNaN(date.getTime())) return '—';
  const p = ubParts(date);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${p.year}.${pad(p.month)}.${pad(p.day)} ${pad(p.hour)}:${pad(p.minute)}`;
}

/** Today's date in Ulaanbaatar as `YYYY-MM-DD`, for `<input type="date" min>`. */
export function ubToday(now: Date = new Date()): string {
  const p = ubParts(now);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** Current Ulaanbaatar wall-clock time as `HH:mm`, for sensible form defaults. */
export function ubNowTime(now: Date = new Date()): string {
  const p = ubParts(now);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

/**
 * Read an `<input type="datetime-local">` value (`YYYY-MM-DDTHH:mm`, with an
 * optional `:ss`) as Ulaanbaatar wall clock. Browsers hand these back with no
 * timezone attached, so `new Date(value)` resolves them against the machine's
 * own clock — which is the bug this exists to avoid.
 */
export function ubLocalInputToDate(value: string): Date | null {
  if (!value) return null;
  const [datePart, timePart] = value.split('T');
  if (!datePart || !timePart) return null;
  return ubWallClockToDate(datePart, timePart);
}

/** Current UB time as `YYYY-MM-DDTHH:mm`, for datetime-local values and bounds. */
export function ubNowLocalInput(now: Date = new Date()): string {
  return `${ubToday(now)}T${ubNowTime(now)}`;
}
