"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Field from "../fields/Field";
import CategoryPicker from "../fields/CategoryPicker";

export default function OrganizeSection({ form, categoryEntries, brands, tagPresets, tagGroups }) {
  const tags = form.watch("tags") || [];
  const hierarchicalTagIds = form.watch("hierarchicalTagIds") || [];

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

  const chipClass = (isOn) =>
    `cursor-pointer rounded-md border px-2.5 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
      isOn ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-accent"
    }`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ангилал ба брэнд</CardTitle>
        <CardDescription>Бүтээгдэхүүнд олон ангилал оноож болно</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
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
            <select
              {...field}
              className="h-10 w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Брэнд сонгох</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
          )}
        </Field>

        <div className="space-y-2">
          <span className="text-sm font-medium">Шошго</span>
          <div className="flex flex-wrap gap-1.5">
            {tagPresets.map((preset) => (
              <button
                key={preset.id ?? preset.name}
                type="button"
                onClick={() => toggleTag(preset.name)}
                className={chipClass(tags.includes(preset.name))}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <span className="text-sm font-medium">Ангилал шошго</span>
          {tagGroups.map((group) => (
            <div key={group.id} className="space-y-1.5">
              <span className="text-xs text-muted-foreground">{group.name}</span>
              <div className="flex flex-wrap gap-1.5">
                {(group.options || []).map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleHierarchical(option.id)}
                    className={chipClass(hierarchicalTagIds.includes(option.id))}
                  >
                    {option.value ?? option.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
