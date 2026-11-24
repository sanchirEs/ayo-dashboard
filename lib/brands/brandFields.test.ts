import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { BRAND_NAME_PATTERN, BRAND_SLUG_PATTERN, brandExtraFields, brandNameField, slugToSend } from './brandFields';

const schema = z.object(brandExtraFields);

describe('brand slug pattern', () => {
  it('accepts lowercase ascii words joined by single dashes', () => {
    for (const ok of ['anua', 'about-tone', 'dr-althea', 'edit-b', 'brand-123', '3ce']) {
      expect(BRAND_SLUG_PATTERN.test(ok), ok).toBe(true);
    }
  });

  it('rejects everything the backend rejects with a 400', () => {
    for (const bad of ['About Tone', 'about_tone', '-anua', 'anua-', 'about--tone', 'Anua', 'брэнд', 'a b', '']) {
      expect(BRAND_SLUG_PATTERN.test(bad), bad).toBe(false);
    }
  });
});

describe('brand name', () => {
  const ok = (name: string) => brandNameField.safeParse(name).success;

  it('accepts a colon, so "A:Fable" can be saved', () => {
    expect(ok('A:Fable')).toBe(true);
    expect(BRAND_NAME_PATTERN.test('A:Fable')).toBe(true);
  });

  it('keeps accepting the names that already worked', () => {
    for (const name of ["HC LAB's", 'Dr. Althea', 'edit.b', 'ONDO Skin Clotho', 'Сүлхи', 'Beauty of Joseon (KR)', 'Mamonde + Co', 'Klairs, Inc!', 'Anua/Medicube', 'Re:Zero & Co']) {
      expect(ok(name), name).toBe(true);
    }
  });

  it('still rejects markup-ish characters, and the length limits', () => {
    for (const name of ['<b>Anua</b>', 'Anua;', 'a|b', 'a@b', 'a#b', 'a=b', 'a"b', 'a\\b']) {
      expect(ok(name), name).toBe(false);
    }
    expect(ok('A')).toBe(false);
    expect(ok('x'.repeat(101))).toBe(false);
  });
});

describe('brandExtraFields', () => {
  const base = { slug: '', isFeatured: false, sortOrder: '0' };

  it('lets the slug stay blank (the backend generates one on create)', () => {
    expect(schema.safeParse(base).success).toBe(true);
    expect(schema.safeParse({ ...base, slug: undefined }).success).toBe(true);
  });

  it('flags a malformed slug', () => {
    const result = schema.safeParse({ ...base, slug: 'About Tone' });
    expect(result.success).toBe(false);
  });

  it('trims the slug before checking it', () => {
    const result = schema.safeParse({ ...base, slug: '  about-tone ' });
    expect(result.success && result.data.slug).toBe('about-tone');
  });

  it('turns the order text into a whole number, blank meaning 0', () => {
    const a = schema.safeParse({ ...base, sortOrder: '7' });
    expect(a.success && a.data.sortOrder).toBe(7);
    const b = schema.safeParse({ ...base, sortOrder: '' });
    expect(b.success && b.data.sortOrder).toBe(0);
  });

  it('rejects fractions, negatives and text for the order', () => {
    for (const bad of ['1.5', '-1', 'abc']) {
      expect(schema.safeParse({ ...base, sortOrder: bad }).success, bad).toBe(false);
    }
  });
});

describe('slugToSend', () => {
  it('sends nothing for a blank slug', () => {
    expect(slugToSend('', null)).toBeUndefined();
    expect(slugToSend(undefined, 'anua')).toBeUndefined();
  });

  it('sends a new slug on create (no current slug)', () => {
    expect(slugToSend('anua', null)).toBe('anua');
  });

  it('does not resend the slug a brand already has', () => {
    expect(slugToSend('anua', 'anua')).toBeUndefined();
  });

  it('sends a slug the owner changed', () => {
    expect(slugToSend('anua-kr', 'anua')).toBe('anua-kr');
  });
});
