import { test } from "@playwright/test";

/**
 * Wraps a page-object method in a reporter step, so the HTML report and any
 * trace read as a sequence of named actions instead of a wall of clicks.
 *
 *   class StmsWizardPage {
 *     @step("Choose the seller ID category")
 *     async chooseSellerCategory() { ... }
 *   }
 *
 * Shape follows `eauto-qa-automation/src/fixtures/step.ts`.
 */
export function step(stepName?: string) {
  return function decorator(target: Function, context: ClassMethodDecoratorContext) {
    return function replacementMethod(this: unknown, ...args: unknown[]) {
      const name = stepName || (context.name as string);
      return test.step(name, async () => target.call(this, ...args));
    };
  };
}
