import { expect, test, type Page } from '@playwright/test';
import { TestStepHelper } from '../helpers/test-step-helper';

async function normalizeRoomCodeText(page: Page) {
  await page.evaluate(() => {
    function replaceTextNode(element: Element, replacer: (text: string) => string) {
      const textNode = Array.from(element.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
      if (textNode?.nodeValue !== undefined) {
        textNode.nodeValue = replacer(textNode.nodeValue);
      } else {
        element.textContent = replacer(element.textContent ?? '');
      }
    }

    document.querySelectorAll('.status-strip span:first-child').forEach((element) => {
      replaceTextNode(element, (text) => text.replace(/Room [A-Z]{4}/, 'Room TEST'));
    });

    document.querySelectorAll('.lobby-panel h1').forEach((element) => {
      replaceTextNode(element, (text) => text.replace(/Lobby: [A-Z]{4}/, 'Lobby: TEST'));
    });
  });
}

test('room listener replays joined player action', async ({ browser, page }, testInfo) => {
  const tester = new TestStepHelper(page, testInfo);
  tester.setMetadata(
    'Room Listener',
    'The room route listens to Firestore emulator actions, auto-joins linked visitors, and renders derived Redux state.',
  );

  await page.goto('/');
  await page.getByRole('button', { name: 'Create room' }).click();
  await page.waitForURL(/\/room\/[A-Z]{4}$/);
  const gameCode = new URL(page.url()).pathname.split('/').pop();
  expect(gameCode).toMatch(/^[A-Z]{4}$/);
  await page.getByLabel('Name for Player 1').fill('Stefan');
  await page.getByLabel('Name for Player 1').press('Enter');
  await expect(page.getByLabel('Name for Player 1')).toHaveValue('Stefan');
  await normalizeRoomCodeText(page);

  await tester.step('host-room', {
    description: 'Host creates a room',
    verifications: [
      {
        spec: 'Host appears in the lobby table',
        check: async () => {
          await expect(page.getByRole('table')).toBeVisible();
          await expect(page.getByLabel('Name for Player 1')).toHaveValue('Stefan');
          await expect(page.getByText('1 of 5 seats filled')).toBeVisible();
        },
      },
    ],
  });

  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();
  await guestPage.addInitScript(() => {
    localStorage.setItem('studio-city-player-name', 'Guest');
  });
  await guestPage.goto(`/room/${gameCode}`);

  await normalizeRoomCodeText(page);
  await normalizeRoomCodeText(guestPage);

  await tester.step('linked-guest-joined', {
    description: 'Room link auto-joins a guest',
    verifications: [
      {
        spec: 'Guest appears in the lobby table',
        check: async () => {
          await expect(guestPage.getByRole('table')).toBeVisible();
          await expect(guestPage.getByLabel('Name for Player 2')).toHaveValue('Guest');
          await expect(page.getByText('2 of 5 seats filled')).toBeVisible();
        },
      },
    ],
  });

  await page.getByRole('button', { name: 'Kick' }).click();
  await expect(guestPage.getByRole('heading', { name: 'Removed from Room' })).toBeVisible();
  await expect(page.getByText('1 of 5 seats filled')).toBeVisible();
  await normalizeRoomCodeText(page);

  await tester.step('guest-kicked', {
    description: 'Host removes a human player',
    verifications: [
      {
        spec: 'Removed guest is no longer seated and sees the removal notice',
        check: async () => {
          await expect(page.getByText('Guest')).toHaveCount(0);
          await expect(guestPage.getByText('You have been removed from this Studio City room by the host.')).toBeVisible();
        },
      },
    ],
  });

  await page.getByRole('button', { name: 'Add bot' }).click();
  await page.getByLabel('Name for Player 2').fill('Projectionist');
  await page.getByLabel('Name for Player 2').press('Enter');
  await expect(page.getByLabel('Name for Player 2')).toHaveValue('Projectionist');
  await normalizeRoomCodeText(page);

  await tester.step('bot-added-and-renamed', {
    description: 'Host can reserve and rename a future bot seat',
    verifications: [
      {
        spec: 'Bot occupies the reusable lobby seat with the edited name',
        check: async () => {
          await expect(page.getByLabel('Name for Player 2')).toHaveValue('Projectionist');
          await expect(page.getByText('Bots are lobby-only for now')).toBeVisible();
        },
      },
      {
        spec: 'Current implementation does not start with a bot',
        check: async () => {
          await expect(page.getByRole('button', { name: 'Start Game' })).toBeDisabled();
        },
      },
    ],
  });

  await page.getByRole('button', { name: 'Kick' }).click();
  await expect(page.getByText('1 of 5 seats filled')).toBeVisible();
  await normalizeRoomCodeText(page);

  await tester.step('bot-kicked', {
    description: 'Host removes a bot from its seat',
    verifications: [
      {
        spec: 'Bot seat becomes open again',
        check: async () => {
          await expect(page.getByLabel('Name for Player 2')).toHaveCount(0);
          await expect(page.getByText('Open seat')).toHaveCount(4);
        },
      },
    ],
  });

  tester.generateDocs();
  await guestContext.close();
});
