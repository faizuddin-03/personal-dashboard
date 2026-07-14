# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\service-hub\specs\reschedule-handling.spec.ts >> Reschedule & Handling >> BO >> BO reschedule normal flow
- Location: tests\service-hub\specs\reschedule-handling.spec.ts:195:9

# Error details

```
Error: locator.click: Target page, context or browser has been closed
Call log:
  - waiting for getByText('Reschedule')

```

```
Error: browserContext.close: Target page, context or browser has been closed
```