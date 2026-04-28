#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const repoIndex = process.argv.indexOf('--repo');
const repo = repoIndex === -1 ? undefined : process.argv[repoIndex + 1];
const positional = [];
for (let index = 2; index < process.argv.length; index += 1) {
  if (process.argv[index] === '--repo') {
    index += 1;
    continue;
  }
  if (!process.argv[index].startsWith('--')) {
    positional.push(process.argv[index]);
  }
}
const fileArg = positional[0];

if (!repo) {
  console.error('Usage: scripts/set-firebase-secrets.mjs --repo OWNER/REPO [firebase-config-file]');
  process.exit(1);
}

const input = fileArg ? readFileSync(fileArg, 'utf8') : readFileSync(0, 'utf8');
const configMatch = input.match(/firebaseConfig\s*=\s*(\{[\s\S]*?\})\s*;/);
const rawConfig = configMatch?.[1] ?? input.trim();

const normalized = rawConfig
  .replace(/([{,]\s*)([A-Za-z0-9_]+)\s*:/g, '$1"$2":')
  .replace(/'/g, '"');

let config;
try {
  config = JSON.parse(normalized);
} catch (error) {
  console.error('Could not parse Firebase config stanza.');
  process.exit(1);
}

const mappings = [
  ['apiKey', 'FIREBASE_API_KEY'],
  ['authDomain', 'FIREBASE_AUTH_DOMAIN'],
  ['projectId', 'FIREBASE_PROJECT_ID'],
  ['storageBucket', 'FIREBASE_STORAGE_BUCKET'],
  ['messagingSenderId', 'FIREBASE_MESSAGING_SENDER_ID'],
  ['appId', 'FIREBASE_APP_ID'],
  ['measurementId', 'FIREBASE_MEASUREMENT_ID'],
];

for (const [field, secretName] of mappings) {
  if (!config[field]) {
    continue;
  }
  setSecret(secretName, config[field]);
  setSecret(`VITE_${secretName}`, config[field]);
}

setSecret('FIREBASE_CONFIG_JSON', JSON.stringify(config));
console.log('Firebase web config secrets were updated.');
console.log('Set FIREBASE_SERVICE_ACCOUNT separately for rules/functions deployment.');

function setSecret(name, value) {
  const result = spawnSync('gh', ['secret', 'set', name, '--repo', repo], {
    input: String(value),
    stdio: ['pipe', 'ignore', 'inherit'],
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
