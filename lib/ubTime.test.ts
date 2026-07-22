import { describe, expect, it } from 'vitest';
import { formatUB, ubToday, ubWallClockToDate } from './ubTime';

describe('ubWallClockToDate', () => {
  it('interprets the entered date+time as Ulaanbaatar wall clock, not machine local time', () => {
    // 17:20 in Ulaanbaatar (UTC+8) is 09:20 UTC.
    expect(ubWallClockToDate('2026-07-22', '17:20').toISOString())
      .toBe('2026-07-22T09:20:00.000Z');
  });

  it('rolls back to the previous UTC day for early-morning UB times', () => {
    // 03:00 UB = 19:00 UTC the day before.
    expect(ubWallClockToDate('2026-07-22', '03:00').toISOString())
      .toBe('2026-07-21T19:00:00.000Z');
  });

  it('produces the same instant regardless of the machine timezone', () => {
    const original = process.env.TZ;
    const instants = ['UTC', 'America/New_York', 'Asia/Ulaanbaatar', 'Pacific/Kiritimati'].map(tz => {
      process.env.TZ = tz;
      return ubWallClockToDate('2026-07-22', '17:20').toISOString();
    });
    process.env.TZ = original;
    expect(new Set(instants).size).toBe(1);
    expect(instants[0]).toBe('2026-07-22T09:20:00.000Z');
  });

  it('round-trips through formatUB', () => {
    expect(formatUB(ubWallClockToDate('2026-07-22', '17:20'))).toBe('2026.07.22 17:20');
    expect(formatUB(ubWallClockToDate('2026-01-01', '00:05'))).toBe('2026.01.01 00:05');
  });

  it('returns null for incomplete input', () => {
    expect(ubWallClockToDate('', '17:20')).toBeNull();
    expect(ubWallClockToDate('2026-07-22', '')).toBeNull();
  });
});

describe('ubToday', () => {
  it('returns the UB calendar date, not the UTC one', () => {
    // 2026-07-22T19:00Z is already 2026-07-23 in Ulaanbaatar.
    expect(ubToday(new Date('2026-07-22T19:00:00.000Z'))).toBe('2026-07-23');
    expect(ubToday(new Date('2026-07-22T09:20:00.000Z'))).toBe('2026-07-22');
  });
});
