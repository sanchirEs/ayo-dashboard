import { describe, expect, it } from 'vitest';
import { getFlashSaleStatus } from './flashSaleStatus';

// The exact row the admin created on 2026-07-22: 17:20–18:20 Ulaanbaatar
// (= 09:20–10:20 UTC), a 1-hour sale starting immediately.
const SALE = {
  startDate: '2026-07-22T09:20:00.000Z',
  endDate: '2026-07-22T10:20:00.000Z',
};

const at = (iso: string) => new Date(iso);

describe('getFlashSaleStatus', () => {
  it('does not report "Ended" while the window is still open but the cron has not activated yet', () => {
    // Reproduces the bug: freshly created, active=false because the backend
    // writes active:false and a 5-minute cron flips it. At 17:22 UB the sale
    // is inside its own window, so it is anything but ended.
    const status = getFlashSaleStatus({ ...SALE, active: false }, at('2026-07-22T09:22:00.000Z'));
    expect(status.label).not.toBe('Ended');
  });

  it('reports "Starting" for an open window that is not activated yet', () => {
    const status = getFlashSaleStatus({ ...SALE, active: false }, at('2026-07-22T09:22:00.000Z'));
    expect(status.label).toBe('Starting');
  });

  it('reports "Live" for an open window that is activated', () => {
    const status = getFlashSaleStatus({ ...SALE, active: true }, at('2026-07-22T09:32:00.000Z'));
    expect(status.label).toBe('Live');
  });

  it('reports "Scheduled" before the window opens', () => {
    expect(getFlashSaleStatus({ ...SALE, active: false }, at('2026-07-22T09:00:00.000Z')).label)
      .toBe('Scheduled');
    // active=true ahead of time must still read as Scheduled, not Live.
    expect(getFlashSaleStatus({ ...SALE, active: true }, at('2026-07-22T09:00:00.000Z')).label)
      .toBe('Scheduled');
  });

  it('reports "Ended" only once the end time has actually passed', () => {
    expect(getFlashSaleStatus({ ...SALE, active: false }, at('2026-07-22T10:20:00.000Z')).label)
      .toBe('Ended');
    expect(getFlashSaleStatus({ ...SALE, active: true }, at('2026-07-22T11:00:00.000Z')).label)
      .toBe('Ended');
  });

  it('treats the exact start instant as open, not scheduled', () => {
    expect(getFlashSaleStatus({ ...SALE, active: true }, at('2026-07-22T09:20:00.000Z')).label)
      .toBe('Live');
  });

  it('is cancellable only before it starts', () => {
    expect(getFlashSaleStatus({ ...SALE, active: false }, at('2026-07-22T09:00:00.000Z')).cancellable).toBe(true);
    expect(getFlashSaleStatus({ ...SALE, active: false }, at('2026-07-22T09:22:00.000Z')).cancellable).toBe(false);
    expect(getFlashSaleStatus({ ...SALE, active: true }, at('2026-07-22T11:00:00.000Z')).cancellable).toBe(false);
  });
});
