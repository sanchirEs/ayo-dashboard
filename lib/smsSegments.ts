// Preview of what sms-multi will bill for a message. Mirrors the provider's
// packages/core/src/encoding.ts and transliterate.ts, so the composer can show a
// price on every keystroke without calling the API.

export const SMS_SEGMENT_PRICE_MNT = 50;

const GSM7_BASIC = new Set(
  Array.from(
    '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?' +
      '¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà'
  )
);
const GSM7_EXTENSION = new Set(Array.from('\f^{}\\[~]|€'));

const LIMITS = {
  gsm7: { single: 160, multipart: 153 },
  ucs2: { single: 70, multipart: 67 },
};

const MN_TO_LATIN: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'i',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', ө: 'u', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ү: 'u',
  ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'ii', ь: 'i', э: 'e', ю: 'yu', я: 'ya',
};

const isUpper = (ch?: string) => ch !== undefined && /\p{Lu}/u.test(ch);
const isLetter = (ch?: string) => ch !== undefined && /\p{L}/u.test(ch);

export function transliterateMn(text: string): string {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const lower = ch.toLowerCase();
    const latin = MN_TO_LATIN[lower];
    if (latin === undefined) {
      out += ch;
    } else if (lower === ch || latin.length < 2) {
      out += lower === ch ? latin : latin.toUpperCase();
    } else {
      // Multi-letter mapping of a capital: all caps when a neighbouring letter is a capital too.
      const next = text[i + 1];
      const allCaps = isUpper(next) || (!isLetter(next) && isUpper(text[i - 1]));
      out += allCaps ? latin.toUpperCase() : latin[0].toUpperCase() + latin.slice(1);
    }
  }
  return out;
}

export interface SmsAnalysis {
  encoding: 'gsm7' | 'ucs2';
  units: number;
  segments: number;
}

export function analyzeSms(message: string, { transliterate = false } = {}): SmsAnalysis {
  const text = transliterate ? transliterateMn(message) : message;

  let gsmUnits = 0;
  let encoding: SmsAnalysis['encoding'] = 'gsm7';
  for (const ch of text) {
    if (GSM7_EXTENSION.has(ch)) gsmUnits += 2;
    else if (GSM7_BASIC.has(ch)) gsmUnits += 1;
    else encoding = 'ucs2';
  }

  const units = encoding === 'ucs2' ? text.length : gsmUnits;
  const { single, multipart } = LIMITS[encoding];
  let segments = 0;
  if (units > 0) segments = units <= single ? 1 : Math.ceil(units / multipart);

  return { encoding, units, segments };
}
