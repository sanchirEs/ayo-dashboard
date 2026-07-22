import { describe, expect, it } from 'vitest';
import { getFlashSaleStatus } from './flashSaleStatus';
import { formatUB } from './ubTime';
import live from './flashSaleStatus.fixture.json';

// Fixture captured straight from the production row the admin reported as
// wrongly showing "Ended". Regenerate with the snippet in the PR description
// if it ever needs refreshing; the assertions below describe the real bug.
describe('the reported "Sure Base Foundation" flash sale', () => {
  const now = new Date(live.now);

  it('stored the entered Ulaanbaatar times correctly — this was never a timezone bug', () => {
    expect(formatUB(live.startDate)).toBe('2026.07.22 17:20');
    expect(formatUB(live.endDate)).toBe('2026.07.22 18:20');
  });

  it('renders Live now that the window is open and the backend has activated it', () => {
    expect(getFlashSaleStatus(live, now).label).toBe('Live');
  });

  it('would have rendered "Starting" — not "Ended" — during the pre-activation gap', () => {
    // The state at creation: window open, active still false because only a
    // 5-minute cron flipped it. This is exactly what the admin saw as "Ended".
    const atCreation = { ...live, active: false };
    const justAfterStart = new Date(new Date(live.startDate).getTime() + 60_000);
    expect(getFlashSaleStatus(atCreation, justAfterStart).label).toBe('Starting');
  });
});
