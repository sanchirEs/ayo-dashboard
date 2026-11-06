// A new code for a till that is already paired is a re-pair: the moment another
// computer types it, the till's current computer is shut out (the server answers
// it 401 and it can no longer send its sales). The owner should know before the
// code exists, above all when that computer is in use right now.

/** A till that answered within this long is taken to be in use. Its heartbeat lands about once a minute. */
export const LIVE_WITHIN_MS = 10 * 60_000;

export interface RepairCandidate {
  active: boolean;
  pairedAt: string | null;
  lastSeenAt: string | null;
}

/** null when a code costs nothing; otherwise whether the computer it would shut out is live. */
export function repairRisk(register: RepairCandidate, nowMs = Date.now()): { live: boolean } | null {
  if (!register.active || !register.pairedAt) return null;
  const seen = register.lastSeenAt ? nowMs - new Date(register.lastSeenAt).getTime() : Infinity;
  return { live: seen <= LIVE_WITHIN_MS };
}
