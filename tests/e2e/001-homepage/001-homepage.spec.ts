import { expect, test } from '@playwright/test';
import { TestStepHelper } from '../helpers/test-step-helper';

test('homepage renders', async ({ page }, testInfo) => {
  const tester = new TestStepHelper(page, testInfo);
  tester.setMetadata('Homepage', 'The Studio City app shell renders the minimal room creation controls.');

  await page.goto('/');

  await tester.step('initial-load', {
    description: 'Homepage create-room control is visible',
    verifications: [
      {
        spec: 'Create room control is available',
        check: async () => {
          await expect(page.getByRole('button', { name: 'Create room' })).toBeVisible();
        },
      },
      {
        spec: 'Joining by code is not shown on the homepage',
        check: async () => {
          await expect(page.getByRole('button', { name: 'Join room' })).toHaveCount(0);
          await expect(page.getByLabel('Room code')).toHaveCount(0);
          await expect(page.getByLabel('Name')).toHaveCount(0);
        },
      },
    ],
  });

  tester.generateDocs();
});
