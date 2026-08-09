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

        <Field control={form.control} name="description" label="Тайлбар" required>
          {(field) => (
            <Textarea {...field} rows={5} placeholder="Бүтээгдэхүүний дэлгэрэнгүй тайлбар..." />
          )}
        </Field>

        <Field control={form.control} name="howToUse" label="Хэрэглэх арга">
          {(field) => (
            <Textarea {...field} rows={4} placeholder="Энэ бүтээгдэхүүнийг хэрхэн ашиглах талаар..." />
          )}
        </Field>

        <Field control={form.control} name="ingredients" label="Найрлага">
          {(field) => (
            <Textarea {...field} rows={4} placeholder="Бүтээгдэхүүний найрлага, тус бүрийн орцыг жагсаана уу..." />
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
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                aria-label="Устгах"
                className="h-10 w-10 shrink-0 cursor-pointer text-muted-foreground hover:text-destructive"
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
