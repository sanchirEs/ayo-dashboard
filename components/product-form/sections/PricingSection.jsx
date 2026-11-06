"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import Field from "../fields/Field";
import { INPUT_TYPED_CLASS, GROUP_LABEL_CLASS } from "../fieldStyles";

export default function PricingSection({ form }) {
  const mode = form.watch("productMode");
  // Variants the product was loaded with; saving as Энгийн бараа keeps one of them.
  const savedVariantCount = form.formState.defaultValues?.variants?.length || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Үнэ болон нөөц</CardTitle>
        <CardDescription>Бараа нэг үнэтэй юу, эсвэл вариант бүр өөр үнэтэй юу</CardDescription>
      </CardHeader>
      <CardContent className="space-y-ui-5">
        <RadioGroup
          value={mode}
          onValueChange={(v) => form.setValue("productMode", v, { shouldDirty: true })}
          className="grid grid-cols-1 gap-ui-3 sm:grid-cols-2"
        >
          {[
            { value: "simple", title: "Энгийн бараа", desc: "Ганц үнэ, тоо ширхэгтэй" },
            { value: "variants", title: "Вариант бүхий бараа", desc: "Өнгө, хэмжээ гэх мэт олон сонголт" },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-start gap-ui-3 rounded-[8px] border-[1px] p-ui-4 transition-colors hover:bg-accent ${
                mode === opt.value ? "border-primary bg-accent/40" : "border-border"
              }`}
            >
              <RadioGroupItem value={opt.value} className="mt-[2px]" />
              <span>
                <span className="block text-[14px] font-medium leading-[20px]">{opt.title}</span>
                <span className={GROUP_LABEL_CLASS}>{opt.desc}</span>
              </span>
            </label>
          ))}
        </RadioGroup>

        {mode === "simple" && savedVariantCount > 1 && (
          <p className="rounded-[8px] border-[1px] border-amber-300 bg-amber-50 p-ui-3 text-[13px] leading-[18px] text-amber-900">
            Хадгалахад нэг вариант үлдэж, бусад {savedVariantCount - 1} вариант устна. Захиалга, нөөц, POS
            борлуулалттай вариантыг устгах боломжгүй тул тийм вариант байвал хадгалахгүй.
          </p>
        )}

        {mode === "simple" && (
          <div className="grid grid-cols-1 gap-ui-4 sm:grid-cols-2">
            <Field control={form.control} name="price" label="Үнэ" required hint="Төгрөгөөр">
              {(field) => (
                <Input {...field} type="number" min="0" className={INPUT_TYPED_CLASS} placeholder="0" />
              )}
            </Field>
            <Field control={form.control} name="quantity" label="Тоо ширхэг" required>
              {(field) => (
                <Input {...field} type="number" min="0" className={INPUT_TYPED_CLASS} placeholder="0" />
              )}
            </Field>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
