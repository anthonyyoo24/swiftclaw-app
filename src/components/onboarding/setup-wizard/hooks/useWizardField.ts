import { useFormContext, useController } from "react-hook-form";
import type { OnboardingFormValues } from "../schema";

export function useWizardField<K extends keyof OnboardingFormValues>(name: K) {
    const { control } = useFormContext<OnboardingFormValues>();
    const { field } = useController({
        name,
        control,
    });
    return field;
}
