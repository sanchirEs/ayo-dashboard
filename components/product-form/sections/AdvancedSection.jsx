"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import Field from "../fields/Field";
import { INPUT_TYPED_CLASS, SECTION_LABEL_CLASS } from "../fieldStyles";

export default function AdvancedSection({ form, enabled, onEnabledChange }) {
  const flashSale = form.watch("flashSale");

  return (
    <Card>
      <CardContent className="py-0">
        <Accordion type="single" collapsible>
          <AccordionItem value="advanced" className="border-b-0">
            <AccordionTrigger className="cursor-pointer">Нэмэлт тохиргоо</AccordionTrigger>
            <AccordionContent className="space-y-ui-5 pt-ui-2">
              <label className="flex cursor-pointer items-center justify-between">
                <span className={SECTION_LABEL_CLASS}>Нэмэлт тохиргоо ашиглах</span>
                <Switch checked={enabled} onCheckedChange={onEnabledChange} />
              </label>

              {enabled && (
                <>
                  <label className="flex cursor-pointer items-center justify-between">
                    <span className={SECTION_LABEL_CLASS}>Flash Sale</span>
                    <Switch
                      checked={!!flashSale}
                      onCheckedChange={(v) => form.setValue("flashSale", v, { shouldDirty: true })}
                    />
                  </label>

                  {flashSale && (
                    <Field control={form.control} name="flashSaleEndDate" label="Дуусах огноо">
                      {(field) => <Input {...field} type="date" className={INPUT_TYPED_CLASS} />}
                    </Field>
                  )}

                  <Field control={form.control} name="discountId" label="Хямдралын ID">
                    {(field) => <Input {...field} type="number" min="1" className={INPUT_TYPED_CLASS} placeholder="—" />}
                  </Field>

                  <Field control={form.control} name="promotionId" label="Урамшууллын ID">
                    {(field) => <Input {...field} type="number" min="1" className={INPUT_TYPED_CLASS} placeholder="—" />}
                  </Field>
                </>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
