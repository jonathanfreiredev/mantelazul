import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Controller } from "react-hook-form";
import { ImageUpload } from "../image-uploader/image-upload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { TrashIcon } from "lucide-react";

interface RecipeStepFormProps {
  index: number;
  fieldId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the form values type lives with the caller; this component only wires fields through to react-hook-form.
  control: any;
}

export function RecipeStepForm({
  index,
  fieldId,
  control,
}: RecipeStepFormProps) {
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const t = useTranslations("RecipeForm");

  return (
    <FieldGroup key={fieldId} className="flex w-full flex-col gap-4 px-6 py-2">
      <FieldGroup className="flex w-full flex-col justify-center">
        <Controller
          name={`steps.${index}.image`}
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`steps.${index}.image`} className="sr-only">
                {t("stepImage")}
              </FieldLabel>
              <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
                <DialogTrigger asChild>
                  <div className="relative h-32 overflow-hidden rounded-sm bg-gray-100">
                    {field.value ? (
                      <>
                        <Image
                          src={field.value.preview}
                          alt={t("stepImage")}
                          fill
                          className="object-cover"
                        />
                        <Button
                          variant="secondary"
                          size="icon-lg"
                          color="red"
                          className="absolute right-0 z-20 m-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            field.onChange(null);
                            setImageDialogOpen(false);
                          }}
                        >
                          <TrashIcon />
                        </Button>
                      </>
                    ) : (
                      <p className="flex h-full w-full items-center justify-center text-gray-500">
                        {t("imagePlaceholder")}
                      </p>
                    )}
                  </div>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("uploadStepImage")}</DialogTitle>
                    <DialogDescription>
                      {t("uploadStepImageDescription")}
                    </DialogDescription>
                  </DialogHeader>

                  <ImageUpload
                    id={`steps.${index}.image`}
                    maxImages={1}
                    handleImages={(images) => {
                      if (images.length > 0) {
                        const image = images[0];
                        field.onChange(image);
                        setImageDialogOpen(false);
                      }
                    }}
                  />
                </DialogContent>
              </Dialog>
            </Field>
          )}
        />

        <Controller
          name={`steps.${index}.description`}
          control={control}
          render={({ field: controllerField, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`steps.${index}.description`}>
                {t("stepDescriptionLabel")}
              </FieldLabel>
              <Textarea
                {...controllerField}
                id={`steps.${index}.description`}
                aria-invalid={fieldState.invalid}
                placeholder={t("stepDescriptionPlaceholder")}
                required
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
    </FieldGroup>
  );
}
