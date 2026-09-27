import { defineConfig, devices } from '@playwright/test';
import { randomBytes } from 'node:crypto';

const password = process.env.PWA_TEST_PASSWORD || randomBytes(24).toString('hex');
process.env.PWA_TEST_PASSWORD ||= password;
const port = Number(process.env.PWA_TEST_PORT) || 4179;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './browser-tests',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  workers: 1,
  reporter: 'list',
  use: { baseURL, trace: 'off', screenshot: 'off', video: 'off' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'galaxy-s25-plus', use: { ...devices['Desktop Chrome'], viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 } },
    { name: 'narrow-phone', use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 } }
  ],
  webServer: {
    command: `"${process.execPath}" dist/server.cjs`,
    url: `${baseURL}/healthz`,
    reuseExistingServer: false,
    timeout: 30_000,
    env: { NODE_ENV: 'production', PORT: String(port), APP_ACCESS_PASSWORD: password, COOKIE_SECRET: randomBytes(40).toString('hex'), GEMINI_API_KEY: '' }
  }
});
