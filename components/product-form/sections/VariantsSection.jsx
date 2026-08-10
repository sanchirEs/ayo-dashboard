"use client";

import { useState } from "react";
import { useFieldArray } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  INPUT_SM_CLASS,
  INPUT_TYPED_SM_CLASS,
  SECONDARY_BUTTON_CLASS,
  SECTION_LABEL_CLASS,
  chipClass,
} from "../fieldStyles";

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
      <CardContent className="space-y-ui-5">
        <div className="space-y-ui-4">
          {attributes.map((attribute) => (
            <div key={attribute.id} className="space-y-ui-2">
              <span className={SECTION_LABEL_CLASS}>{attribute.name}</span>
              <div className="flex flex-wrap gap-ui-2">
                {attribute.options.map((option) => {
                  const isOn = (selectedOptions[attribute.id] || []).includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={isOn}
                      onClick={() => toggleOption(attribute.id, option.id)}
                      className={chipClass(isOn)}
                    >
                      {option.value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" onClick={generate} className={SECONDARY_BUTTON_CLASS}>
          Вариант үүсгэх
        </Button>

        {fields.length > 0 && (
          <div className="overflow-x-auto rounded-[8px] border-[1px] border-border">
            <table className="w-full text-[14px]">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-ui-3 py-ui-2 text-left font-medium">SKU</th>
                  <th className="px-ui-3 py-ui-2 text-left font-medium">Үнэ</th>
                  <th className="px-ui-3 py-ui-2 text-left font-medium">Тоо</th>
                  <th className="px-ui-3 py-ui-2 text-left font-medium">Үндсэн</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((variant, index) => (
                  <tr key={variant.id} className="border-t border-border transition-colors hover:bg-accent/40">
                    <td className="px-ui-3 py-ui-2">
                      <Input {...form.register(`variants.${index}.sku`)} className={INPUT_SM_CLASS} />
                    </td>
                    <td className="px-ui-3 py-ui-2">
                      <Input
                        {...form.register(`variants.${index}.price`, { setValueAs: coerceToNumber })}
                        type="number"
                        min="0"
                        className={`${INPUT_TYPED_SM_CLASS} w-[112px]`}
                      />
                    </td>
                    <td className="px-ui-3 py-ui-2">
                      <Input
                        {...form.register(`variants.${index}.inventory.quantity`, { setValueAs: coerceToNumber })}
                        type="number"
                        min="0"
                        className={`${INPUT_TYPED_SM_CLASS} w-[96px]`}
                      />
                    </td>
                    <td className="px-ui-3 py-ui-2">
                      <input
                        type="radio"
                        name="defaultVariant"
                        checked={form.watch(`variants.${index}.isDefault`) === true}
                        onChange={() => setDefault(index)}
                        className="h-[16px] w-[16px] cursor-pointer"
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
