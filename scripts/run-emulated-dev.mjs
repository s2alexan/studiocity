import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: false,
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function withoutBunNodeShim(pathValue) {
  return pathValue
    .split(':')
    .filter((entry) => !entry.includes('/private/tmp/bun-node-'))
    .join(':');
}

run('node', ['scripts/free-emulator-ports.mjs']);
run('npm', ['run', 'build:functions']);

const env = {
  ...process.env,
  PATH: withoutBunNodeShim(process.env.PATH ?? ''),
};

delete env.NODE;
delete env.npm_node_execpath;

const localServiceAccount = join(
  process.env.HOME ?? '',
  'Downloads',
  'studio-city-service-account.json',
);

if (existsSync(localServiceAccount)) {
  env.GOOGLE_APPLICATION_CREDENTIALS = localServiceAccount;
}

run(
  'firebase',
  [
    'emulators:exec',
    '--project',
    'studiocity-f56c1',
    '--only',
    'firestore,functions',
    'npm run dev:e2e',
  ],
  { env },
);
