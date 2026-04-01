import Image from "next/image";
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
  control: any;
}

export function RecipeStepForm({
  index,
  fieldId,
  control,
}: RecipeStepFormProps) {
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  return (
    <FieldGroup key={fieldId} className="flex w-full flex-col gap-4 px-6 py-2">
      <FieldGroup className="flex w-full flex-col justify-center">
        <Controller
          name={`steps.${index}.image`}
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`steps.${index}.image`} className="sr-only">
                Picture
              </FieldLabel>
              <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
                <DialogTrigger asChild>
                  <div className="relative h-32 overflow-hidden rounded-sm bg-gray-100">
                    {field.value ? (
                      <>
                        <Image
                          src={field.value.preview}
                          alt="Step Image"
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
                        Click to upload image
                      </p>
                    )}
                  </div>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Step Image</DialogTitle>
                    <DialogDescription>
                      Choose an image to represent this step in your recipe. You
                      can upload a new image or select an existing one from your
                      library.
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
                Description
              </FieldLabel>
              <Textarea
                {...controllerField}
                id={`steps.${index}.description`}
                aria-invalid={fieldState.invalid}
                placeholder="Step description"
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
