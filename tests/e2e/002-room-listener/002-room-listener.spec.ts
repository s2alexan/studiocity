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
  await page.getByLabel('Name').fill('Stefan');
  await page.getByRole('button', { name: 'Create room' }).click();
  await page.waitForURL(/\/room\/[A-Z]{4}$/);
  const gameCode = new URL(page.url()).pathname.split('/').pop();
  expect(gameCode).toMatch(/^[A-Z]{4}$/);
  await normalizeRoomCodeText(page);

  await tester.step('host-room', {
    description: 'Host creates a room',
    verifications: [
      {
        spec: 'Host appears in the lobby table',
        check: async () => {
          await expect(page.getByRole('table')).toBeVisible();
          await expect(page.getByText('Stefan')).toBeVisible();
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
          await expect(guestPage.getByText('Guest')).toBeVisible();
          await expect(page.getByText('2 of 5 seats filled')).toBeVisible();
        },
      },
    ],
  });

  await page.getByRole('button', { name: 'Add bot' }).click();
  await normalizeRoomCodeText(page);

  await tester.step('bot-added', {
    description: 'Host can reserve a future bot seat',
    verifications: [
      {
        spec: 'Bot occupies the next lobby seat',
        check: async () => {
          await expect(page.getByText('Bot 3')).toBeVisible();
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

  tester.generateDocs();
  await guestContext.close();
});
