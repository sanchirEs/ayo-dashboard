"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import Field from "../fields/Field";

export default function PricingSection({ form }) {
  const mode = form.watch("productMode");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Үнэ болон нөөц</CardTitle>
        <CardDescription>Бараа нэг үнэтэй юу, эсвэл вариант бүр өөр үнэтэй юу</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <RadioGroup
          value={mode}
          onValueChange={(v) => form.setValue("productMode", v, { shouldDirty: true })}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {[
            { value: "simple", title: "Энгийн бараа", desc: "Ганц үнэ, тоо ширхэгтэй" },
            { value: "variants", title: "Вариант бүхий бараа", desc: "Өнгө, хэмжээ гэх мэт олон сонголт" },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-accent ${
                mode === opt.value ? "border-primary bg-accent/40" : "border-border"
              }`}
            >
              <RadioGroupItem value={opt.value} className="mt-0.5" />
              <span>
                <span className="block text-sm font-medium">{opt.title}</span>
                <span className="block text-xs text-muted-foreground">{opt.desc}</span>
              </span>
            </label>
          ))}
        </RadioGroup>

        {mode === "simple" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field control={form.control} name="price" label="Үнэ" required hint="Төгрөгөөр">
              {(field) => <Input {...field} type="number" min="0" className="h-10" placeholder="0" />}
            </Field>
            <Field control={form.control} name="quantity" label="Тоо ширхэг" required>
              {(field) => <Input {...field} type="number" min="0" className="h-10" placeholder="0" />}
            </Field>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
