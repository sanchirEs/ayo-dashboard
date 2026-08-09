"use client";

import { useState } from "react";
import { useFieldArray } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function VariantsSection({ form, attributes }) {
  const { fields, replace, update } = useFieldArray({ control: form.control, name: "variants" });
  const [selectedOptions, setSelectedOptions] = useState({});

  // Coerce empty/null/undefined/NaN to 0, preserving numeric values.
  // Matches original updateVariant logic: value === '' ? 0 : parseFloat(value)
  const coerceToNumber = (value) => {
    if (value === '' || value === null || value === undefined) return 0;
    const num = parseFloat(value);
    return isFinite(num) ? num : 0;
  };

  const toggleOption = (attributeId, optionId) => {
    setSelectedOptions((prev) => {
      const current = prev[attributeId] || [];
      const next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      return { ...prev, [attributeId]: next };
    });
  };

  // Cartesian product of the selected options, ported from the old component.
  const generate = () => {
    const entries = Object.entries(selectedOptions)
      .map(([attrId, optionIds]) => ({
        attributeId: parseInt(attrId, 10),
        options: optionIds.map((id) => parseInt(id, 10)),
      }))
      .filter((e) => e.options.length > 0);

    if (entries.length === 0) {
      replace([]);
      return;
    }

    let combinations = [[]];
    for (const { attributeId, options } of entries) {
      const next = [];
      for (const combination of combinations) {
        for (const optionId of options) {
          next.push([...combination, { attributeId, optionId }]);
        }
      }
      combinations = next;
    }

    const baseSku = form.getValues("sku") || "PROD";
    const basePrice = form.getValues("price") || 0;

    replace(
      combinations.map((attrs, index) => {
        const names = attrs.map(({ attributeId, optionId }) => {
          const attribute = attributes.find((a) => a.id === attributeId);
          const option = attribute?.options.find((o) => o.id === optionId);
          return `${attribute?.name}-${option?.value}`;
        });
        const suffix = names.join("-").toUpperCase().replace(/\s+/g, "-");

        return {
          sku: `${baseSku}-${suffix}`,
          price: Number(basePrice),
          isDefault: index === 0,
          attributes: attrs,
          inventory: { quantity: 0 },
          images: [],
        };
      })
    );
  };

  const setDefault = (index) => {
    fields.forEach((field, i) => update(i, { ...form.getValues(`variants.${i}`), isDefault: i === index }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Вариантууд</CardTitle>
        <CardDescription>Аттрибут сонгоод вариантуудыг үүсгэнэ үү</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-4">
          {attributes.map((attribute) => (
            <div key={attribute.id} className="space-y-2">
              <span className="text-sm font-medium">{attribute.name}</span>
              <div className="flex flex-wrap gap-2">
                {attribute.options.map((option) => {
                  const isOn = (selectedOptions[attribute.id] || []).includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleOption(attribute.id, option.id)}
                      className={`cursor-pointer rounded-md border px-3 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                        isOn
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background hover:bg-accent"
                      }`}
                    >
                      {option.value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" onClick={generate} className="cursor-pointer">
          Вариант үүсгэх
        </Button>

        {fields.length > 0 && (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">SKU</th>
                  <th className="px-3 py-2 text-left font-medium">Үнэ</th>
                  <th className="px-3 py-2 text-left font-medium">Тоо</th>
                  <th className="px-3 py-2 text-left font-medium">Үндсэн</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((variant, index) => (
                  <tr key={variant.id} className="border-t border-border transition-colors hover:bg-accent/40">
                    <td className="px-3 py-2">
                      <Input {...form.register(`variants.${index}.sku`)} className="h-9" />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        {...form.register(`variants.${index}.price`, { setValueAs: coerceToNumber })}
                        type="number"
                        min="0"
                        className="h-9 w-28"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        {...form.register(`variants.${index}.inventory.quantity`, { setValueAs: coerceToNumber })}
                        type="number"
                        min="0"
                        className="h-9 w-24"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="radio"
                        name="defaultVariant"
                        checked={form.watch(`variants.${index}.isDefault`) === true}
                        onChange={() => setDefault(index)}
                        className="cursor-pointer"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
