import { expect, test, type Page } from '@playwright/test';
import { MOVIE_DECK } from '../../../src/lib/game/cards';
import { TestStepHelper } from '../helpers/test-step-helper';

test.setTimeout(30000);

async function normalizeRandomGameContent(page: Page) {
  await page.evaluate(() => {
    document.querySelectorAll('.market-area .card .value').forEach((element) => {
      element.textContent = element.textContent?.includes('pts') ? '0 pts' : '0';
    });
    document.querySelectorAll('.market-area .card.contract strong').forEach((element, index) => {
      element.textContent = `Contract ${index + 1}`;
    });
    document.querySelectorAll('.market-area .card.contract .desc').forEach((element) => {
      element.textContent = 'Contract condition';
    });
    document.querySelectorAll('.market-area .card.contract.pickable').forEach((element) => {
      element.classList.remove('pickable');
    });
    document.querySelectorAll('.auction-notice').forEach((element) => {
      element.textContent = 'Contract selection is active.';
    });
    document.querySelectorAll('.hand-area .card.movie.playable').forEach((card, index) => {
      const title = card.querySelector('strong');
      if (title) title.textContent = `Movie ${index + 1}`;

      card.querySelectorAll('.ranks span').forEach((rank) => {
        rank.textContent = '0';
      });
    });
  });
}

test('started game shows the local player hand', async ({ browser, page }, testInfo) => {
  const tester = new TestStepHelper(page, testInfo);
  tester.setMetadata(
    'Start Game Hand',
    'Starting a game deals a private hand and renders real Studio City movie cards for the local player.',
  );

  await page.addInitScript(() => {
    const originalGetRandomValues = crypto.getRandomValues.bind(crypto);
    Object.defineProperty(crypto, 'getRandomValues', {
      value(array: Uint8Array) {
        if (array instanceof Uint8Array && array.length === 4) {
          array.set([7, 0, 13, 3]);
          return array;
        }

        return originalGetRandomValues(array);
      },
    });
  });

  await page.goto('/');
  await page.getByLabel('Player name').fill('Host');
  await page.getByRole('button', { name: 'Create room' }).click();

  await tester.step('host-lobby', {
    description: 'Host creates a room',
    verifications: [
      {
        spec: 'The host lobby is visible',
        check: async () => {
          await expect(page.getByRole('heading', { name: /^Lobby:/ })).toBeVisible();
        },
      },
    ],
  });

  const gameCode = new URL(page.url()).pathname.split('/').pop();
  expect(gameCode).toMatch(/^[A-Z]{4}$/);

  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();
  await guestPage.goto(`/room/${gameCode}`);
  await guestPage.getByLabel('Player name').fill('Guest');
  await guestPage.getByRole('button', { name: 'Join Game' }).click();

  await expect(page.getByText('Players (2)')).toBeVisible();
  await page.getByRole('button', { name: 'Start Game' }).click();

  const movieTitles = MOVIE_DECK.map((movie) => movie.title);
  const hostMovieCards = page.locator('.hand-area .card.movie.playable strong');

  await expect(hostMovieCards).toHaveCount(6);
  const dealtTitles = await hostMovieCards.allTextContents();
  expect(dealtTitles.every((title) => movieTitles.includes(title))).toBe(true);

  await normalizeRandomGameContent(page);

  await tester.step('dealt-hand', {
    description: 'Started game shows the host hand',
    verifications: [
      {
        spec: 'The local player sees six dealt movie cards',
        check: async () => {
          await expect(hostMovieCards).toHaveCount(6);
        },
      },
      {
        spec: 'Every dealt card title comes from the real card export',
        check: async () => expect(dealtTitles.every((title) => movieTitles.includes(title))).toBe(true),
      },
    ],
  });

  await page.locator('.hand-area .card.movie.playable').first().click();

  const guestMovieCards = guestPage.locator('.hand-area .card.movie.playable strong');
  await expect(guestMovieCards).toHaveCount(6);
  await guestPage.locator('.hand-area .card.movie.playable').first().click();

  await normalizeRandomGameContent(page);

  await tester.step('contract-auction', {
    description: 'Submitted movies advance the game to contract selection',
    verifications: [
      {
        spec: 'The round advances to the contract auction phase',
        check: async () => {
          await expect(page.getByText('Phase: contract auction')).toBeVisible();
        },
      },
      {
        spec: 'Both players received box office and review cards',
        check: async () => {
          await expect(page.getByText('BO: 1')).toHaveCount(2);
          await expect(page.getByText('Rev: 1')).toHaveCount(2);
          await normalizeRandomGameContent(page);
        },
      },
    ],
  });

  await guestContext.close();
  tester.generateDocs();
});
