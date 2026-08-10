"use client";

import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Field from "../fields/Field";
import CategoryPicker from "../fields/CategoryPicker";
import {
  SELECT_CLASS,
  SECTION_LABEL_CLASS,
  GROUP_LABEL_CLASS,
  chipClass,
} from "../fieldStyles";

export default function OrganizeSection({ form, categoryEntries, brands, tagPresets, tagGroups }) {
  const tags = form.watch("tags") || [];
  const hierarchicalTagIds = form.watch("hierarchicalTagIds") || [];

  // Production returns two distinct tag presets both named "VEGAN", which rendered
  // as two identical chips that toggled as one — toggleTag keys off the name, so
  // the second was never anything but a duplicate control for the first.
  //
  // Deduplication is deliberately scoped to THIS flat list and must not be applied
  // to `tagGroups` below. Names repeat legitimately across hierarchical groups —
  // "Dive in Fig" exists under Биеийн тос үнэр, Үнэртэн AND Шингэн саван үнэр as
  // three different attribute options. Those toggle by `option.id`, independently
  // (verified in the browser: clicking one leaves the other two untouched), so
  // collapsing them by name would delete two real, selectable options.
  const uniqueTagPresets = useMemo(() => {
    const seen = new Set();
    return (tagPresets || []).filter((preset) => {
      const name = (preset.name || "").trim();
      if (!name || seen.has(name)) return false;
      seen.add(name);
      return true;
    });
  }, [tagPresets]);

  const toggleTag = (name) => {
    form.setValue(
      "tags",
      tags.includes(name) ? tags.filter((t) => t !== name) : [...tags, name],
      { shouldDirty: true }
    );
  };

  const toggleHierarchical = (optionId) => {
    form.setValue(
      "hierarchicalTagIds",
      hierarchicalTagIds.includes(optionId)
        ? hierarchicalTagIds.filter((id) => id !== optionId)
        : [...hierarchicalTagIds, optionId],
      { shouldDirty: true }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ангилал ба брэнд</CardTitle>
        <CardDescription>Бүтээгдэхүүнд олон ангилал оноож болно</CardDescription>
      </CardHeader>
      <CardContent className="space-y-ui-5">
        <Field control={form.control} name="categoryIds" label="Ангилал" required>
          {(field) => (
            <CategoryPicker
              entries={categoryEntries}
              value={field.value || []}
              onChange={field.onChange}
            />
          )}
        </Field>

        <Field control={form.control} name="brandId" label="Брэнд">
          {(field) => (
            <select {...field} className={SELECT_CLASS}>
              <option value="">Брэнд сонгох</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
          )}
        </Field>

        <div className="space-y-ui-2">
          <span className={SECTION_LABEL_CLASS}>Шошго</span>
          <div className="flex flex-wrap gap-ui-1.5">
            {uniqueTagPresets.map((preset) => {
              const isOn = tags.includes(preset.name);
              return (
                <button
                  key={preset.id ?? preset.name}
                  type="button"
                  aria-pressed={isOn}
                  onClick={() => toggleTag(preset.name)}
                  className={chipClass(isOn)}
                >
                  {preset.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-ui-3">
          <span className={SECTION_LABEL_CLASS}>Ангилал шошго</span>
          {tagGroups.map((group) => (
            <div key={group.id} className="space-y-ui-1.5">
              <span className={GROUP_LABEL_CLASS}>{group.name}</span>
              <div className="flex flex-wrap gap-ui-1.5">
                {(group.options || []).map((option) => {
                  const isOn = hierarchicalTagIds.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={isOn}
                      onClick={() => toggleHierarchical(option.id)}
                      className={chipClass(isOn)}
                    >
                      {option.value ?? option.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
