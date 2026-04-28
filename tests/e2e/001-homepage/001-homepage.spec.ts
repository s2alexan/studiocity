import { expect, test } from '@playwright/test';
import { TestStepHelper } from '../helpers/test-step-helper';

test('homepage renders', async ({ page }, testInfo) => {
  const tester = new TestStepHelper(page, testInfo);
  tester.setMetadata('Homepage', 'The Studio City app shell renders its initial blank homepage.');

  await page.goto('/');

  await tester.step('initial-load', {
    description: 'Blank homepage is visible',
    verifications: [
      {
        spec: 'The welcome heading is visible',
        check: async () => {
          await expect(page.getByRole('heading', { name: 'welcome to studio city' })).toBeVisible();
        },
      },
    ],
  });

  tester.generateDocs();
});
