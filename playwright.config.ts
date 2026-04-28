import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 2000,
  expect: {
    timeout: 2000,
    toHaveScreenshot: { maxDiffPixels: 0 },
  },
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    screenshot: 'on',
    actionTimeout: 2000,
    navigationTimeout: 2000,
    contextOptions: { reducedMotion: 'reduce' },
    serviceWorkers: 'block',
    launchOptions: {
      args: [
        '--font-render-hinting=none',
        '--disable-font-subpixel-positioning',
        '--disable-lcd-text',
        '--disable-skia-runtime-opts',
        '--disable-system-font-check',
        '--force-device-scale-factor=1',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--use-gl=swiftshader',
        '--disable-smooth-scrolling',
        '--disable-partial-raster',
      ],
    },
    timezoneId: 'America/Toronto',
    locale: 'en-CA',
  },
  snapshotPathTemplate: '{testDir}/{testFileDir}/screenshots/{arg}.png',
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1,
      },
    },
  ],
  webServer: {
    command: 'bun run dev:e2e:emulated',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: process.env.CI ? 60000 : 60000,
  },
});
