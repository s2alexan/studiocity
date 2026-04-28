# E2E Testing Guide: Studio City

This project uses Playwright for end-to-end testing. The process is modeled after `anicolao/food` and `anicolao/chess-tt`: tests are deterministic, visual, and self-documenting.

Studio City E2E tests run against Firebase emulators. The Playwright web server command builds Cloud Functions, starts the Firestore and Functions emulators, then serves the SvelteKit app with `VITE_USE_FIREBASE_EMULATORS=true`.

## Philosophy: Zero-Pixel Tolerance

Studio City is a card game, so visible state is the player experience. Layout drift, missing cards, or incorrect table state should fail loudly.

- Tests must be deterministic. Mock or stabilize random, time-based, and network state before taking screenshots.
- Every meaningful test step captures a committed visual artifact.
- Visual comparisons use zero-pixel tolerance.
- Tests should wait for real UI conditions, not arbitrary timeouts.

## Hard Requirements

- Keep Playwright assertions and actions at or under 2000ms unless the exception is web server startup in CI.
- Do not use `page.waitForTimeout()` or arbitrary sleeps.
- Use role, label, and text locators instead of brittle CSS selectors.
- Use the unified step helper for assertions, screenshots, and generated scenario docs.
- Commit regenerated scenario `README.md` files and screenshots alongside E2E test changes.

## Directory Convention

Each E2E scenario lives in a numbered folder:

```text
tests/e2e/
├── helpers/
│   └── test-step-helper.ts
└── 001-homepage/
    ├── 001-homepage.spec.ts
    ├── README.md
    └── screenshots/
        └── 000-initial-load.png
```

## Unified Step Pattern

`TestStepHelper.step()` is the only place a scenario should combine verification, screenshot capture, and documentation.

```ts
import { expect, test } from '@playwright/test';
import { TestStepHelper } from '../helpers/test-step-helper';

test('homepage renders', async ({ page }, testInfo) => {
  const tester = new TestStepHelper(page, testInfo);
  tester.setMetadata('Homepage', 'The app shell renders.');

  await page.goto('/');

  await tester.step('initial-load', {
    description: 'Blank homepage is visible',
    verifications: [
      {
        spec: 'Welcome heading is visible',
        check: async () => {
          await expect(page.getByRole('heading', { name: 'welcome to studio city' })).toBeVisible();
        },
      },
    ],
  });

  tester.generateDocs();
});
```

The helper automatically:

- runs all verifications,
- waits for animations to settle,
- creates numbered screenshot names,
- compares screenshots against committed baselines, and
- generates the scenario README.

## Updating Screenshots

When an intentional UI change affects snapshots:

```sh
bun run test:e2e:update-snapshots
```

Review the changed screenshots and generated README before committing them.
