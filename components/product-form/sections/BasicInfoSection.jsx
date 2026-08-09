"use client";

import { useFieldArray } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Field from "../fields/Field";

export default function BasicInfoSection({ form }) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "specs" });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Үндсэн мэдээлэл</CardTitle>
        <CardDescription>Бүтээгдэхүүний үндсэн мэдээллийг оруулна уу</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Field control={form.control} name="name" label="Бүтээгдэхүүний нэр" required>
          {(field) => <Input {...field} className="h-10" placeholder="Бүтээгдэхүүний нэр оруулна уу" />}
        </Field>

        <Field
          control={form.control}
          name="sku"
          label="SKU"
          required
          hint="Дахин давтагдахгүй байх ёстой"
        >
          {(field) => <Input {...field} className="h-10" placeholder="SKU оруулна уу" />}
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
              className="!h-[144px]"
              placeholder="Бүтээгдэхүүний дэлгэрэнгүй тайлбар..."
            />
          )}
        </Field>

        <Field control={form.control} name="howToUse" label="Хэрэглэх арга">
          {(field) => (
            <Textarea
              {...field}
              rows={4}
              className="!h-[112px]"
              placeholder="Энэ бүтээгдэхүүнийг хэрхэн ашиглах талаар..."
            />
          )}
        </Field>

        <Field control={form.control} name="ingredients" label="Найрлага">
          {(field) => (
            <Textarea
              {...field}
              rows={4}
              className="!h-[112px]"
              placeholder="Бүтээгдэхүүний найрлага, тус бүрийн орцыг жагсаана уу..."
            />
          )}
        </Field>

        <div className="space-y-2">
          <span className="text-sm font-medium">Техникийн тодорхойлолт</span>
          {fields.map((spec, index) => (
            <div key={spec.id} className="flex items-start gap-2">
              <Input
                {...form.register(`specs.${index}.type`)}
                className="h-10 flex-1"
                placeholder="Төрөл (ж: Багтаамж)"
              />
              <Input
                {...form.register(`specs.${index}.value`)}
                className="h-10 flex-1"
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
                className="h-10 w-10 shrink-0 cursor-pointer p-0 text-muted-foreground hover:text-destructive"
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
            className="cursor-pointer"
          >
            + Тодорхойлолт нэмэх
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
