import type { Step } from "generated/prisma/client";
import Image from "next/image";

interface StepsSectionProps {
  steps: Step[];
}

export function StepsSection({ steps }: StepsSectionProps) {
  return (
    <div className="flex w-full flex-col gap-4">
      <h3 className="text-2xl font-semibold">Steps</h3>

      <div className="flex w-full flex-col gap-10">
        {steps.map((step) => (
          <div key={step.id} className="flex w-full flex-col gap-4">
            <h4 className="text-lg font-medium">
              Step {step.order + 1}/{steps.length}
            </h4>

            {step.imageUrl && (
              <div className="relative mb-2 aspect-4/3 max-h-100 w-full overflow-hidden rounded-lg">
                <Image
                  src={step?.imageUrl || ""}
                  alt={`Step ${step.order} image`}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <p className="text-gray-700">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
