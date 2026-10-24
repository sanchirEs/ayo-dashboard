/**
 * Small pure helpers for the till setup pages. The backend checks all of this
 * again; these exist so the form can say what is wrong before it sends.
 */

export type PosRole = "CASHIER" | "STOCK_KEEPER" | "MANAGER" | "OWNER";

const PIN_PATTERN = /^[0-9]{4,6}$/;

export const isValidPin = (pin: string): boolean => PIN_PATTERN.test(pin);

/** null when the value is a whole number in [min, max]; else the message to show. */
export function rangeError(value: unknown, min: number, max: number, unit: string): string | null {
  const n = typeof value === "string" ? (value.trim() === "" ? Number.NaN : Number(value)) : value;
  return typeof n === "number" && Number.isInteger(n) && n >= min && n <= max ? null : `${min}-${max} хооронд бүхэл ${unit}`;
}

/** A discount limit is a percentage: "0-100 хооронд бүхэл тоо". */
export const discountLimitError = (value: unknown): string | null => rangeError(value, 0, 100, "тоо");

/** PIN typed twice, as the create and reset dialogs ask for it. */
export function pinFormError(pin: string, again: string): string | null {
  if (!isValidPin(pin)) return "PIN 4-6 оронтой тоо байна";
  if (pin !== again) return "PIN-үүд таарахгүй байна";
  return null;
}

const ROLE_LABELS: Record<PosRole, string> = {
  CASHIER: "Кассчин",
  STOCK_KEEPER: "Нярав",
  MANAGER: "Менежер",
  OWNER: "Эзэмшигч",
};

export const ROLES: PosRole[] = ["CASHIER", "STOCK_KEEPER", "MANAGER", "OWNER"];

export const roleLabel = (role: PosRole): string => ROLE_LABELS[role];

/** Whole seconds until `expiresAt`, never below zero. */
export function secondsLeft(expiresAt: string, nowMs: number): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - nowMs) / 1000));
}

/** 601 -> "10:01". */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
