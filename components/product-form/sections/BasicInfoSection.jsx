"use client";

import { useFieldArray } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Field from "../fields/Field";
import {
  INPUT_CLASS,
  TEXTAREA_CLASS,
  SECONDARY_BUTTON_CLASS,
  SECTION_LABEL_CLASS,
} from "../fieldStyles";

export default function BasicInfoSection({ form }) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "specs" });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Үндсэн мэдээлэл</CardTitle>
        <CardDescription>Бүтээгдэхүүний үндсэн мэдээллийг оруулна уу</CardDescription>
      </CardHeader>
      <CardContent className="space-y-ui-5">
        <Field control={form.control} name="name" label="Бүтээгдэхүүний нэр" required>
          {(field) => (
            <Input {...field} className={INPUT_CLASS} placeholder="Бүтээгдэхүүний нэр оруулна уу" />
          )}
        </Field>

        <Field
          control={form.control}
          name="sku"
          label="SKU"
          required
          hint="Дахин давтагдахгүй байх ёстой"
        >
          {(field) => <Input {...field} className={INPUT_CLASS} placeholder="SKU оруулна уу" />}
        </Field>

        {/*
          !h-[...px]: public/css/style.css sets `form textarea { height: 200px !important }`,
          so every textarea's `rows` prop was rendering identically at 200px regardless of
          its value. A plain height utility can't win against an !important rule no matter
          how specific its selector is — importance is compared before specificity. The `!`
          modifier (Tailwind v3 syntax) emits our own !important declaration, and because a
          single class always outranks the template's two-element `form textarea` selector,
          ours wins the ensuing !important-vs-!important tie. Pixel arbitrary values (not
          rem-based h-* steps) are used deliberately: this app's <html> renders at
          font-size: 10px instead of the 16px browser default, so rem-based utilities are
          already scaled to 62.5% everywhere — arbitrary px values sidestep that entirely.
        */}
        <Field control={form.control} name="description" label="Тайлбар" required>
          {(field) => (
            <Textarea
              {...field}
              rows={5}
              className={`!h-[144px] ${TEXTAREA_CLASS}`}
              placeholder="Бүтээгдэхүүний дэлгэрэнгүй тайлбар..."
            />
          )}
        </Field>

        <Field control={form.control} name="howToUse" label="Хэрэглэх арга">
          {(field) => (
            <Textarea
              {...field}
              rows={4}
              className={`!h-[112px] ${TEXTAREA_CLASS}`}
              placeholder="Энэ бүтээгдэхүүнийг хэрхэн ашиглах талаар..."
            />
          )}
        </Field>

        <Field control={form.control} name="ingredients" label="Найрлага">
          {(field) => (
            <Textarea
              {...field}
              rows={4}
              className={`!h-[112px] ${TEXTAREA_CLASS}`}
              placeholder="Бүтээгдэхүүний найрлага, тус бүрийн орцыг жагсаана уу..."
            />
          )}
        </Field>

        <div className="space-y-ui-2">
          <span className={SECTION_LABEL_CLASS}>Техникийн тодорхойлолт</span>
          {fields.map((spec, index) => (
            <div key={spec.id} className="flex items-start gap-ui-2">
              <Input
                {...form.register(`specs.${index}.type`)}
                className={`${INPUT_CLASS} flex-1`}
                placeholder="Төрөл (ж: Багтаамж)"
              />
              <Input
                {...form.register(`specs.${index}.value`)}
                className={`${INPUT_CLASS} flex-1`}
                placeholder="Утга (ж: 50ml)"
              />
              {/*
                p-0: same defect as the RadioGroupItem/CategoryPicker-chip fixes above —
                this icon button sets no padding utility, so `form button`
                (public/css/style.css, padding: 14px 22px) applied unopposed and the
                remove control rendered far larger than the h-10 w-10 it asked for.
                Found during the round-2 sweep of every control in this directory.
              */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                aria-label="Устгах"
                className="h-[40px] w-[40px] shrink-0 cursor-pointer p-0 text-[18px] leading-none text-muted-foreground hover:text-destructive"
              >
                ×
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ type: "", value: "" })}
            className={SECONDARY_BUTTON_CLASS}
          >
            + Тодорхойлолт нэмэх
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
