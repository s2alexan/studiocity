import { expect, test } from '@playwright/test';
import { TestStepHelper } from '../helpers/test-step-helper';

test('room listener replays joined player action', async ({ page }, testInfo) => {
  const tester = new TestStepHelper(page, testInfo);
  tester.setMetadata(
    'Room Listener',
    'The room route listens to Firestore emulator actions and renders derived Redux state.',
  );

  await page.goto('/room/ABCD');

  await tester.step('initial-room', {
    description: 'Room route is ready',
    verifications: [
      {
        spec: 'Room code is visible in the join panel',
        check: async () => {
          await expect(page.getByText('ABCD')).toBeVisible();
        },
      },
    ],
  });

  await page.getByRole('textbox', { name: 'Player name' }).fill('Stefan');
  await page.getByRole('button', { name: 'Join Game' }).click();

  await tester.step('joined-room', {
    description: 'Joined player is derived from replayed actions',
    verifications: [
      {
        spec: 'Lobby shows the player count',
        check: async () => {
          await expect(page.getByText('Players (1)')).toBeVisible();
        },
      },
      {
        spec: 'Joined player appears in the room',
        check: async () => {
          await expect(page.getByText('Stefan')).toBeVisible();
        },
      },
    ],
  });

  tester.generateDocs();
});
