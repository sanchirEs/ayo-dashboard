/**
 * Shared control classes for the product form.
 *
 * Three stylesheets load AFTER Tailwind (app/layout.js: globals.css →
 * bootstrap.css → style.css), and each defeats a plain Tailwind utility in a
 * different way. Every class string below is the product of those three
 * constraints, so change them here rather than at a call site.
 *
 * 1. ROOT FONT SIZE. `public/css/style.css:157` sets `html { font-size: 62.5% }`
 *    (the Remos "1.4rem = 14px" convention). Every rem-based Tailwind utility
 *    therefore renders at ⅔ of its textbook value: h-10 → 25px, text-sm →
 *    8.75px, rounded-md → 3px. Raw px values are immune, so everything here is
 *    expressed in px.
 *
 * 2. BOOTSTRAP COLLIDES BY NAME, WITH !important. `public/css/bootstrap.css`
 *    defines `.px-3`, `.py-1`, `.p-4`, `.gap-*` — the very names Tailwind
 *    generates — as `!important`. A tie is decided by source order and
 *    bootstrap.css is later, so Bootstrap wins. The fix is not `!important` but
 *    EVICTION: tailwind-merge treats an arbitrary bracket value as the same
 *    conflict group as the plain utility, so passing `px-[12px]` deletes `px-3`
 *    from the class list outright and Bootstrap's rule no longer has anything to
 *    match. Verified: twMerge('px-3','px-[12px]') drops px-3, whereas
 *    twMerge('px-3','!px-[12px]') keeps BOTH — a `!`-prefixed class never evicts.
 *
 * 3. THE TEMPLATE'S TYPED-INPUT RULE. `style.css:3330` styles
 *    `form textarea, form input[type="text"], … form input[type="number"], …`
 *    with `padding:14px 22px; font-size:14px; line-height:20px;
 *    border-radius:12px`. An attribute selector counts at class level, so
 *    `form input[type="number"]` is specificity (0,1,2) and BEATS a single
 *    Tailwind class (0,1,0). `form textarea` is only (0,0,2), so a class beats
 *    that one.
 *
 * Which combination a control needs follows mechanically:
 *
 *   - Inputs rendered WITHOUT a type attribute never match the rule in (3) at
 *     all — an attribute selector requires the attribute to be present — so a
 *     plain bracket value is enough. Our Input primitive omits `type` when the
 *     prop is undefined, which is why `name`/`sku` escape it.
 *   - Inputs WITH a targeted type (number, date, …) need the bracket value to
 *     disarm Bootstrap AND an `!` twin to outrank (0,1,2). Both halves are
 *     required: the bracket alone loses to the template, the `!` alone loses to
 *     Bootstrap.
 *   - textarea and button only face (0,0,2) rules, so brackets alone suffice —
 *     but they must declare every property the template sets, because an
 *     undeclared property leaves the template's value unopposed.
 */

// Height is safe as a lone bracket value: the template rule sets no height, and
// Bootstrap ships no `.h-9`/`.h-10` to collide with.
export const INPUT_CLASS = "h-[40px] rounded-[8px] px-[12px] py-[0px] text-[14px]";

// number / date / email / … — see (3) above for why each property is doubled.
export const INPUT_TYPED_CLASS =
  "h-[40px] rounded-[8px] !rounded-[8px] px-[12px] !px-[12px] py-[0px] !py-[0px] " +
  "text-[14px] !text-[14px] leading-[20px]";

// Compact variants for the variants table, where rows must stay dense.
export const INPUT_SM_CLASS = "h-[36px] rounded-[6px] px-[10px] py-[0px] text-[14px]";
export const INPUT_TYPED_SM_CLASS =
  "h-[36px] rounded-[6px] !rounded-[6px] px-[10px] !px-[10px] py-[0px] !py-[0px] " +
  "text-[14px] !text-[14px] leading-[20px]";

// `form textarea` is (0,0,2), so no `!` twin is needed for these properties.
// Height is NOT set here: `style.css` separately declares
// `form textarea { height: 200px !important }`, which importance alone can beat,
// so each call site passes its own `!h-[Npx]` to size the box.
export const TEXTAREA_CLASS =
  "rounded-[8px] px-[12px] py-[10px] text-[14px] leading-[20px]";

export const SELECT_CLASS =
  "h-[40px] w-full cursor-pointer rounded-[8px] border border-input bg-background " +
  "px-[12px] py-[0px] text-[14px] focus-visible:outline-none focus-visible:ring-1 " +
  "focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

// `form button { padding:14px 22px; border:1px; border-radius:12px }` is (0,0,2),
// so plain brackets win — but padding, border and radius must ALL be declared or
// the undeclared one leaks through. This is why secondary buttons previously
// rendered 30px tall with 14px of vertical padding around a 2px content box.
export const SECONDARY_BUTTON_CLASS =
  "h-[32px] cursor-pointer rounded-[6px] border-[1px] px-[12px] py-[0px] text-[12px] font-medium";

export const SECTION_LABEL_CLASS = "block text-[14px] font-medium";
export const GROUP_LABEL_CLASS = "block text-[12px] text-muted-foreground";
export const HINT_CLASS = "text-[12px] text-muted-foreground";

/** Toggle chip used for tags, hierarchical tags and variant attribute options. */
export const chipClass = (isOn) =>
  "cursor-pointer rounded-[6px] border-[1px] px-[10px] py-[5px] text-[12px] leading-[16px] " +
  "transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring " +
  (isOn
    ? "border-primary bg-primary text-primary-foreground"
    : "border-input bg-background hover:bg-accent");
