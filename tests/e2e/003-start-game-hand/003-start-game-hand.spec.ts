import { expect, test, type Page } from '@playwright/test';
import { MOVIE_DECK } from '../../../src/lib/game/cards';
import { TestStepHelper } from '../helpers/test-step-helper';

test.setTimeout(60000);

async function normalizeRandomGameContent(page: Page) {
  await page.evaluate(async () => {
    function replaceTextNode(element: Element, nextText: string) {
      const textNode = Array.from(element.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
      if (textNode?.nodeValue !== undefined) {
        textNode.nodeValue = nextText;
      } else {
        element.textContent = nextText;
      }
    }

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const fixedArt = {
      movie: '/card-art/faces/movie_1.png',
      boxOffice: '/card-art/faces/money/1.png',
      review: '/card-art/faces/review/1.png',
      contract: '/card-art/faces/contract_1.png',
    };

    document.querySelectorAll<HTMLImageElement>('.market-area .card.box-office img').forEach((image) => {
      image.src = fixedArt.boxOffice;
    });
    document.querySelectorAll<HTMLImageElement>('.market-area .card.review img').forEach((image) => {
      image.src = fixedArt.review;
    });
    document.querySelectorAll<HTMLImageElement>('.market-area .card.contract img').forEach((image) => {
      image.src = fixedArt.contract;
    });
    document.querySelectorAll<HTMLElement>('.market-area .card.contract').forEach((element) => {
      element.classList.remove('pickable');
      element.style.opacity = '0.72';
    });
    document.querySelectorAll<HTMLElement>('.played-movie-slot.active-player').forEach((element) => {
      element.classList.remove('active-player');
    });
    document.querySelectorAll('.auction-notice').forEach((element) => {
      replaceTextNode(element, 'Contract selection is active.');
    });
    document.querySelectorAll('.status-strip span:nth-child(2)').forEach((element) => {
      if (element.textContent?.includes('pick a contract')) {
        replaceTextNode(element, 'Contract selection');
      }
    });
    document.querySelectorAll<HTMLImageElement>('.hand-area .card.movie.playable img').forEach((image) => {
      image.src = fixedArt.movie;
    });
    document.querySelectorAll<HTMLImageElement>('.played-movies .card.movie img').forEach((image) => {
      image.src = fixedArt.movie;
    });
    document.querySelectorAll('.player-boards .stat').forEach((stat) => {
      const image = stat.querySelector('img')?.cloneNode(true);
      stat.replaceChildren();
      if (image) stat.append(image);
      stat.append('0');
      stat.setAttribute('aria-label', '0 normalized stat');
    });
    const contractLists = Array.from(document.querySelectorAll('.player-boards .contract-list'));
    const hasContracts = contractLists.some((list) => list.querySelector('li:not(.empty-contracts)'));
    if (hasContracts) {
      contractLists.forEach((list, index) => {
        if (index === 0) {
          list.innerHTML = `
            <li class="contract-row-summary tbd">
              <span class="contract-state-icon" aria-label="Contract is still possible">?</span>
              <strong class="contract-value">0:&nbsp;</strong>
              <span class="contract-condition">
                <strong>9-14</strong>
                <img
                  class="condition-icon"
                  src="/ui/icons/star.png"
                  alt="normalized icon"
                  style="width: 0.82rem; height: 0.82rem; object-fit: contain;"
                >
              </span>
            </li>
          `;
          return;
        }

        list.innerHTML = '<li class="empty-contracts">No contracts</li>';
      });
    }
    document.querySelectorAll('.summary-table .final-contract').forEach((contract) => {
      contract.className = 'contract-row-summary final-contract tbd';
      contract.innerHTML = `
        <span class="contract-state-icon" aria-label="Contract is still possible">?</span>
        <strong class="contract-value">0:&nbsp;</strong>
        <span class="contract-condition">
          <strong>9-14</strong>
          <img
            class="condition-icon"
            src="/ui/icons/star.png"
            alt="normalized icon"
            style="width: 0.82rem; height: 0.82rem; object-fit: contain;"
          >
        </span>
      `;
    });

    await Promise.all(
      Array.from(document.images).map((image) => {
        if (image.complete) return Promise.resolve();
        return image.decode().catch(() => undefined);
      }),
    );
  });
}

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

async function normalizeFinalSummary(page: Page) {
  await page.evaluate(async () => {
    document.querySelectorAll('.summary-table .winner-column').forEach((element) => {
      element.classList.remove('winner-column');
    });

    document.querySelectorAll('.summary-table .bill-score, .summary-table .final-score').forEach((score) => {
      score.textContent = '0';
    });

    document.querySelectorAll('.summary-table .final-contract').forEach((contract) => {
      contract.className = 'contract-row-summary final-contract tbd';
      contract.innerHTML = `
        <span class="contract-state-icon" aria-label="Contract is still possible">?</span>
        <strong class="contract-value">0:&nbsp;</strong>
        <span class="contract-condition">
          <strong>9-14</strong>
          <img
            class="condition-icon"
            src="/ui/icons/star.png"
            alt="normalized icon"
            style="width: 0.82rem; height: 0.82rem; object-fit: contain;"
          >
        </span>
      `;
    });

    await Promise.all(
      Array.from(document.images).map((image) => {
        if (image.complete) return Promise.resolve();
        return image.decode().catch(() => undefined);
      }),
    );
  });
}

async function expectPlayersReceivedAwards(page: Page) {
  const summaries = await page.locator('.player-boards .board').evaluateAll((boards) => {
    return boards.map((board) => {
      const labels = Array.from(board.querySelectorAll('.stat')).map((stat) => stat.getAttribute('aria-label') ?? '');
      const bills = Number(labels.find((label) => label.endsWith(' bills'))?.match(/^\d+/)?.[0] ?? 0);
      const stars = Number(labels.find((label) => label.endsWith(' stars'))?.match(/^\d+/)?.[0] ?? 0);
      return { bills, stars };
    });
  });

  expect(summaries).toHaveLength(2);
  expect(summaries.every((summary) => summary.bills > 0)).toBe(true);
  expect(summaries.every((summary) => summary.stars > 0)).toBe(true);
}

async function pageWithContractTurn(hostPage: Page, guestPage: Page) {
  const hostHasTurn = await hostPage.getByRole('button', { name: /^Choose / }).first().isVisible();
  return hostHasTurn ? hostPage : guestPage;
}

async function chooseNextContract(...pages: Page[]) {
  for (let attempt = 0; attempt < 50; attempt++) {
    for (const candidate of pages) {
      const button = candidate.locator('.market-area button.card.contract:not([disabled])').first();
      if ((await button.isVisible().catch(() => false)) && (await button.isEnabled().catch(() => false))) {
        await button.click();
        await candidate.waitForTimeout(300);
        return;
      }
    }
    await pages[0].waitForTimeout(100);
  }

  throw new Error('No page had an enabled contract choice.');
}

async function playSelectionRound(hostPage: Page, guestPage: Page) {
  await hostPage.locator('.hand-area .card.movie.playable').first().click();
  await guestPage.locator('.hand-area .card.movie.playable').first().click();
  await expect(hostPage.locator('.status-strip')).toContainText('pick a contract');
  await chooseNextContract(hostPage, guestPage);
  await chooseNextContract(hostPage, guestPage);
}

test('started game shows the local player hand', async ({ browser, page }, testInfo) => {
  const tester = new TestStepHelper(page, testInfo);
  tester.setMetadata(
    'Start Game Hand',
    'Starting a game deals a private hand and renders real Studio City movie cards for the local player.',
  );

  await page.goto('/');
  await page.getByLabel('Player name').fill('Host');
  await page.getByRole('button', { name: 'Create room' }).click();
  await normalizeRoomCodeText(page);

  await tester.step('host-lobby', {
    description: 'Host creates a room',
    verifications: [
      {
        spec: 'The host lobby is visible',
        check: async () => {
          await expect(page.getByRole('heading', { name: /^Lobby:/ })).toBeVisible();
          await normalizeRoomCodeText(page);
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
  const hostMovieCards = page.locator('.hand-area .card.movie.playable');
  const hostMovieImages = page.locator('.hand-area .card.movie.playable img.card-art');

  await expect(hostMovieCards).toHaveCount(6);
  await expect(hostMovieImages).toHaveCount(6);
  const dealtTitles = await hostMovieImages.evaluateAll((images) =>
    images.map((image) => image.getAttribute('alt') ?? ''),
  );
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
        spec: 'Every dealt card image comes from the real card export',
        check: async () => expect(dealtTitles.every((title) => movieTitles.includes(title))).toBe(true),
      },
    ],
  });

  await page.locator('.hand-area .card.movie.playable').first().click();

  const guestMovieCards = guestPage.locator('.hand-area .card.movie.playable');
  await expect(guestMovieCards).toHaveCount(6);
  await guestPage.locator('.hand-area .card.movie.playable').first().click();

  await expect(page.locator('.status-strip')).toContainText('pick a contract');
  await expectPlayersReceivedAwards(page);
  const contractPickerPage = await pageWithContractTurn(page, guestPage);

  await tester.step('contract-auction', {
    description: 'Submitted movies advance the game to contract selection',
    verifications: [
      {
        spec: 'The round advances to the contract auction phase',
        check: async () => {
          await expect(page.locator('.status-strip')).toContainText('pick a contract');
        },
      },
      {
        spec: 'Both players received box office and review cards',
        check: async () => {
          await expectPlayersReceivedAwards(page);
          await normalizeRandomGameContent(page);
        },
      },
    ],
  });

  await contractPickerPage.getByRole('button', { name: /^Choose / }).first().click();

  await tester.step('contract-picked', {
    description: 'Current contract picker claims a contract',
    verifications: [
      {
        spec: 'A player receives the selected contract',
        check: async () => {
          await expect(page.locator('.player-boards .contract-list li:not(.empty-contracts)')).toHaveCount(1);
        },
      },
      {
        spec: 'The remaining contract choices stay available for the next picker',
        check: async () => {
          await expect(page.locator('.market-area .card.contract')).toHaveCount(2);
          await normalizeRandomGameContent(page);
        },
      },
    ],
  });

  await chooseNextContract(page, guestPage);

  for (let round = 2; round <= 5; round++) {
    await expect(page.locator('.status-strip')).toContainText(`Round ${round} of 5`);
    await playSelectionRound(page, guestPage);
  }

  await expect(page.locator('.status-strip')).toContainText('Game complete - click here for summary');
  await expect(page.locator('.game-over-panel')).toHaveCount(0);
  await page.getByRole('button', { name: 'Game complete - click here for summary' }).click();
  await expect(page.getByRole('heading', { name: 'Game Summary' })).toBeVisible();
  await expect(page.locator('.summary-table')).toBeVisible();
  await expect(page.locator('.summary-table tfoot .final-score')).toHaveCount(2);

  await normalizeRoomCodeText(page);
  await normalizeFinalSummary(page);

  await tester.step('game-summary', {
    description: 'Summary opens only after the final round review',
    verifications: [
      {
        spec: 'The final summary table is visible after clicking the game complete status',
        check: async () => {
          await expect(page.getByRole('heading', { name: 'Game Summary' })).toBeVisible();
          await expect(page.locator('.summary-table')).toBeVisible();
        },
      },
    ],
  });

  await guestContext.close();
  tester.generateDocs();
});
