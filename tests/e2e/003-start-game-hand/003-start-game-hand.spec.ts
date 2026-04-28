import { expect, test } from '@playwright/test';
import { MOVIE_DECK } from '../../../src/lib/game/cards';

test('started game shows the local player hand', async ({ browser, page }) => {
  await page.goto('/');
  await page.getByLabel('Player name').fill('Host');
  await page.getByRole('button', { name: 'Create room' }).click();
  await expect(page.getByRole('heading', { name: /^Lobby:/ })).toBeVisible();

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

  await guestContext.close();
});
