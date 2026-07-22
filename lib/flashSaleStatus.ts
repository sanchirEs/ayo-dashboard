/**
 * Flash sale status is derived from the scheduled window first, and only then
 * refined by the backend's `active` flag.
 *
 * `active` is written false at creation and flipped by a background job, so it
 * lags the schedule by design. Reading status off `active` alone made a sale
 * that had already started — but had not been picked up by the job yet — fall
 * through to "Ended", which is the opposite of the truth.
 */

export interface FlashSaleTiming {
  startDate: string | Date;
  endDate: string | Date;
  active?: boolean;
}

export type FlashSaleStatusLabel = 'Scheduled' | 'Starting' | 'Live' | 'Ended';

export interface FlashSaleStatus {
  label: FlashSaleStatusLabel;
  color: string;
  bg: string;
  /** Only a sale that has not opened yet may be cancelled. */
  cancellable: boolean;
  /** Open window the backend has not activated yet — the discount is not live. */
  pending: boolean;
}

const STYLES: Record<FlashSaleStatusLabel, { color: string; bg: string }> = {
  Live: { color: '#065f46', bg: '#d1fae5' },
  Starting: { color: '#92400e', bg: '#fef3c7' },
  Scheduled: { color: '#1e40af', bg: '#dbeafe' },
  Ended: { color: '#6b7280', bg: '#f3f4f6' },
};

export function getFlashSaleStatus(item: FlashSaleTiming, now: Date = new Date()): FlashSaleStatus {
  const start = new Date(item.startDate);
  const end = new Date(item.endDate);

  let label: FlashSaleStatusLabel;
  if (end.getTime() <= now.getTime()) label = 'Ended';
  else if (start.getTime() > now.getTime()) label = 'Scheduled';
  else label = item.active ? 'Live' : 'Starting';

  return {
    label,
    ...STYLES[label],
    cancellable: label === 'Scheduled',
    pending: label === 'Starting',
  };
}
